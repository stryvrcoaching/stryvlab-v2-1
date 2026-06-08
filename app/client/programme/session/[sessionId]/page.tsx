import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import SessionLogger from './SessionLogger'

export default async function SessionLogPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service)
  if (!client) notFound()

  // Fetch session avec exercices + colonnes double progression + image + unilatéral
  const { data: session } = await service
    .from('program_sessions')
    .select(`
      id, name, day_of_week,
      program_id,
      program_exercises (
        id, name, sets, reps, rest_sec, rir, notes, position,
        target_rir, current_weight_kg, rep_min, rep_max, weight_increment_kg,
        image_url, is_unilateral, primary_muscles, secondary_muscles, group_id
      )
    `)
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  // Vérifier que la session appartient à un programme actif du client
  const { data: program } = await service
    .from('programs')
    .select('id, progressive_overload_enabled, goal, level')
    .eq('id', (session as any).program_id)
    .eq('client_id', client.id)
    .eq('status', 'active')
    .single()

  if (!program) notFound()

  const progressionEnabled = (program as any).progressive_overload_enabled ?? false
  const goal: string = (program as any).goal ?? 'hypertrophy'
  const level: string = (program as any).level ?? 'intermediate'

  const exercises = (session.program_exercises ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((ex: any) => ({
      ...ex,
      progressive_overload_enabled: progressionEnabled,
      // Détection unilatéral : flag DB OU nom contient un mot-clé unilatéral
      is_unilateral: ex.is_unilateral ||
        /unilat[eé]ral|single|alterné|alternée|1 bras|1 jambe|un bras|une jambe|kick.?back|extension.?hanche|hip.?thrust.?unilat|curl.?unilat|presse.?unilat|fente|split.?squat|bulgarian/i.test(ex.name ?? ''),
      clientAlternatives: [],  // Will be populated below
    }))

  // Fetch the template_id for this session's program to get coach-pre-configured alternatives
  const { data: sessionData } = await service
    .from('program_sessions')
    .select('program_id, programs!inner(template_id)')
    .eq('id', params.sessionId)
    .single()

  const templateId = (sessionData as any)?.programs?.template_id as string | null

  // For each exercise, find coach-configured alternatives
  let alternativesMap: Record<string, string[]> = {}
  if (templateId && exercises?.length) {
    // Fetch all sessions in the template
    const { data: templateSessions } = await service
      .from('coach_program_template_sessions')
      .select('id')
      .eq('template_id', templateId)

    if (templateSessions && templateSessions.length > 0) {
      const sessionIds = templateSessions.map((s: any) => s.id)

      // Fetch exercises in those sessions with alternatives
      const { data: templateExercises } = await service
        .from('coach_program_template_exercises')
        .select(`
          name,
          coach_template_exercise_alternatives (name, position)
        `)
        .in('session_id', sessionIds)

      if (templateExercises) {
        for (const te of templateExercises) {
          const alts = ((te as any).coach_template_exercise_alternatives ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((a: any) => a.name as string)
          if (alts.length > 0) alternativesMap[te.name] = alts
        }
      }
    }
  }

  // Fetch historique de la dernière séance pour cet exercice (par nom, derniers set_logs)
  // On récupère les set_logs de la dernière session_log pour chaque exercice de cette séance
  const exerciseNames = exercises.map((ex: any) => ex.name)

  let lastPerformance: Record<string, { weight: number | null; reps: number | null; rir?: number | null; side?: string | null; set_number?: number | null }[]> = {}

  if (exerciseNames.length > 0) {
    // Dernière session log du client (hors session actuelle en cours)
    // Filtre via client_session_logs pour garantir l'isolation par client
    const { data: lastLogs } = await service
      .from('client_set_logs')
      .select('exercise_name, set_number, actual_weight_kg, actual_reps, rir_actual, side, completed, client_session_logs!inner(client_id)')
      .eq('completed', true)
      .eq('client_session_logs.client_id', client.id)
      .in('exercise_name', exerciseNames)
      .order('created_at', { ascending: false })
      .limit(200)

    if (lastLogs) {
      // Garder uniquement les sets les plus récents par exercice (première occurrence = plus récente)
      const seen = new Set<string>()
      for (const log of lastLogs) {
        const key = `${log.exercise_name}__${log.set_number}__${log.side ?? 'bilateral'}`
        if (!seen.has(key)) {
          seen.add(key)
          if (!lastPerformance[log.exercise_name]) lastPerformance[log.exercise_name] = []
          lastPerformance[log.exercise_name].push({
            weight: log.actual_weight_kg,
            reps: log.actual_reps,
            rir: (log as any).rir_actual ?? null,
            side: log.side,
            set_number: log.set_number,
          })
        }
      }
    }
  }

  // Add clientAlternatives to each exercise
  const exercisesWithAlternatives = exercises.map((ex: any) => ({
    ...ex,
    clientAlternatives: alternativesMap[ex.name] ?? [],
  }))

  return (
    <SessionLogger
      clientId={client.id}
      sessionId={params.sessionId}
      session={{ id: session.id, name: session.name }}
      exercises={exercisesWithAlternatives}
      lastPerformance={lastPerformance}
      goal={goal}
      level={level}
    />
  )
}
