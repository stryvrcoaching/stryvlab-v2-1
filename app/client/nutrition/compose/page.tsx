import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { resolveClientTimezone } from '@/lib/client/checkin/resolveClientTimezone'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { utcRangeForPhysiologicalDate } from '@/lib/client/checkin/timeWindows'
import { resolveProtocolDayByDate, resolveRestProtocolDay } from '@/lib/nutrition/protocol-schedule'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import ComposeClientPage from './ComposeClientPage'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function ClientNutritionComposePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id')
  if (!client) return null
  const clientId = (client as { id: string }).id
  const timezone = await resolveClientTimezone(svc(), clientId)
  const date = computePhysiologicalDate(new Date(), timezone)
  const { start, end } = utcRangeForPhysiologicalDate(date, timezone)

  const [protoResult, mealsResult, prepsResult, waterResult] = await Promise.allSettled([
    svc()
      .from('nutrition_protocols')
      .select('schedule_start_date, nutrition_protocol_days(position, calories, protein_g, carbs_g, fat_g, hydration_ml, carb_cycle_type), nutrition_protocol_schedule_slots(week_index, dow, protocol_day_position)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    svc()
      .from('nutrition_meals')
      .select('total_calories, total_protein_g, total_carbs_g, total_fat_g')
      .eq('client_id', clientId)
      .eq('physiological_date', date),

    svc()
      .from('client_nutrition_preps')
      .select('is_active, total_calories, total_protein_g, total_carbs_g, total_fat_g')
      .eq('client_id', clientId)
      .eq('physiological_date', date)
      .eq('status', 'planned')
      .eq('scenario_key', 'default'),

    svc()
      .from('client_water_logs')
      .select('amount_ml')
      .eq('client_id', clientId)
      .gte('logged_at', start)
      .lt('logged_at', end),
  ])

  const protoData = protoResult.status === 'fulfilled' ? protoResult.value.data : null
  const protocolDay = resolveProtocolDayByDate(
    date,
    (protoData as any)?.schedule_start_date ?? null,
    (protoData?.nutrition_protocol_days as any) ?? [],
    (protoData?.nutrition_protocol_schedule_slots as any) ?? [],
  ) ?? resolveRestProtocolDay(((protoData?.nutrition_protocol_days as any[]) ?? []))

  const target: NutritionMacros = {
    kcal: Number(protocolDay?.calories ?? 2000),
    protein_g: Number(protocolDay?.protein_g ?? 150),
    carbs_g: Number(protocolDay?.carbs_g ?? 200),
    fat_g: Number(protocolDay?.fat_g ?? 60),
    water_ml: Number(protocolDay?.hydration_ml ?? 2500),
  }

  const meals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const preps = prepsResult.status === 'fulfilled' ? (prepsResult.value.data ?? []) : []
  const waterEntries = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []
  const activePreps = preps.filter((prep: any) => prep.is_active)

  const consumed: NutritionMacros = {
    kcal: meals.reduce((s, m) => s + Number(m.total_calories ?? 0), 0),
    protein_g: meals.reduce((s, m) => s + Number(m.total_protein_g ?? 0), 0),
    carbs_g: meals.reduce((s, m) => s + Number(m.total_carbs_g ?? 0), 0),
    fat_g: meals.reduce((s, m) => s + Number(m.total_fat_g ?? 0), 0),
    water_ml: waterEntries.reduce((s, w) => s + Number((w as any).amount_ml ?? 0), 0),
  }
  const planningConsumed: NutritionMacros = {
    kcal: consumed.kcal + activePreps.reduce((s: number, prep: any) => s + Number(prep.total_calories ?? 0), 0),
    protein_g: consumed.protein_g + activePreps.reduce((s: number, prep: any) => s + Number(prep.total_protein_g ?? 0), 0),
    carbs_g: consumed.carbs_g + activePreps.reduce((s: number, prep: any) => s + Number(prep.total_carbs_g ?? 0), 0),
    fat_g: consumed.fat_g + activePreps.reduce((s: number, prep: any) => s + Number(prep.total_fat_g ?? 0), 0),
    water_ml: consumed.water_ml,
  }

  return <ComposeClientPage planningConsumed={planningConsumed} target={target} date={date} />
}
