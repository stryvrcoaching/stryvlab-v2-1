import Link from 'next/link'
import type { NutritionMacros } from './SmartNutritionWidget'
import { computeNutritionBalance } from '@/lib/nutrition/balance'
import { suggestFoodsFromBalance } from '@/lib/nutrition/recommendations'

export default function RemainingBreakdown({ consumed, target }: { consumed: NutritionMacros; target: NutritionMacros }) {
  const balance = computeNutritionBalance(consumed, target)
  const { remaining, overflow, remainingCaloriesNet, remainingCaloriesFromMacros } = balance
  const suggestions = suggestFoodsFromBalance(balance)

  return (
    <div className="bg-[#111111] rounded-2xl p-4">
      <div className="font-barlow-condensed font-bold uppercase tracking-[0.18em] text-[11px] text-white mb-2">
        Reste à consommer
      </div>
      <div className="space-y-1.5 text-[12px] text-white/70 tabular-nums">
        <p>{Math.round(remainingCaloriesNet)} kcal nettes · {Math.round(remainingCaloriesFromMacros)} kcal via macros restantes</p>
        <p>{Math.round(remaining.protein_g)}g P restant · +{Math.round(overflow.protein_g)}g dépassés</p>
        <p>{Math.round(remaining.carbs_g)}g G restant · +{Math.round(overflow.carbs_g)}g dépassés</p>
        <p>{Math.round(remaining.fat_g)}g L restant · +{Math.round(overflow.fat_g)}g dépassés · {(remaining.water_ml / 1000).toFixed(1)}L eau restante</p>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          {suggestions.map(s => (
            <Link
              key={s.label}
              href="/client/nutrition/log"
              className="block bg-white/[0.02] rounded-xl p-3 active:scale-[0.99] transition-transform"
            >
              <div className="text-[12px] font-semibold text-white">{s.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{s.macros}</div>
              <div className="text-[10px] text-white/30 mt-1">{s.rationale}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
