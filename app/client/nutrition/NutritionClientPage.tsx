'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import MacroWeekGrid from '@/components/client/smart/MacroWeekGrid'
import ProtocolRationale from '@/components/client/smart/ProtocolRationale'
import NutritionMealsList from '@/components/client/smart/NutritionMealsList'
import SmartNutritionPrepList, { type SmartNutritionPrep } from '@/components/client/smart/SmartNutritionPrepList'
import NutritionStreakCard from '@/components/client/smart/NutritionStreakCard'
import TdeeChart from '@/components/client/smart/TdeeChart'
import VoiceEntryFab from '@/components/client/smart/VoiceEntryFab'
import { ct, type ClientLang, type ClientDictKey } from '@/lib/i18n/clientTranslations'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'
import CycleSyncBanner from '@/components/client/nutrition/CycleSyncBanner'
import type { CyclePhase, CycleSyncAdjustment } from '@/lib/nutrition/engine/cycleSync'
import type { CycleState } from '@/lib/cycle/cycleEngine'
import dynamic from 'next/dynamic'
import type { MealMethodAction } from '@/components/client/smart/MealMethodSheet'

const CycleArcIndicator = dynamic(() => import('@/components/client/cycle/CycleArcIndicator'), { ssr: false })
const CyclePhaseModal   = dynamic(() => import('@/components/client/cycle/CyclePhaseModal'),   { ssr: false })
const MealMethodSheet   = dynamic(() => import('@/components/client/smart/MealMethodSheet'),   { ssr: false })
const MealLogSheet    = dynamic(() => import('@/components/client/smart/MealLogSheet'), { ssr: false })
const QuickWaterModal = dynamic(() => import('@/components/client/QuickWaterModal'),    { ssr: false })
const VoiceLogSheet    = dynamic(() => import('@/components/client/smart/VoiceLogSheet'), { ssr: false })

type DayPoint = {
  date: string
  consumed: number
  protein_g: number
  carbs_g: number
  fat_g: number
  target: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

type Tab = 'aujourd_hui' | 'tendances' | 'protocole'

interface Props {
  date: string
  target: NutritionMacros
  consumed: NutritionMacros
  planningConsumed: NutritionMacros
  meals: NutritionMeal[]
  preps: SmartNutritionPrep[]
  alerts: GenericAlert[]
  trend: DayPoint[]
  loggedDates: Set<string>
  tdeeAdaptive: number | null
  tdeeDataSource: string | null
  bodyWeightKg: number | null
  protocolDay: { name?: string; [key: string]: unknown } | null
  protocolDays?: Array<{
    name: string
    kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
    carb_cycle_type?: string | null
  }>
  lang: ClientLang
  dayTypeBadge: React.ReactNode
  cycleSyncPhase?: CyclePhase | null
  cycleSyncAdjustment?: CycleSyncAdjustment | null
  cycleDay?: number | null
  cycleState?: CycleState | null
  cycleSyncEnabled?: boolean
}

const TABS: { id: Tab; labelKey: ClientDictKey }[] = [
  { id: 'aujourd_hui', labelKey: 'nutrition.tab.aujourd_hui' },
  { id: 'tendances',   labelKey: 'nutrition.tab.tendances'   },
  { id: 'protocole',   labelKey: 'nutrition.tab.protocole'   },
]

export default function NutritionClientPage({
  date, target, consumed, planningConsumed, meals, preps, alerts, trend,
  loggedDates, tdeeAdaptive, tdeeDataSource, bodyWeightKg,
  protocolDay, protocolDays, lang, dayTypeBadge,
  cycleSyncPhase, cycleSyncAdjustment, cycleDay,
  cycleState,
  cycleSyncEnabled = false,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('aujourd_hui')
  const [mealLogOpen, setMealLogOpen] = useState(false)
  const [mealComposerMode, setMealComposerMode] = useState<"standard" | "guide" | "simulation">("standard")
  const [mealEntryMode, setMealEntryMode] = useState<"default" | "search" | "favorites" | "categories">("default")
  const [mealMethodOpen, setMealMethodOpen] = useState(false)
  const [addToMealId, setAddToMealId] = useState<string | null>(null)
  const [editingPrep, setEditingPrep] = useState<SmartNutritionPrep | null>(null)
  const [cycleModalOpen, setCycleModalOpen] = useState(false)
  const [waterOpen, setWaterOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [quickInputMode, setQuickInputMode] = useState<"voice" | "text">("voice")

  const handleMealLogSuccess = useCallback(() => {
    setMealLogOpen(false)
    setMealComposerMode("standard")
    setMealEntryMode("default")
    setAddToMealId(null)
    setEditingPrep(null)
    router.refresh()
  }, [router])

  const handleVoiceSuccess = useCallback(() => {
    setVoiceOpen(false)
    router.refresh()
  }, [router])

  const handleAddMore = useCallback((mealId: string) => {
    setAddToMealId(mealId)
    setEditingPrep(null)
    setMealLogOpen(true)
  }, [])

  const topBarRight = (
    <div className="flex flex-col items-end gap-0.5">
      {dayTypeBadge}
      {cycleState?.currentPhase && cycleState.currentCycleDay && (
        <>
          <CycleArcIndicator
            phase={cycleState.currentPhase}
            cycleDay={cycleState.currentCycleDay}
            avgCycleLength={cycleState.avgCycleLengthDays}
            menstrualLength={cycleState.menstrualPhaseLengthDays}
            confidence={cycleState.confidence}
            onClick={() => setCycleModalOpen(true)}
          />
          <CyclePhaseModal
            open={cycleModalOpen}
            phase={cycleState.currentPhase}
            cycleDay={cycleState.currentCycleDay}
            avgCycleLength={cycleState.avgCycleLengthDays}
            context="nutrition"
            onClose={() => setCycleModalOpen(false)}
          />
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] font-sans pb-32">
      <ClientTopBar section={ct(lang, 'nutrition.section')} title={date} right={topBarRight} />

      <main className="max-w-[480px] mx-auto px-4 pt-[88px] flex flex-col gap-3">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          {TABS.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-[#f2f2f2] text-[#080808] shadow-sm font-barlow-condensed font-bold uppercase tracking-wide'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {ct(lang, labelKey)}
            </button>
          ))}
        </div>

        {/* ══ AUJOURD'HUI ══ */}
        {tab === 'aujourd_hui' && (
          <>
            {cycleSyncPhase && cycleSyncAdjustment && (
              <CycleSyncBanner
                phase={cycleSyncPhase}
                adjustment={cycleSyncAdjustment}
                cycleDay={cycleDay ?? undefined}
              />
            )}
            <SmartNutritionHero date={date} consumed={planningConsumed} target={target} onWaterClick={() => setWaterOpen(true)} />
            <SmartAlertsFeed alerts={alerts} />
            <RemainingBreakdown
              consumed={consumed}
              target={target}
              onCompose={() => setMealMethodOpen(true)}
            />
            <SmartNutritionPrepList
              initialPreps={preps}
              onEdit={(prep) => {
                setEditingPrep(prep)
                setAddToMealId(null)
                setMealEntryMode("default")
                setMealComposerMode("guide")
                setMealLogOpen(true)
              }}
            />
            <NutritionMealsList key={date} initialMeals={meals} date={date} target={target} onAddMeal={() => { setAddToMealId(null); setEditingPrep(null); setMealMethodOpen(true) }} onAddMore={handleAddMore} />
            <VoiceEntryFab lang={lang} />
            <MealMethodSheet
              open={mealMethodOpen}
              onClose={() => setMealMethodOpen(false)}
              onSelect={(method: MealMethodAction) => {
                setMealMethodOpen(false)
                setEditingPrep(null)
                if (method === 'track_voice_text') {
                  setQuickInputMode("voice")
                  setVoiceOpen(true)
                  return
                }
                if (method === "track_search") {
                  setMealEntryMode("search")
                  setMealComposerMode("standard")
                } else if (method === "track_favorites") {
                  setMealEntryMode("favorites")
                  setMealComposerMode("standard")
                } else if (method === "track_categories") {
                  setMealEntryMode("categories")
                  setMealComposerMode("standard")
                } else if (method === "compose_guide" || method === "compose_simulation") {
                  router.push(`/client/nutrition/compose?date=${date}`)
                  return
                } else {
                  setMealEntryMode("default")
                  setMealComposerMode("standard")
                }
                setMealLogOpen(true)
              }}
            />
            <MealLogSheet
              open={mealLogOpen}
              mealId={addToMealId}
              prep={editingPrep}
              composerMode={mealComposerMode}
              entryMode={mealEntryMode}
              intent={mealComposerMode === "standard" ? "track" : "compose"}
              onClose={() => { setMealLogOpen(false); setMealComposerMode("standard"); setMealEntryMode("default"); setAddToMealId(null); setEditingPrep(null) }}
              onSuccess={handleMealLogSuccess}
              balanceContext={{ consumed, target }}
            />
            <VoiceLogSheet
              open={voiceOpen}
              onClose={() => setVoiceOpen(false)}
              onSuccess={handleVoiceSuccess}
              lang={lang}
              initialInputMode={quickInputMode}
            />
            <QuickWaterModal open={waterOpen} onClose={() => setWaterOpen(false)} date={date} />
          </>
        )}

        {/* ══ TENDANCES ══ */}
        {tab === 'tendances' && (
          <>
            <MacroWeekGrid trend={trend} />
            <TdeeChart />
            <NutritionStreakCard loggedDates={loggedDates} today={date} />
          </>
        )}

        {/* ══ PROTOCOLE ══ */}
        {tab === 'protocole' && (
          <ProtocolRationale
            protocolDays={protocolDays}
            tdee={tdeeAdaptive}
            tdeeSource={tdeeDataSource}
            target={target}
            bodyWeightKg={bodyWeightKg}
            activeDayName={protocolDay?.name as string ?? null}
            dayName={protocolDay?.name as string ?? null}
            cycleState={cycleState ?? null}
            cycleSyncEnabled={cycleSyncEnabled}
          />
        )}

      </main>
    </div>
  )
}
