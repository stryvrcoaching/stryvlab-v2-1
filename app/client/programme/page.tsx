import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { ct, cta, type ClientLang } from '@/lib/i18n/clientTranslations'
import {
  buildHeatmap,
  buildPRs,
  buildSessionList,
  calculateStreaks,
  type SessionLog,
} from '@/lib/client/progressTypes'
import ProgrammeClientPage from './ProgrammeClientPage'

function getTodayDow() {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

export default async function ClientProgrammePage({
  searchParams,
}: {
  searchParams?: { dow?: string; tab?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service, 'id, first_name')
  if (!client) return <NoProgramPage lang="fr" />

  const todayIso = new Date().toISOString().slice(0, 10)

  const [programsResult, prefsLangResult, completedTodayResult, sessionLogsResult] = await Promise.all([
    service.from('programs')
      .select(`
        id, name, description, weeks, status, created_at,
        program_sessions (
          id, name, day_of_week, days_of_week, position, notes,
          program_exercises (
            id, name, sets, reps, rest_sec, rir, notes, position,
            primary_muscles, secondary_muscles, movement_pattern,
            primary_muscle, primary_activation, secondary_muscles_detail, secondary_activations
          )
        )
      `)
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1),

    service.from('client_preferences')
      .select('language')
      .eq('client_id', client.id)
      .maybeSingle(),

    service.from('client_session_logs')
      .select('program_session_id, session_name')
      .eq('client_id', client.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', `${todayIso}T00:00:00`)
      .lte('completed_at', `${todayIso}T23:59:59`),

    service.from('client_session_logs')
      .select(`
        id, session_name, logged_at, completed_at, duration_min,
        client_set_logs (
          exercise_name, set_number, actual_reps, actual_weight_kg,
          completed, rpe, rir_actual
        )
      `)
      .eq('client_id', client.id)
      .order('logged_at', { ascending: true }),
  ])

  const programs = programsResult?.data
  const rawLang = (prefsLangResult as any)?.data?.language
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? rawLang as ClientLang : 'fr'
  const daysShort = cta(lang, 'programme.days.short')
  const daysFull = cta(lang, 'programme.days.full')

  const program = programs?.[0]
  if (!program) return <NoProgramPage lang={lang} />

  const sessions = ((program.program_sessions ?? []) as any[]).sort((a, b) => a.position - b.position)

  const todayDow = getTodayDow()
  const selectedDow = searchParams?.dow ? parseInt(searchParams.dow, 10) : todayDow
  const activeTab = searchParams?.tab ?? 'seance'

  const completedRows = (completedTodayResult?.data ?? []) as any[]
  const completedTodayIds = new Set<string>(completedRows.map((r: any) => r.program_session_id).filter(Boolean))
  const completedTodayNames = new Set<string>(completedRows.map((r: any) => r.session_name).filter(Boolean))

  // Performance data
  const rawLogs: SessionLog[] = (sessionLogsResult?.data ?? []) as any[]
  const sessionDates = Array.from(new Set(rawLogs.map(l => l.logged_at.split('T')[0]))).sort() as string[]
  const { streak, bestStreak } = calculateStreaks(sessionDates)
  const heatmapData = buildHeatmap(rawLogs)
  const allTimePRs = buildPRs(rawLogs)
  const sessionList = buildSessionList(rawLogs, allTimePRs)

  return (
    <ProgrammeClientPage
      program={program}
      sessions={sessions}
      todayDow={todayDow}
      selectedDow={selectedDow}
      activeTab={activeTab}
      completedTodayIds={Array.from(completedTodayIds)}
      completedTodayNames={Array.from(completedTodayNames)}
      daysShort={daysShort}
      daysFull={daysFull}
      lang={lang}
      // Performance props
      streak={streak}
      bestStreak={bestStreak}
      heatmapData={heatmapData}
      allTimePRs={allTimePRs}
      sessionList={sessionList}
      rawLogs={rawLogs}
    />
  )
}

import { Dumbbell } from 'lucide-react'

function NoProgramPage({ lang }: { lang: ClientLang }) {
  return (
    <div className="min-h-screen bg-[#121212] font-sans">
      <div className="max-w-lg mx-auto px-5 pt-24 py-16 text-center">
        <Dumbbell size={36} className="text-white/10 mx-auto mb-4" />
        <p className="text-[13px] text-white/40">{ct(lang, 'programme.noProgram.desc')}</p>
      </div>
    </div>
  )
}
