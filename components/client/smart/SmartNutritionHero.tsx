'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { shiftIsoDate } from '@/lib/utils/date'
import { getNutritionProgressMeta, type NutritionProgressState } from '@/lib/nutrition/progress'
import { computeNutritionBalance } from '@/lib/nutrition/balance'
import { computeActionableRemaining } from '@/lib/nutrition/actionable-remaining'
import type { NutritionMacros } from './SmartNutritionWidget'
import { NUTRITION_UI_COLORS } from '@/lib/nutrition/ui-colors'
import { useClientT } from '../ClientI18nProvider'

const OVERFLOW_ALERT = {
  calories: 4,
  macro: 1,
} as const

type Props = {
  date: string
  consumed: NutritionMacros
  target: NutritionMacros
  onWaterClick?: () => void
  simulationMode?: boolean
  gender?: string | null
  bodyWeightKg?: number | null
  compact?: boolean
  micro?: boolean
}

// ── Arc geometry — 240° gauge ─────────────────────────────────────────────────
// Center (110,110), r=76, gap 120° at bottom, clockwise
// Start (bottom-left): (44.2, 148) — End (bottom-right): (175.8, 148)
// Arc length: 2π × 76 × (240/360) ≈ 319
// Equator (y=110) sits at (110−15)/145 = 65.5 % from top of viewBox "20 15 180 145"
const ARC_R   = 76
const ARC_D   = `M 44.2,148 A ${ARC_R},${ARC_R} 0 1,1 175.8,148`
const ARC_LEN = 2 * Math.PI * ARC_R * (240 / 360)  // ≈ 319

const MACRO_KEYS = [
  { key: 'protein_g' as const, iKey: 'nutrition.protein' as const, color: NUTRITION_UI_COLORS.protein },
  { key: 'carbs_g'   as const, iKey: 'nutrition.carbs' as const,   color: NUTRITION_UI_COLORS.carbs   },
  { key: 'fat_g'     as const, iKey: 'nutrition.fat' as const,     color: NUTRITION_UI_COLORS.fat     },
]

const shiftDate = shiftIsoDate

function formatNav(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(Date.UTC(y, m - 1, d)))
}

function formatOverflow(value: number, unit: 'g' | 'L'): string | null {
  if (value <= 0) return null
  return unit === 'L' ? `+${value.toFixed(1)} L au-dessus` : `+${Math.round(value)}g au-dessus`
}

function getStateColor(state: NutritionProgressState, base: string): string {
  if (state === 'over')       return '#ef4444'
  if (state === 'near_limit') return '#f59e0b'
  return base
}

function formatRemainingLabel(value: number, unit: 'g' | 'L'): string {
  if (value <= 0) return 'objectif atteint'
  if (unit === 'L') return `${value.toFixed(1)} L restants`
  return `${Math.round(value)}g restants`
}

export default function SmartNutritionHero({
  date,
  consumed,
  target,
  onWaterClick,
  simulationMode = false,
  compact = false,
  micro = false,
}: Props) {
  const { t } = useClientT()
  const prev = shiftDate(date, -1)
  const next = shiftDate(date, 1)
  const MACROS = MACRO_KEYS.map(m => ({ ...m, label: t(m.iKey as any) }))
  const actionable = computeActionableRemaining({
    target,
    consumed,
    profile: { gender, weightKg: bodyWeightKg },
  })
  const informativeBalance = computeNutritionBalance(consumed, target)

  const kcalMeta   = getNutritionProgressMeta(consumed.kcal, target.kcal)
  const pct        = Math.min(kcalMeta.ratio, 1)
  const arcOffset  = ARC_LEN * (1 - pct)
  const kcalDelta = {
    text:
      informativeBalance.overflow.kcal >= OVERFLOW_ALERT.calories
        ? `+${Math.round(informativeBalance.overflow.kcal)}`
        : String(Math.round(actionable.actionableRemaining.calories)),
    overflow: informativeBalance.overflow.kcal >= OVERFLOW_ALERT.calories,
  }
  const kcalColor  = kcalDelta.overflow ? '#ef4444' : NUTRITION_UI_COLORS.calories
  const kcalStroke = kcalColor

  const waterMeta          = getNutritionProgressMeta(consumed.water_ml, target.water_ml)
  const waterOverflowLabel = formatOverflow((consumed.water_ml - target.water_ml) / 1000, 'L')
  const cardPadding = micro ? '8px' : compact ? '12px' : '18px'
  const arcHeight = micro ? 72 : compact ? 112 : 145
  const consumedTextSize = micro ? 'text-[18px]' : compact ? 'text-[22px]' : 'text-[28px]'
  const macroGapClass = micro ? 'gap-1.5 mt-0' : compact ? 'gap-2 mt-0.5' : 'gap-3 mt-2'
  const showMacroHelpers = !micro

  return (
    <div
      className="bg-[#111111] rounded-2xl"
      style={{ padding: cardPadding }}
    >

      {/* ── Date nav — hidden in simulation ── */}
      {!simulationMode && (
        <div className="flex items-center justify-between mb-1">
          <Link href={`/client/nutrition?date=${prev}`} className="flex items-center gap-1 text-white/50 text-[11px]">
            <ChevronLeft size={14} />{formatNav(prev)}
          </Link>
          <span className="text-[17px] font-black tracking-[-0.02em] text-white">{formatNav(date)}</span>
          <Link href={`/client/nutrition?date=${next}`} className="flex items-center gap-1 text-white/50 text-[11px]">
            {formatNav(next)}<ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Arc + values overlay ──────────────────────────────────────────── */}
      {/* viewBox "20 15 180 145" — equator y=110 sits at 65.5 % from top   */}
      <div className="relative" style={{ height: arcHeight }}>
        <svg
          viewBox="20 15 180 145"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Track */}
          <path d={ARC_D} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" />
          {/* Progress */}
          <path
            d={ARC_D}
            fill="none"
            stroke={kcalStroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={arcOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Values — floating at equator (65.5 % from top) */}
        <div
          className="absolute left-0 right-0 grid grid-cols-3 items-center px-1"
          style={{ top: '65.5%', transform: 'translateY(-50%)' }}
        >
          <div />

          {/* Delta calories */}
          <div className="text-center">
            <div
              className={`${consumedTextSize} font-black tabular-nums leading-none`}
              style={{ color: kcalStroke }}
            >
              {kcalDelta.text}
            </div>
            <div className={`uppercase tracking-[0.14em] text-white/35 ${micro ? 'text-[8px] mt-0.5' : 'text-[9px] mt-1'}`}>
              {kcalDelta.overflow ? 'Au-dessus' : 'Restant'}
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* ── Macros: label → bar → Xg/Xg ── */}
      <div className={`grid grid-cols-3 ${macroGapClass}`}>
        {MACROS.map(m => {
          const consumedValue = consumed[m.key] ?? 0
          const rawTarget = target[m.key] ?? 0
          const displayTarget = rawTarget
          const meta = getNutritionProgressMeta(consumedValue, Math.max(displayTarget, 0))
          const macroKey =
            m.key === 'protein_g'
              ? 'protein_g'
              : m.key === 'carbs_g'
                ? 'carbs_g'
                : 'fat_g'
          const actionableRemaining =
            macroKey === 'protein_g'
              ? actionable.actionableRemaining.protein
              : macroKey === 'carbs_g'
                ? actionable.actionableRemaining.carbs
                : actionable.actionableRemaining.fat
          const overflowValue = actionable.overflow[macroKey]
          const macroDelta = {
            text:
              overflowValue >= OVERFLOW_ALERT.macro
                ? `+${Math.round(overflowValue)}`
                : String(Math.round(actionableRemaining)),
            overflow: overflowValue >= OVERFLOW_ALERT.macro,
            remaining: actionableRemaining,
          }
          const fillColor = simulationMode
            ? macroDelta.overflow
              ? '#ef4444'
              : m.color
            : macroDelta.overflow
              ? '#ef4444'
              : m.color
          const helperLabel =
            macroDelta.overflow
              ? 'au-dessus'
              : formatRemainingLabel(macroDelta.remaining, 'g')
          return (
            <div key={m.key}>
              <div className={`text-white/40 uppercase font-bold tracking-[0.08em] ${micro ? 'text-[8px] mb-1' : 'text-[9px] mb-1.5'}`}>
                {m.label}
              </div>
              <div className={`${micro ? 'h-1' : 'h-1.5'} bg-white/[0.06] rounded-full overflow-hidden`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${meta.clampedPercent}%`, background: fillColor }}
                />
              </div>
              <div
                className={`${micro ? 'mt-1 text-[10px]' : 'mt-1.5 text-[11px]'} font-bold tabular-nums`}
                style={{ color: fillColor }}
              >
                {macroDelta.text}g
              </div>
              {showMacroHelpers && (
                <div
                  className="text-[8px] font-bold mt-0.5 min-h-[12px]"
                  style={{ color: macroDelta.overflow ? '#ef4444' : 'rgba(255,255,255,0.32)' }}
                >
                  {helperLabel}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!simulationMode && (
        <button
          onClick={onWaterClick}
          className={`${compact ? 'mt-3 pt-2.5' : 'mt-4 pt-3'} w-full text-left group`}
          disabled={!onWaterClick}
        >
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className={`font-semibold uppercase tracking-[0.08em] transition-colors ${onWaterClick ? 'text-white/40 group-hover:text-white/60' : 'text-white/40'}`}>
              Hydratation
            </span>
            <span className="text-white font-bold tabular-nums">
              {(consumed.water_ml / 1000).toFixed(1)} / {(target.water_ml / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${waterMeta.clampedPercent}%`,
                background: getStateColor(waterMeta.state, NUTRITION_UI_COLORS.water),
              }}
            />
          </div>
          <div
            className="mt-1 min-h-[14px] text-[9px] font-bold tabular-nums"
            style={{ color: waterMeta.state === 'over' ? '#ef4444' : 'rgba(255,255,255,0.28)' }}
          >
            {waterOverflowLabel ?? ' '}
          </div>
        </button>
      )}

    </div>
  )
}
