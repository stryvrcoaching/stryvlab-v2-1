"use client"

import type { RemainingNutritionTargets } from "@/lib/nutrition/remaining-targets"
import { NUTRITION_UI_COLORS } from "@/lib/nutrition/ui-colors"

type RemainingNutritionSummaryProps = {
  remaining: RemainingNutritionTargets
  overflow?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  /** When true, renders in the violet/indigo planning theme instead of neutral */
  variant?: "neutral" | "violet"
}

function formatRemainingMacro(value: number, overflow = 0): string {
  if (overflow >= 1) return `+${Math.round(overflow)} g`
  if (value > 0) return `${Math.round(value)} g`
  return "déjà atteint"
}

function formatRemainingCalories(value: number, overflow = 0): string {
  if (overflow >= 4) return `+${Math.round(overflow)} kcal`
  if (value > 0) return `${Math.round(value)} kcal restantes`
  return "objectif atteint"
}

export default function RemainingNutritionSummary({ remaining, overflow, variant = "neutral" }: RemainingNutritionSummaryProps) {
  const isViolet = variant === "violet"

  const wrapperStyle = isViolet
    ? { background: "rgba(129,140,248,0.07)", border: "0.3px solid rgba(129,140,248,0.14)" }
    : { background: "rgba(255,255,255,0.04)" }

  const titleColor = isViolet ? "rgba(129,140,248,0.7)" : "rgba(255,255,255,0.30)"
  const subtitleColor = isViolet ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.35)"
  const cardBg = isViolet ? "rgba(129,140,248,0.06)" : "rgba(255,255,255,0.03)"

  return (
    <div className="rounded-2xl p-4 mb-3" style={wrapperStyle}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p
          className="text-[10px] uppercase tracking-[0.16em] font-bold"
          style={{ color: titleColor }}
        >
          Reste à consommer
        </p>
        <p className="text-[10px]" style={{ color: subtitleColor }}>
          Suivez cette cible ajustée.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-2.5" style={{ background: cardBg }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Protéines</p>
          <p className="text-[14px] font-black mt-1" style={{ color: (overflow?.protein ?? 0) >= 1 ? '#ef4444' : NUTRITION_UI_COLORS.protein }}>
            {formatRemainingMacro(remaining.protein, overflow?.protein ?? 0)}
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: cardBg }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Glucides</p>
          <p className="text-[14px] font-black mt-1" style={{ color: (overflow?.carbs ?? 0) >= 1 ? '#ef4444' : NUTRITION_UI_COLORS.carbs }}>
            {formatRemainingMacro(remaining.carbs, overflow?.carbs ?? 0)}
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: cardBg }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Lipides</p>
          <p className="text-[14px] font-black mt-1" style={{ color: (overflow?.fat ?? 0) >= 1 ? '#ef4444' : NUTRITION_UI_COLORS.fat }}>
            {formatRemainingMacro(remaining.fat, overflow?.fat ?? 0)}
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: cardBg }}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">Calories</p>
          <p className="text-[14px] font-black mt-1" style={{ color: (overflow?.calories ?? 0) >= 4 ? '#ef4444' : NUTRITION_UI_COLORS.calories }}>
            {formatRemainingCalories(remaining.calories, overflow?.calories ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
