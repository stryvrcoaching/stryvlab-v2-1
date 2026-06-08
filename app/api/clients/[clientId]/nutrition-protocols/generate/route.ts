import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { calculateMacros, type MacroGoal, type MacroGender } from '@/lib/formulas/macros'
import { calculateHydration } from '@/lib/formulas/hydration'
import { calculateCarbCycling } from '@/lib/formulas/carbCycling'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const CLIENT_GOAL_MAP: Record<string, MacroGoal> = {
  fat_loss: 'deficit', weight_loss: 'deficit', sèche: 'deficit', cut: 'deficit',
  muscle_gain: 'surplus', hypertrophy: 'surplus', prise_de_masse: 'surplus', bulk: 'surplus',
  maintenance: 'maintenance', recomposition: 'maintenance',
}

const OCCUPATION_MULTIPLIER_MAP: Record<string, number> = {
  'Sédentaire (bureau)': 1.0,
  'Légèrement actif': 1.05,
  'Modérément actif': 1.10,
  'Très actif (travail physique)': 1.18,
}

/**
 * POST /api/clients/[clientId]/nutrition-protocols/generate
 *
 * Generates a complete nutrition protocol draft from the client's assessment data.
 * No coach input required — fully deterministic using calculateMacros() + hydration.
 *
 * Generates 3 days by default:
 *   - Jour Entraînement  (training day)
 *   - Jour Repos         (rest day)  — calories −8%
 *   - Jour Repos intense (high-stress rest) — calories −12%
 *
 * If carb cycling is viable (goal=deficit/surplus, BF% available): adds CC high/low variants.
 *
 * Returns the created protocol with status='draft'.
 * Coach can review → share in 1 click.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()

  // ── Ownership check ───────────────────────────────────────────────────────
  const { data: cc } = await db
    .from('coach_clients')
    .select('id, first_name, last_name, gender, date_of_birth, training_goal, weekly_frequency, sport_practice')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()

  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // ── Fetch latest assessment data ──────────────────────────────────────────
  const { data: submissions } = await db
    .from('assessment_submissions')
    .select(`id, submitted_at, assessment_responses(field_key, value_number, value_text)`)
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: false })
    .limit(5)

  // Build biometric + lifestyle snapshot (most-recent-wins)
  type BioKey = 'weight_kg' | 'height_cm' | 'body_fat_pct' | 'lean_mass_kg' | 'muscle_mass_kg'
    | 'bmr_kcal_measured' | 'visceral_fat_level' | 'session_duration_min' | 'training_calories'
    | 'daily_steps' | 'cardio_frequency' | 'cardio_duration_min' | 'caffeine_daily_mg'
    | 'alcohol_weekly' | 'work_hours_per_week' | 'stress_level' | 'sleep_duration_h'
    | 'sleep_quality'

  const bio: Partial<Record<BioKey, number>> = {}
  let occupation: string | null = null

  const NUMERIC_FIELDS: BioKey[] = [
    'weight_kg', 'height_cm', 'body_fat_pct', 'lean_mass_kg', 'muscle_mass_kg',
    'bmr_kcal_measured', 'visceral_fat_level', 'session_duration_min', 'training_calories',
    'daily_steps', 'cardio_frequency', 'cardio_duration_min', 'caffeine_daily_mg',
    'alcohol_weekly', 'work_hours_per_week', 'stress_level', 'sleep_duration_h', 'sleep_quality',
  ]

  for (const sub of submissions ?? []) {
    const responses = (sub as any).assessment_responses as { field_key: string; value_number: number | null; value_text: string | null }[]
    for (const r of responses ?? []) {
      if (NUMERIC_FIELDS.includes(r.field_key as BioKey) && r.value_number != null && bio[r.field_key as BioKey] == null) {
        bio[r.field_key as BioKey] = r.value_number
      }
      if (r.field_key === 'occupation' && r.value_text && !occupation) {
        occupation = r.value_text
      }
    }
  }

  // ── Validate minimum data ─────────────────────────────────────────────────
  if (!bio.weight_kg || !bio.height_cm) {
    return NextResponse.json(
      { error: 'Données insuffisantes : poids et taille requis dans un bilan complété.' },
      { status: 422 },
    )
  }

  // ── Derive age ────────────────────────────────────────────────────────────
  let age = 30 // fallback
  if (cc.date_of_birth) {
    const dob = new Date(cc.date_of_birth)
    const today = new Date()
    age = today.getFullYear() - dob.getFullYear()
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--
  }

  const gender: MacroGender = (cc.gender ?? 'male') === 'female' ? 'female' : 'male'
  const goal: MacroGoal = CLIENT_GOAL_MAP[(cc.training_goal ?? '').toLowerCase()] ?? 'maintenance'
  const weeklyFreq = cc.weekly_frequency ?? 3

  // ── Build MacroInput ──────────────────────────────────────────────────────
  const macroInput = {
    weight:               bio.weight_kg,
    height:               bio.height_cm,
    age,
    gender,
    goal,
    bodyFat:              bio.body_fat_pct ?? undefined,
    muscleMassKg:         bio.muscle_mass_kg ?? undefined,
    bmrKcalMeasured:      bio.bmr_kcal_measured ?? undefined,
    visceralFatLevel:     bio.visceral_fat_level ?? undefined,
    steps:                bio.daily_steps ?? undefined,
    occupationMultiplier: occupation ? (OCCUPATION_MULTIPLIER_MAP[occupation] ?? undefined) : undefined,
    workHoursPerWeek:     bio.work_hours_per_week ?? undefined,
    workouts:             weeklyFreq,
    sessionDurationMin:   bio.session_duration_min ?? 60,
    trainingCaloriesWeekly: bio.training_calories ?? undefined,
    cardioFrequency:      bio.cardio_frequency ?? undefined,
    cardioDurationMin:    bio.cardio_duration_min ?? undefined,
    stressLevel:          bio.stress_level ?? undefined,
    sleepDurationH:       bio.sleep_duration_h ?? undefined,
    sleepQuality:         bio.sleep_quality ?? undefined,
    caffeineDaily:        bio.caffeine_daily_mg ?? undefined,
    alcoholWeekly:        bio.alcohol_weekly ?? undefined,
  }

  const result = calculateMacros(macroInput)

  // ── Hydration ─────────────────────────────────────────────────────────────
  const actLevel: 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete' =
    weeklyFreq === 0 ? 'sedentary'
    : weeklyFreq <= 2 ? 'light'
    : weeklyFreq <= 3 ? 'moderate'
    : weeklyFreq <= 5 ? 'intense'
    : 'athlete'

  const hydResult = calculateHydration({ weight: bio.weight_kg, gender, activity: actLevel, climate: 'temperate' })
  const hydration_ml = Math.round(hydResult.liters * 1000)

  // ── Generate days ─────────────────────────────────────────────────────────
  const trainCal  = result.calories
  const restCal   = Math.round(result.calories * 0.92)  // −8%
  const { p, f, c } = result.macros

  // Rest macros: keep protein stable, reduce carbs
  const restCarbs = Math.max(0, Math.round(c * 0.75))
  const restCalsFromPF = p * 4 + f * 9
  const restCalsFinal = Math.max(restCalsFromPF + restCarbs * 4, restCal)

  type DayDef = {
    name: string; position: number; calories: number
    protein_g: number; carbs_g: number; fat_g: number
    hydration_ml: number; carb_cycle_type: string | null
    recommendations: string | null
  }

  const days: DayDef[] = [
    {
      name: 'Jour Entraînement',
      position: 0,
      calories:   trainCal,
      protein_g:  p,
      carbs_g:    c,
      fat_g:      f,
      hydration_ml,
      carb_cycle_type: null,
      recommendations: result.smartProtocol
        .filter(s => s.priority === 'critical' || s.priority === 'high')
        .slice(0, 2)
        .map(s => `• ${s.title} — ${s.action}`)
        .join('\n') || null,
    },
    {
      name: 'Jour Repos',
      position: 1,
      calories:   restCalsFinal,
      protein_g:  p,
      carbs_g:    restCarbs,
      fat_g:      f,
      hydration_ml: Math.round(hydration_ml * 0.85),
      carb_cycle_type: null,
      recommendations: null,
    },
  ]

  // Add carb cycling days if viable (has BF%, non-maintenance goal)
  if (bio.body_fat_pct != null && goal !== 'maintenance' && weeklyFreq >= 3) {
    const ccInput = {
      gender,
      age,
      weight: bio.weight_kg,
      height: bio.height_cm,
      bodyFat: bio.body_fat_pct,
      occupation: 'sedentaire' as const,
      sessionsPerWeek: weeklyFreq,
      sessionDuration: bio.session_duration_min ?? 60,
      intensity: weeklyFreq >= 5 ? 'intense' as const : 'moderee' as const,
      goal: goal === 'deficit' ? 'moderate' as const : 'bulk' as const,
      phase: 'hypertrophie' as const,
      protocol: '3/1' as const,
      insulin: 'normale' as const,
    }
    const cc_result = calculateCarbCycling(ccInput)

    days.push(
      {
        name: 'Jour Haut (CC)',
        position: 2,
        calories:   cc_result.high.kcal,
        protein_g:  cc_result.high.p,
        carbs_g:    cc_result.high.c,
        fat_g:      cc_result.high.f,
        hydration_ml,
        carb_cycle_type: 'high',
        recommendations: 'Jour glucides élevés — séance entraînement intense recommandée.',
      },
      {
        name: 'Jour Bas (CC)',
        position: 3,
        calories:   cc_result.low.kcal,
        protein_g:  cc_result.low.p,
        carbs_g:    cc_result.low.c,
        fat_g:      cc_result.low.f,
        hydration_ml: Math.round(hydration_ml * 0.85),
        carb_cycle_type: 'low',
        recommendations: 'Jour glucides bas — priorité lipides et protéines.',
      },
    )
  }

  // ── Persist protocol as draft ─────────────────────────────────────────────
  const clientName = [cc.first_name, cc.last_name].filter(Boolean).join(' ')
  const goalLabels: Record<MacroGoal, string> = { deficit: 'Sèche', surplus: 'Prise de masse', maintenance: 'Maintenance' }
  const protocolName = `${goalLabels[goal]} — ${clientName} (IA)`

  const { data: protocol, error: protoError } = await db
    .from('nutrition_protocols')
    .insert({
      client_id: clientId,
      coach_id: user.id,
      name: protocolName,
      status: 'draft',
      notes: `Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}.\nTDEE calculé : ${result.tdee} kcal | Objectif : ${result.calories} kcal | BMR source : ${result.dataProvenance.bmrSource}`,
    })
    .select('*')
    .single()

  if (protoError || !protocol) {
    return NextResponse.json({ error: protoError?.message ?? 'Failed to create protocol' }, { status: 500 })
  }

  const { data: insertedDays, error: daysError } = await db
    .from('nutrition_protocol_days')
    .insert(days.map(d => ({ ...d, protocol_id: protocol.id })))
    .select('*')

  if (daysError) {
    // Rollback protocol
    await db.from('nutrition_protocols').delete().eq('id', protocol.id)
    return NextResponse.json({ error: daysError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      protocol: { ...protocol, days: insertedDays ?? [] },
      meta: {
        tdee:            result.tdee,
        calories:        result.calories,
        goal,
        bmrSource:       result.dataProvenance.bmrSource,
        lbmSource:       result.dataProvenance.lbmSource,
        warnings:        result.warnings,
        hasCarbCycling:  days.some(d => d.carb_cycle_type != null),
      },
    },
    { status: 201 },
  )
}
