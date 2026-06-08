import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Heuristique : détecte le groupe musculaire depuis le nom de l'exercice
function inferMuscleGroup(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  // Jambes (avant pectoraux car "leg press" contient "press")
  if (/squat|leg press|leg curl|leg ext|lunge|hack|rdl|deadlift|hip thrust|glute|presse a cuisses|fente|soulevé de terre/.test(n)) return 'Jambes'
  // Pectoraux — développé couché/incliné, écarté, chest fly
  if (/bench|chest|pec|fly|push[\s-]up|developpe couche|developpe incline|developpe halteres|ecarte|dips pecto/.test(n)) return 'Pectoraux'
  // Dos — tirage, rowing, tractions
  if (/pull[\s-]up|chin[\s-]up|\blat\b|\brow\b|cable[\s-]row|seated[\s-]row|t[\s-]bar|tirage|rowing|traction|grand dorsal/.test(n)) return 'Dos'
  // Épaules — élévation, oiseau, développé militaire, face pull
  if (/shoulder|military|elevation laterale|elevation frontale|oiseau|developpe militaire|face pull|upright|rear delt|lateral raise/.test(n)) return 'Épaules'
  // Biceps — curl, marteau (avant triceps car "curl" > "extension")
  if (/\bcurl\b|bicep|hammer|marteau|drag curl|waiter curl/.test(n)) return 'Biceps'
  // Triceps — extension, skullcrusher, kickback, dips triceps, développé couché prise serrée
  if (/tricep|skullcrusher|extension|kickback|dips tricep|prise serree|close.grip/.test(n)) return 'Triceps'
  // Pectoraux — développé couché prise serrée smith → Triceps déjà capturé, mais "développé" sans contexte → Pectoraux
  if (/developpe/.test(n)) return 'Pectoraux'
  if (/crunch|plank|ab|core|oblique|gainage/.test(n)) return 'Abdos'
  if (/calf|mollet|raise/.test(n)) return 'Mollets'
  return 'Autre'
}

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier ownership
  const { data: client } = await service()
    .from('coach_clients')
    .select('id')
    .eq('id', params.clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
  const since = days === 0
    ? new Date(0).toISOString().split('T')[0]
    : new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  // Fetch all session logs + set logs
  const { data: sessionLogs } = await service()
    .from('client_session_logs')
    .select(`
      id, session_name, logged_at, completed_at, duration_min,
      client_set_logs (
        id, exercise_name, set_number, actual_reps, actual_weight_kg, completed, rpe
      )
    `)
    .eq('client_id', params.clientId)
    .gte('logged_at', since)
    .order('logged_at', { ascending: true })

  const logs = sessionLogs ?? []

  // ── KPIs ────────────────────────────────────────────────────
  const totalSessions = logs.length
  const completedSessions = logs.filter(l => l.completed_at).length
  // Un set est "effectif" s'il est coché OU s'il a des reps réelles saisies
  // (certaines séances anciennes ont completed=false mais actual_reps rempli)
  const isEffective = (s: { completed: boolean; actual_reps: number | null; actual_weight_kg: number | null }) =>
    s.completed || s.actual_reps != null
  const totalSets = logs.flatMap(l => l.client_set_logs ?? []).filter(isEffective).length
  const totalReps = logs.flatMap(l => l.client_set_logs ?? [])
    .filter(s => isEffective(s) && s.actual_reps)
    .reduce((acc, s) => acc + (s.actual_reps ?? 0), 0)
  const totalVolume = logs.flatMap(l => l.client_set_logs ?? [])
    .filter(s => isEffective(s) && s.actual_reps && s.actual_weight_kg)
    .reduce((acc, s) => acc + (s.actual_reps ?? 0) * (Number(s.actual_weight_kg) ?? 0), 0)
  const avgDuration = logs.filter(l => l.duration_min)
    .reduce((acc, l, _, arr) => acc + (l.duration_min ?? 0) / arr.length, 0)

  // ── TIMELINE (par jour) ──────────────────────────────────────
  const timelineMap: Record<string, { date: string; volume: number; reps: number; sets: number; sessions: number }> = {}
  for (const log of logs) {
    const date = log.logged_at
    if (!timelineMap[date]) timelineMap[date] = { date, volume: 0, reps: 0, sets: 0, sessions: 0 }
    timelineMap[date].sessions += 1
    for (const s of (log.client_set_logs ?? [])) {
      if (!isEffective(s)) continue
      timelineMap[date].sets += 1
      timelineMap[date].reps += s.actual_reps ?? 0
      timelineMap[date].volume += (s.actual_reps ?? 0) * (Number(s.actual_weight_kg) ?? 0)
    }
  }
  const timeline = Object.values(timelineMap)

  // ── MUSCLE GROUP RADAR ───────────────────────────────────────
  const muscleMap: Record<string, { volume: number; sets: number; reps: number }> = {}
  for (const log of logs) {
    for (const s of (log.client_set_logs ?? [])) {
      if (!isEffective(s)) continue
      const group = inferMuscleGroup(s.exercise_name ?? '')
      if (!muscleMap[group]) muscleMap[group] = { volume: 0, sets: 0, reps: 0 }
      muscleMap[group].sets += 1
      muscleMap[group].reps += s.actual_reps ?? 0
      muscleMap[group].volume += (s.actual_reps ?? 0) * (Number(s.actual_weight_kg) ?? 0)
    }
  }
  const muscleGroups = Object.entries(muscleMap).map(([name, v]) => ({ name, ...v }))

  // ── EXERCISE PROGRESSION (top 5 exercices par volume) ────────
  const exerciseMap: Record<string, { name: string; sessions: { date: string; maxWeight: number; totalVolume: number; totalReps: number; sets: number }[] }> = {}
  for (const log of logs) {
    for (const s of (log.client_set_logs ?? [])) {
      if (!isEffective(s) || !s.exercise_name) continue
      if (!exerciseMap[s.exercise_name]) exerciseMap[s.exercise_name] = { name: s.exercise_name, sessions: [] }
      const existing = exerciseMap[s.exercise_name].sessions.find(x => x.date === log.logged_at)
      if (existing) {
        existing.maxWeight = Math.max(existing.maxWeight, Number(s.actual_weight_kg) ?? 0)
        existing.totalVolume += (s.actual_reps ?? 0) * (Number(s.actual_weight_kg) ?? 0)
        existing.totalReps += s.actual_reps ?? 0
        existing.sets += 1
      } else {
        exerciseMap[s.exercise_name].sessions.push({
          date: log.logged_at,
          maxWeight: Number(s.actual_weight_kg) ?? 0,
          totalVolume: (s.actual_reps ?? 0) * (Number(s.actual_weight_kg) ?? 0),
          totalReps: s.actual_reps ?? 0,
          sets: 1,
        })
      }
    }
  }
  const exercises = Object.values(exerciseMap)
    .sort((a, b) => b.sessions.reduce((s, x) => s + x.totalVolume, 0) - a.sessions.reduce((s, x) => s + x.totalVolume, 0))
    .slice(0, 6)

  // ── RPE TREND ────────────────────────────────────────────────
  const rpeTrend = logs
    .filter(l => (l.client_set_logs ?? []).some((s: any) => s.rpe))
    .map(l => {
      const rpeValues = (l.client_set_logs ?? []).filter((s: any) => s.rpe).map((s: any) => s.rpe)
      const avg = rpeValues.reduce((a: number, b: number) => a + b, 0) / rpeValues.length
      return { date: l.logged_at, avgRpe: Math.round(avg * 10) / 10 }
    })

  return NextResponse.json({
    kpis: { totalSessions, completedSessions, totalSets, totalReps, totalVolume: Math.round(totalVolume), avgDuration: Math.round(avgDuration) },
    timeline,
    muscleGroups,
    exercises,
    rpeTrend,
  })
}
