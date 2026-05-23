import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { computeNutritionAlerts } from '@/lib/client/smart/nutritionAlerts'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'
import type { GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import { type ClientLang } from '@/lib/i18n/clientTranslations'
import { computeMacroEnergy } from '@/lib/nutrition/energy'
import NutritionClientPage from './NutritionClientPage'

type SearchParams = { date?: string }

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function ClientNutritionPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id, gender')
  if (!client) return null

  const date = searchParams.date ?? computePhysiologicalDate(new Date())
  const dayStart = `${date}T00:00:00Z`
  const dayEnd   = `${date}T23:59:59Z`
  const clientId = client.id

  // ── Parallel fetches (all direct Supabase, no loopback HTTP) ──────────────
  const [protoResult, mealsResult, waterResult, weightResult, trendResult, streakResult, prefsResult] = await Promise.allSettled([
    svc()
      .from('nutrition_protocols')
      .select('tdee_adaptive, tdee_data_source, nutrition_protocol_days(name, calories, protein_g, carbs_g, fat_g, hydration_ml, carb_cycle_type, cycle_sync_phase, recommendations)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Meals with full entries for the journal list
    svc()
      .from('nutrition_meals')
      .select(`
        id, meal_type, title, logged_at, physiological_date,
        total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g,
        photo_urls, notes,
        nutrition_entries (
          id, quantity_g, calories_kcal, protein_g, carbs_g, fat_g, fiber_g,
          input_mode, confidence_score,
          food_items (id, name_fr, category_l1, item_key, kcal_per_100g)
        )
      `)
      .eq('client_id', clientId)
      .eq('physiological_date', date)
      .neq('meal_type', 'drinks')
      .order('logged_at', { ascending: true }),

    svc()
      .from('client_water_logs')
      .select('amount_ml, logged_at')
      .eq('client_id', clientId)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),

    // Latest body weight from assessments
    svc()
      .from('assessment_responses')
      .select('numeric_value')
      .eq('client_id', clientId)
      .eq('field_key', 'weight_kg')
      .not('numeric_value', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Weekly trend: last 7 days — full macros for grid
    (async () => {
      const today = new Date()
      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
      }
      return svc()
        .from('nutrition_meals')
        .select('physiological_date, total_calories, total_protein_g, total_carbs_g, total_fat_g')
        .eq('client_id', clientId)
        .neq('meal_type', 'drinks')
        .in('physiological_date', days)
    })(),

    // 90-day logged dates for streak + calendar
    (async () => {
      const d90ago = new Date()
      d90ago.setDate(d90ago.getDate() - 89)
      const from90 = d90ago.toISOString().slice(0, 10)
      return svc()
        .from('nutrition_meals')
        .select('physiological_date')
        .eq('client_id', clientId)
        .neq('meal_type', 'drinks')
        .gte('physiological_date', from90)
        .order('physiological_date', { ascending: true })
    })(),

    // Client language preference
    svc()
      .from('client_preferences')
      .select('language')
      .eq('client_id', clientId)
      .maybeSingle(),
  ])

  // ── Body weight ───────────────────────────────────────────────────────────
  const bodyWeightRow = weightResult.status === 'fulfilled' ? weightResult.value.data : null
  const bodyWeightKg = bodyWeightRow?.numeric_value ? Number(bodyWeightRow.numeric_value) : null

  // ── Protocol day ──────────────────────────────────────────────────────────
  const protoData = protoResult.status === 'fulfilled' ? protoResult.value.data : null
  const protocolDay = (protoData?.nutrition_protocol_days as any)?.[0] ?? null
  const tdeeAdaptive = (protoData as any)?.tdee_adaptive ?? null
  const tdeeDataSource = (protoData as any)?.tdee_data_source ?? null

  const td = protocolDay
  const target: NutritionMacros = {
    kcal:      Number(td?.calories     ?? 0),
    protein_g: Number(td?.protein_g    ?? 0),
    carbs_g:   Number(td?.carbs_g      ?? 0),
    fat_g:     Number(td?.fat_g        ?? 0),
    water_ml:  Number(td?.hydration_ml ?? 2500),
  }

  // ── Consumed today ────────────────────────────────────────────────────────
  const rawMeals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const meals: NutritionMeal[] = rawMeals.map((m: any) => ({
    ...m,
    total_calories: computeMacroEnergy({
      protein_g: Number(m.total_protein_g ?? 0),
      carbs_g: Number(m.total_carbs_g ?? 0),
      fat_g: Number(m.total_fat_g ?? 0),
      fiber_g: Number(m.total_fiber_g ?? 0),
    }),
    entries: m.nutrition_entries ?? [],
    nutrition_entries: undefined,
  }))
  const water = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []

  const consumedBase = meals.reduce(
    (acc, m) => ({
      kcal:      acc.kcal      + Number(m.total_calories  ?? 0),
      protein_g: acc.protein_g + Number(m.total_protein_g ?? 0),
      carbs_g:   acc.carbs_g   + Number(m.total_carbs_g   ?? 0),
      fat_g:     acc.fat_g     + Number(m.total_fat_g     ?? 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
  const water_ml = water.reduce((s, w) => s + Number(w.amount_ml ?? 0), 0)
  const consumed: NutritionMacros = { ...consumedBase, water_ml }

  // ── IA alerts (pure fn, no HTTP) ──────────────────────────────────────────
  const hasLunchLog = meals.some(m => m.meal_type === 'lunch')
  const rawAlerts = computeNutritionAlerts({
    consumed: { ...consumedBase, water_ml },
    target,
    currentHour: new Date().getHours(),
    hasLunchLog,
  })
  const alerts: GenericAlert[] = rawAlerts.map(a => ({
    code: a.code,
    severity: a.severity,
    title: a.title,
    body: a.body,
  }))

  // ── Weekly trend ──────────────────────────────────────────────────────────
  const today = new Date()
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const trendMeals = trendResult.status === 'fulfilled' ? (trendResult.value.data ?? []) : []
  type DayTotals = { kcal: number; protein_g: number; carbs_g: number; fat_g: number }
  const trendTotals: Record<string, DayTotals> = {}
  for (const d of days) trendTotals[d] = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const m of trendMeals) {
    const key = (m as any).physiological_date as string
    if (!trendTotals[key]) continue
    trendTotals[key].kcal      += computeMacroEnergy({
      protein_g: Number((m as any).total_protein_g ?? 0),
      carbs_g: Number((m as any).total_carbs_g ?? 0),
      fat_g: Number((m as any).total_fat_g ?? 0),
    })
    trendTotals[key].protein_g += Number((m as any).total_protein_g ?? 0)
    trendTotals[key].carbs_g   += Number((m as any).total_carbs_g   ?? 0)
    trendTotals[key].fat_g     += Number((m as any).total_fat_g     ?? 0)
  }
  const trend = days.map(d => ({
    date:      d,
    consumed:  trendTotals[d].kcal,
    protein_g: trendTotals[d].protein_g,
    carbs_g:   trendTotals[d].carbs_g,
    fat_g:     trendTotals[d].fat_g,
    target:    target.kcal,
    targetProtein: target.protein_g,
    targetCarbs:   target.carbs_g,
    targetFat:     target.fat_g,
  }))

  // ── Streak / logged dates ─────────────────────────────────────────────────
  const streakMeals = streakResult.status === 'fulfilled' ? (streakResult.value.data ?? []) : []
  const loggedDatesSet = new Set<string>(
    streakMeals.map((m: any) => m.physiological_date as string)
  )

  // ── Language ──────────────────────────────────────────────────────────────
  const rawLang = prefsResult.status === 'fulfilled' ? (prefsResult.value as any)?.data?.language : null
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? (rawLang as ClientLang) : 'fr'

  // Day type badge for TopBar
  const dayTypeBadge = protocolDay?.name ? (
    <span className="text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.14em] px-2 py-1 rounded-lg bg-[#222222] text-[#b0b0b0]">
      {protocolDay.name}
    </span>
  ) : null

  return (
    <NutritionClientPage
      date={date}
      target={target}
      consumed={consumed}
      meals={meals}
      alerts={alerts}
      trend={trend}
      loggedDates={loggedDatesSet}
      tdeeAdaptive={tdeeAdaptive}
      tdeeDataSource={tdeeDataSource}
      bodyWeightKg={bodyWeightKg}
      protocolDay={protocolDay}
      lang={lang}
      dayTypeBadge={dayTypeBadge}
    />
  )
}
