'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Dumbbell, Clock, Layers, Target, Timer, Coffee,
  Flame, ChevronRight, Trophy, TrendingUp, Zap,
} from 'lucide-react'
import BodyMap from '@/components/client/BodyMap'
import { computeMuscleIntensity } from '@/lib/client/muscleDetection'
import ExerciseListDisclosure from '@/components/client/ExerciseListDisclosure'
import ClientTopBar from '@/components/client/ClientTopBar'
import { useClientT } from '@/components/client/ClientI18nProvider'
import { ct, type ClientLang } from '@/lib/i18n/clientTranslations'
import type {
  HeatmapDay,
  PREntry,
  SessionSummary,
  SessionLog,
} from '@/lib/client/progressTypes'
import ProgressHeatmap from '@/app/client/progress/ProgressHeatmap'
import PRsPodium from '@/app/client/progress/PRsPodium'
import ProgressVolumeChart from '@/app/client/progress/ProgressVolumeChart'

type Tab = 'seance' | 'performances' | 'historique'

// ── Helpers ────────────────────────────────────────────────────────────────

function estimateDuration(exercises: any[]): number {
  let totalSec = 0
  for (const ex of exercises) {
    const sets = ex.sets ?? 3
    const restSec = ex.rest_sec ?? 90
    totalSec += sets * 45 + (sets - 1) * restSec
  }
  return Math.round(totalSec / 60)
}

function avgRest(exercises: any[]): number | null {
  const rests = exercises.filter(ex => ex.rest_sec != null).map(ex => ex.rest_sec as number)
  if (rests.length === 0) return null
  return Math.round(rests.reduce((a, b) => a + b, 0) / rests.length)
}

function avgRir(exercises: any[]): number | null {
  const rirs = exercises.filter(ex => ex.rir != null).map(ex => ex.rir as number)
  if (rirs.length === 0) return null
  return Math.round(rirs.reduce((a, b) => a + b, 0) / rirs.length)
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  program: any
  sessions: any[]
  todayDow: number
  selectedDow: number
  activeTab: string
  completedTodayIds: string[]
  completedTodayNames: string[]
  daysShort: string[]
  daysFull: string[]
  lang: ClientLang
  // Performance
  streak: number
  bestStreak: number
  heatmapData: HeatmapDay[]
  allTimePRs: PREntry[]
  sessionList: SessionSummary[]
  rawLogs: SessionLog[]
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProgrammeClientPage({
  program,
  sessions,
  todayDow,
  selectedDow: initialDow,
  activeTab: initialTab,
  completedTodayIds,
  completedTodayNames,
  daysShort,
  daysFull,
  lang,
  streak,
  bestStreak,
  heatmapData,
  allTimePRs,
  sessionList,
  rawLogs,
}: Props) {
  const { t } = useClientT()

  const [tab, setTab] = useState<Tab>(initialTab as Tab ?? 'seance')
  const [selectedDow, setSelectedDow] = useState(initialDow)

  const completedIdsSet = useMemo(() => new Set(completedTodayIds), [completedTodayIds])
  const completedNamesSet = useMemo(() => new Set(completedTodayNames), [completedTodayNames])

  const todaySession = useMemo(() =>
    sessions.find((s: any) =>
      (s.days_of_week?.length ? s.days_of_week : [s.day_of_week]).includes(selectedDow)
    ) ?? null,
    [sessions, selectedDow]
  )

  const todayExercises = useMemo(() =>
    todaySession
      ? ((todaySession.program_exercises ?? []) as any[]).sort((a: any, b: any) => a.position - b.position)
      : [],
    [todaySession]
  )

  const muscleIntensityMap = useMemo(() =>
    computeMuscleIntensity(todayExercises.map((e: any) => ({
      name: e.name,
      sets: e.sets ?? 3,
      primary_muscles: e.primary_muscles ?? [],
      secondary_muscles: e.secondary_muscles ?? [],
      primary_muscle: e.primary_muscle ?? null,
      primary_activation: e.primary_activation ?? null,
      secondary_muscles_detail: e.secondary_muscles_detail ?? [],
      secondary_activations: e.secondary_activations ?? [],
    }))),
    [todayExercises]
  )

  const durationMin = todaySession ? estimateDuration(todayExercises) : null
  const totalSets = todayExercises.reduce((s: number, e: any) => s + (e.sets ?? 0), 0)
  const restAvg = todaySession ? avgRest(todayExercises) : null
  const rirAvg = todaySession ? avgRir(todayExercises) : null

  const isViewingToday = selectedDow === todayDow

  // Historique — 30 dernières séances
  const recentSessions = useMemo(() =>
    [...sessionList].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [sessionList]
  )

  // Timeline pour le graphe volume
  const timeline = useMemo(() => {
    const map: Record<string, { date: string; volume: number }> = {}
    for (const log of rawLogs) {
      const date = log.logged_at.split('T')[0]
      if (!map[date]) map[date] = { date, volume: 0 }
      for (const s of log.client_set_logs) {
        if (s.completed) {
          map[date].volume += (s.actual_reps ?? 0) * (parseFloat(String(s.actual_weight_kg)) || 0)
        }
      }
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
  }, [rawLogs])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'seance',       label: 'Séance'       },
    { id: 'performances', label: 'Performances'  },
    { id: 'historique',   label: 'Historique'    },
  ]

  const isOnFire = streak >= 7

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-32">
      <ClientTopBar
        section={ct(lang, 'programme.section')}
        title={program.name}
        right={
          <p className="text-[9px] text-white/30 uppercase tracking-[0.12em]">
            {program.weeks}sem · {sessions.length} séances
          </p>
        }
      />

      <main className="max-w-lg mx-auto px-5 pt-[88px] flex flex-col gap-4">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-[#1f8a65] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB — SÉANCE
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'seance' && (
          <>
            {/* Sélecteur jours */}
            <div className="flex gap-1">
              {daysShort.map((d, i) => {
                const dow = i + 1
                const hasSession = sessions.some((s: any) =>
                  (s.days_of_week?.length ? s.days_of_week : [s.day_of_week]).includes(dow)
                )
                const isToday = dow === todayDow
                const isSelected = dow === selectedDow
                const cls = `flex-1 flex flex-col items-center py-2 rounded-lg text-[10px] font-bold transition-colors ${
                  isSelected
                    ? 'bg-[#1f8a65] text-white'
                    : isToday
                    ? 'bg-[#1f8a65]/20 text-[#1f8a65]'
                    : hasSession
                    ? 'bg-white/[0.04] text-white/50 hover:bg-white/[0.07] cursor-pointer'
                    : 'text-white/20'
                }`
                const dot = hasSession && (
                  <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#1f8a65]/50'}`} />
                )
                if (!hasSession && !isToday) {
                  return <div key={d} className={cls}><span>{d}</span>{dot}</div>
                }
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDow(dow)}
                    className={cls}
                  >
                    <span>{d}</span>{dot}
                  </button>
                )
              })}
            </div>

            {todaySession ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-1">
                    {daysFull[selectedDow - 1]}{!isViewingToday ? ' · Aperçu' : ''}
                  </p>
                  <h2 className="text-[20px] font-bold text-white leading-tight">{todaySession.name}</h2>
                  <p className="text-[12px] text-white/35 mt-0.5">
                    {todayExercises.length} {ct(lang, 'programme.session.exercises')}{todayExercises.length > 1 && lang === 'fr' ? 's' : ''}
                  </p>
                </div>

                {/* BodyMap */}
                <div className="px-5 py-4 flex justify-center border-t border-b border-white/[0.04]">
                  <BodyMap intensityMap={muscleIntensityMap} />
                </div>

                {/* Stats pills */}
                <div className="px-5 py-4 flex gap-2 flex-wrap">
                  {durationMin !== null && <StatPill icon={<Clock size={10} />} label={`~${durationMin} min`} />}
                  <StatPill icon={<Layers size={10} />} label={`${totalSets} ${ct(lang, 'programme.session.sets')}`} />
                  <StatPill icon={<Dumbbell size={10} />} label={`${todayExercises.length} ex.`} />
                  {restAvg !== null && <StatPill icon={<Timer size={10} />} label={`${restAvg}s repos`} />}
                  {rirAvg !== null && <StatPill icon={<Target size={10} />} label={`RIR ${rirAvg}`} />}
                </div>

                {/* Exercices disclosure */}
                <ExerciseListDisclosure
                  exercises={todayExercises.map((ex: any) => ({
                    id: ex.id,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                  }))}
                />

                {/* CTA */}
                <div className="px-5 pb-5 pt-3">
                  {(completedIdsSet.has(todaySession.id) || completedNamesSet.has(todaySession.name)) ? (
                    <div className="flex items-center justify-between w-full bg-[#1f8a65]/10 border border-[#1f8a65]/20 pl-5 pr-1.5 py-1.5 rounded-xl">
                      <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#1f8a65]">
                        Séance réalisée ✓
                      </span>
                      <Link
                        href={`/client/programme/session/${todaySession.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[10px] font-bold"
                      >
                        Refaire
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/client/programme/session/${todaySession.id}`}
                      className="flex items-center justify-between w-full bg-[#1f8a65] pl-5 pr-1.5 py-1.5 rounded-xl hover:bg-[#217356] active:scale-[0.99] transition-all"
                    >
                      <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                        {ct(lang, 'programme.session.start')}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.15]">
                        <Dumbbell size={15} className="text-white" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-10 text-center">
                <Coffee size={28} className="text-white/20 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-white/50">{ct(lang, 'programme.rest.today')}</p>
                <p className="text-[11px] text-white/25 mt-1">Profite de la récupération</p>
                {(() => {
                  const next = sessions.find((s: any) => {
                    const d = (s.days_of_week?.length ? Math.min(...s.days_of_week) : s.day_of_week) ?? 0
                    return d > selectedDow
                  }) ?? sessions[0]
                  if (!next) return null
                  return (
                    <p className="text-[10px] text-white/25 mt-4">
                      Prochaine ·{' '}
                      <span className="text-white/40">
                        {(next.days_of_week?.length ? next.days_of_week : [next.day_of_week ?? 1])
                          .map((d: number) => daysFull[d - 1]).join('/')} — {next.name}
                      </span>
                    </p>
                  )
                })()}
              </div>
            )}

            {/* Autres séances */}
            {sessions.filter((s: any) => !(s.days_of_week?.length ? s.days_of_week : [s.day_of_week]).includes(selectedDow)).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                  {ct(lang, 'programme.week.label')}
                </p>
                <div className="flex flex-col gap-2">
                  {sessions
                    .filter((s: any) => !(s.days_of_week?.length ? s.days_of_week : [s.day_of_week]).includes(selectedDow))
                    .map((session: any) => {
                      const exs = ((session.program_exercises ?? []) as any[]).sort((a: any, b: any) => a.position - b.position)
                      const sessionDays: number[] = session.days_of_week?.length ? session.days_of_week : (session.day_of_week ? [session.day_of_week] : [])
                      const isSessionToday = sessionDays.includes(todayDow)
                      const firstDow = sessionDays[0] ?? 1
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedDow(firstDow)}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-colors text-left w-full"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center w-8">
                              <span className={`text-[9px] font-bold uppercase ${isSessionToday ? 'text-[#1f8a65]' : 'text-white/30'}`}>
                                {sessionDays.map((d: number) => daysShort[d - 1]).join('/')}
                              </span>
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-white/80">{session.name}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {exs.length} ex. · {exs.reduce((s: number, e: any) => s + (e.sets ?? 0), 0)} sets
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-white/20 shrink-0" />
                        </button>
                      )
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB — PERFORMANCES
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'performances' && (
          <div className="flex flex-col gap-4">

            {/* Streak */}
            {streak > 0 ? (
              <div
                className="relative rounded-2xl overflow-hidden px-5 py-5"
                style={{
                  background: isOnFire
                    ? 'linear-gradient(135deg, rgba(31,138,101,0.18) 0%, rgba(31,138,101,0.06) 100%)'
                    : 'rgba(255,255,255,0.02)',
                  border: `0.3px solid ${isOnFire ? 'rgba(31,138,101,0.35)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-end gap-2 mb-1">
                      <span className="font-black font-mono leading-none text-[3.5rem]"
                        style={{ color: isOnFire ? '#1f8a65' : 'white', lineHeight: 1 }}>
                        {streak}
                      </span>
                      <span className="text-[1.1rem] font-semibold text-white/40 mb-2">j</span>
                      {isOnFire && <Flame size={22} className="text-[#1f8a65] mb-1.5 ml-1" />}
                    </div>
                    <p className="text-[11px] text-white/50">
                      {isOnFire ? 'Feu vert — continue comme ça' : 'Jours consécutifs'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-1">Record</p>
                    <p className="text-[1.4rem] font-black text-white/35 font-mono leading-none">
                      {bestStreak}<span className="text-[0.8rem] font-medium ml-0.5">j</span>
                    </p>
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ width: 56, background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((streak / Math.max(bestStreak, 1)) * 100, 100)}%`, background: '#1f8a65' }} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                <Zap size={14} className="text-white/20 shrink-0" />
                <p className="text-[12px] text-white/35">
                  {bestStreak > 0
                    ? `Record : ${bestStreak}j — fais une séance pour relancer`
                    : 'Fais une séance pour lancer ton streak'}
                </p>
              </div>
            )}

            {/* KPIs 30 derniers jours */}
            {sessionList.length > 0 && (() => {
              const since = new Date()
              since.setDate(since.getDate() - 30)
              const sinceStr = since.toISOString().split('T')[0]
              const recent = sessionList.filter(s => s.date >= sinceStr)
              const volume = recent.reduce((sum, s) => sum + s.volume, 0)
              const sets = recent.reduce((sum, s) => sum + s.setsCompleted, 0)
              return (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                    30 derniers jours
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <KpiCard label="Séances" value={recent.length} />
                    <KpiCard label="Volume" value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}kg`} />
                    <KpiCard label="Sets" value={sets} />
                  </div>
                </div>
              )
            })()}

            {/* Heatmap */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                Activité — 12 semaines
              </p>
              <ProgressHeatmap data={heatmapData} />
            </div>

            {/* Volume chart */}
            {timeline.length >= 2 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                  Volume par séance
                </p>
                <ProgressVolumeChart timeline={timeline} />
              </div>
            )}

            {/* PRs */}
            {allTimePRs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-2.5 px-1">
                  Records personnels
                </p>
                <PRsPodium prs={allTimePRs} />
              </div>
            )}

            {sessionList.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp size={28} className="text-white/10 mx-auto mb-3" />
                <p className="text-[12px] text-white/25">Logue ta première séance pour voir tes performances</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB — HISTORIQUE
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'historique' && (
          <div className="flex flex-col gap-2">
            {recentSessions.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={28} className="text-white/10 mx-auto mb-3" />
                <p className="text-[12px] text-white/25">Aucune séance enregistrée</p>
              </div>
            ) : (
              recentSessions.map(session => {
                const [, m, d] = session.date.split('-')
                return (
                  <Link
                    key={session.id}
                    href={`/client/programme/recap/${session.id}`}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.04] active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center w-9 shrink-0">
                        <p className="text-[12px] font-black text-white/50 font-mono">{d}/{m}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-semibold text-white/80 truncate">{session.name}</p>
                          {session.hasPR && (
                            <span className="shrink-0 flex items-center gap-1 bg-[#1f8a65]/15 text-[#1f8a65] text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md">
                              <Trophy size={8} />PR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] text-white/30">
                            <Layers size={9} />{session.setsCompleted} sets
                          </span>
                          {session.durationMin && (
                            <span className="flex items-center gap-1 text-[10px] text-white/30">
                              <Clock size={9} />{session.durationMin}min
                            </span>
                          )}
                          {session.volume > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/30">
                              <TrendingUp size={9} />
                              {session.volume >= 1000 ? `${(session.volume / 1000).toFixed(1)}t` : `${session.volume}kg`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 shrink-0 ml-2" />
                  </Link>
                )
              })
            )}
          </div>
        )}


      </main>
    </div>
  )
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-3 py-1.5">
      <span className="text-white/35">{icon}</span>
      <span className="text-[11px] font-medium text-white/55">{label}</span>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-1">{label}</p>
      <p className="text-[1.3rem] font-black leading-none font-mono text-white">{value}</p>
    </div>
  )
}
