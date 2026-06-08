import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { z } from 'zod'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function openai() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

const bodySchema = z.object({
  submission_id: z.string().uuid(),
})

// Human-readable labels for field_keys
const FIELD_LABELS: Record<string, string> = {
  weight_kg: 'Poids (kg)',
  height_cm: 'Taille (cm)',
  body_fat_pct: 'Masse grasse (%)',
  lean_mass_kg: 'Masse maigre (kg)',
  muscle_mass_kg: 'Masse musculaire (kg)',
  visceral_fat_level: 'Graisse viscérale (niveau)',
  bmr_kcal_measured: 'BMR mesuré (kcal)',
  waist_cm: 'Tour de taille (cm)',
  hips_cm: 'Tour de hanches (cm)',
  arm_cm: 'Tour de bras (cm)',
  chest_cm: 'Tour de poitrine (cm)',
  thigh_cm: 'Tour de cuisse (cm)',
  calf_cm: 'Tour de mollet (cm)',
  sleep_duration_h: 'Sommeil (h/nuit)',
  sleep_quality: 'Qualité du sommeil (1-5)',
  stress_level: 'Niveau de stress (1-10)',
  energy_level: 'Niveau d\'énergie (1-10)',
  daily_steps: 'Pas quotidiens',
  weekly_frequency: 'Fréquence entraînement (séances/semaine)',
  session_duration_min: 'Durée séance (min)',
  cardio_frequency: 'Fréquence cardio (séances/semaine)',
}

/**
 * POST /api/clients/[clientId]/ai-bilan-analysis
 * Body: { submission_id: uuid }
 *
 * Reads the completed assessment submission + previous submission for delta.
 * GPT-4o generates a structured coach report (observations, évolutions, alertes, recommandations).
 * Saved as metric_annotation event_type='ai_analysis'.
 *
 * Returns { annotation_id, report }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { submission_id } = body.data
  const db = svc()

  // Ownership + client info
  const { data: cc } = await db
    .from('coach_clients')
    .select('id, first_name, last_name, gender, date_of_birth, training_goal')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Target submission
  const { data: sub } = await db
    .from('assessment_submissions')
    .select('id, bilan_date, submitted_at, assessment_responses(field_key, value_number, value_text)')
    .eq('id', submission_id)
    .eq('client_id', clientId)
    .single()

  if (!sub) return NextResponse.json({ error: 'Bilan introuvable.' }, { status: 404 })

  // Previous submission for delta comparison
  const subDate = (sub as any).bilan_date ?? (sub as any).submitted_at
  const { data: prevSubs } = await db
    .from('assessment_submissions')
    .select('id, bilan_date, submitted_at, assessment_responses(field_key, value_number)')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .lt('submitted_at', (sub as any).submitted_at)
    .order('submitted_at', { ascending: false })
    .limit(1)

  const prevSub = prevSubs?.[0] ?? null

  // Build current values map
  const current: Record<string, number | string> = {}
  for (const r of (sub as any).assessment_responses ?? []) {
    if (r.value_number != null) current[r.field_key] = r.value_number
    else if (r.value_text) current[r.field_key] = r.value_text
  }

  // Build previous values map
  const previous: Record<string, number> = {}
  if (prevSub) {
    for (const r of (prevSub as any).assessment_responses ?? []) {
      if (r.value_number != null) previous[r.field_key] = r.value_number
    }
  }

  // Build readable bilan text
  const bilanLines: string[] = []
  for (const [key, val] of Object.entries(current)) {
    const label = FIELD_LABELS[key] ?? key
    const prev = previous[key]
    const delta = typeof val === 'number' && prev != null
      ? ` (${val > prev ? '+' : ''}${(val - prev).toFixed(1)} vs bilan précédent)`
      : ''
    bilanLines.push(`- ${label}: ${val}${delta}`)
  }

  const age = cc.date_of_birth
    ? new Date().getFullYear() - new Date(cc.date_of_birth).getFullYear()
    : null

  const prompt = `Tu es un assistant coach sportif expert en physiologie et composition corporelle.
Analyse ce bilan de composition corporelle et génère un rapport structuré pour le coach.

CLIENT:
- Prénom: ${cc.first_name ?? 'Client'}
- Genre: ${cc.gender ?? 'non renseigné'}
- Âge: ${age ?? 'non renseigné'} ans
- Objectif: ${cc.training_goal ?? 'non renseigné'}
- Date du bilan: ${subDate}

DONNÉES DU BILAN:
${bilanLines.join('\n')}
${prevSub ? '\n(Les deltas vs bilan précédent sont indiqués entre parenthèses)' : '\n(Premier bilan — pas de comparaison disponible)'}

INSTRUCTIONS:
Génère un rapport structuré en JSON avec exactement ces 4 clés:
{
  "observations": "Résumé factuel des données clés en 2-3 phrases",
  "evolutions": "Analyse des changements notables depuis le bilan précédent (ou premier bilan si N/A)",
  "alertes": "Points d'attention médicaux ou de performance (seuils, risques, anomalies) — null si aucun",
  "recommandations": "3 recommandations concrètes et actionnables pour le coach (nutrition, entraînement, récupération)"
}

Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans texte avant ou après.`

  const completion = await openai().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
  let report: Record<string, string | null>
  try {
    report = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'GPT returned invalid JSON.', raw }, { status: 500 })
  }

  // ── Save as metric_annotation ─────────────────────────────────────────────
  const annotationBody = [
    report.observations && `**Observations**\n${report.observations}`,
    report.evolutions  && `**Évolutions**\n${report.evolutions}`,
    report.alertes     && `**⚠ Alertes**\n${report.alertes}`,
    report.recommandations && `**Recommandations**\n${report.recommandations}`,
  ].filter(Boolean).join('\n\n')

  const { data: annotation, error: annErr } = await db
    .from('metric_annotations')
    .insert({
      client_id:   clientId,
      coach_id:    user.id,
      event_type:  'ai_analysis',
      event_date:  subDate,
      label:       `Analyse IA — bilan ${new Date(subDate).toLocaleDateString('fr-FR')}`,
      note:        annotationBody,
      is_ai_draft: true,
    })
    .select('id')
    .single()

  if (annErr) {
    // Return report even if save fails
    return NextResponse.json({ annotation_id: null, report, saved: false })
  }

  return NextResponse.json({ annotation_id: annotation.id, report, saved: true })
}
