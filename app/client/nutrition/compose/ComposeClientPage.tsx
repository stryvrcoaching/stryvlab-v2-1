'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import { NutritionLogContent, type NutritionLogContentHandle } from '@/app/client/nutrition/log/NutritionLogContent'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'

interface ComposeClientPageProps {
  planningConsumed: NutritionMacros
  target: NutritionMacros
  date: string
}

type DraftTotals = { calories: number; protein: number; carbs: number; fat: number; count: number }

const ZERO_DRAFTS: DraftTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }

export default function ComposeClientPage({ planningConsumed, target, date }: ComposeClientPageProps) {
  const router = useRouter()
  const logRef = useRef<NutritionLogContentHandle>(null)
  const [draftTotals, setDraftTotals] = useState<DraftTotals>(ZERO_DRAFTS)
  const [saving, setSaving] = useState<'prep' | 'meal' | null>(null)

  const effectiveConsumed: NutritionMacros = {
    kcal: planningConsumed.kcal + draftTotals.calories,
    protein_g: planningConsumed.protein_g + draftTotals.protein,
    carbs_g: planningConsumed.carbs_g + draftTotals.carbs,
    fat_g: planningConsumed.fat_g + draftTotals.fat,
    water_ml: planningConsumed.water_ml,
  }

  const handleDraftsChange = useCallback((totals: DraftTotals) => {
    setDraftTotals(totals)
  }, [])

  async function handleSavePrep() {
    setSaving('prep')
    await logRef.current?.savePrep()
    logRef.current?.clearDrafts()
    setSaving(null)
  }

  async function handleSaveMeal() {
    setSaving('meal')
    await logRef.current?.saveMeal()
    setSaving(null)
    router.push('/client/nutrition')
  }

  function handleCancel() {
    logRef.current?.clearDrafts()
  }

  const hasDrafts = draftTotals.count > 0

  return (
    <main className="bg-[#0d0d0d] flex flex-col h-[100dvh] overflow-hidden">
      <ClientTopBar
        section="Smart Nutrition"
        title="Je compose"
        right={
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/50 active:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
        }
      />

      {/* Hero simulation — fixed, always visible */}
      <div className="shrink-0 px-4 pt-16 pb-1">
        <SmartNutritionHero
          date={date}
          consumed={effectiveConsumed}
          target={target}
          simulationMode
        />
      </div>

      {/* Actions zone — appears when at least 1 draft food */}
      {hasDrafts && (
        <div className="shrink-0 px-4 py-3 grid grid-cols-3 gap-2">
          <button
            onClick={handleCancel}
            disabled={saving !== null}
            className="h-11 rounded-xl bg-white/[0.04] text-white/40 text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.1em] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSavePrep}
            disabled={saving !== null}
            className="h-11 rounded-xl bg-white/[0.04] text-white/70 text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.1em] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving === 'prep' ? '...' : 'Sauver'}
          </button>
          <button
            onClick={handleSaveMeal}
            disabled={saving !== null}
            className="h-11 rounded-xl bg-[#ffe01e] text-[#0d0d0d] text-[11px] font-barlow-condensed font-bold uppercase tracking-[0.1em] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving === 'meal' ? '...' : 'Valider'}
          </button>
        </div>
      )}

      {/* Composer — flex-1 scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <NutritionLogContent
          ref={logRef}
          embedded
          composerMode="guide"
          hideActions
          onDraftsChange={handleDraftsChange}
          balanceContext={{ consumed: planningConsumed, target }}
        />
      </div>
    </main>
  )
}
