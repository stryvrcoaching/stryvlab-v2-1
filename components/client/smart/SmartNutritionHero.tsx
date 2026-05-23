'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getNutritionProgressMeta, type NutritionProgressState } from '@/lib/nutrition/progress'
import type { NutritionMacros } from './SmartNutritionWidget'

type Props = {
  date: string
  consumed: NutritionMacros
  target: NutritionMacros
}

function shiftDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + delta))
  return date.toISOString().slice(0, 10)
}

function formatNav(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(Date.UTC(y, m - 1, d)))
}

export default function SmartNutritionHero({ date, consumed, target }: Props) {
  const effectiveWaterMl = consumed.water_ml
  const kcalMeta = getNutritionProgressMeta(consumed.kcal, target.kcal)
  const pct = Math.min(kcalMeta.ratio, 1)
  const total = 251.2
  const offset = total * (1 - pct)
  const prev = shiftDate(date, -1)
  const next = shiftDate(date, 1)
  const waterMeta = getNutritionProgressMeta(effectiveWaterMl, target.water_ml)

  function getStateColor(state: NutritionProgressState, baseColor: string): string {
    switch (state) {
      case 'over':
        return '#ef4444'
      case 'near_limit':
        return '#f59e0b'
      case 'in_target':
        return baseColor
      default:
        return 'rgba(255,255,255,0.55)'
    }
  }

  const kcalStroke = getStateColor(kcalMeta.state, '#f2f2f2')
  const kcalBadge =
    kcalMeta.state === 'over'
      ? 'Dépassement'
      : kcalMeta.state === 'near_limit'
        ? 'Proche de la limite'
        : kcalMeta.state === 'in_target'
          ? 'Dans la cible'
          : 'En progression'

  return (
    <>
      <div className="bg-[#111111] rounded-2xl p-[18px]">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/client/nutrition?date=${prev}`} className="flex items-center gap-1 text-white/60 text-[11px]">
            <ChevronLeft size={14} /> {formatNav(prev)}
          </Link>
          <span className="text-[18px] font-black tracking-[-0.02em] text-white">{formatNav(date)}</span>
          <Link href={`/client/nutrition?date=${next}`} className="flex items-center gap-1 text-white/60 text-[11px]">
            {formatNav(next)} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="relative h-[180px]">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={kcalStroke}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={total}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <div className="text-[32px] font-black leading-none text-white tabular-nums">{Math.round(consumed.kcal)}</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35 mt-1">Calories consommées</div>
            <div className="text-[11px] text-white/50 mt-1 tabular-nums">/ {target.kcal} kcal</div>
            <div
              className="mt-2 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{
                color: kcalStroke,
                background: kcalMeta.state === 'under' ? 'rgba(255,255,255,0.06)' : `${kcalStroke}1A`,
              }}
            >
              {kcalBadge}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          {([
            { key: 'protein_g', label: 'P', color: '#e85d04' },
            { key: 'carbs_g',   label: 'G', color: '#22c55e' },
            { key: 'fat_g',     label: 'L', color: '#f59e0b' },
          ] as const).map(m => {
            const c = (consumed as any)[m.key] ?? 0
            const tg = (target as any)[m.key] ?? 0
            const meta = getNutritionProgressMeta(c, tg)
            const fillColor = getStateColor(meta.state, m.color)
            return (
              <div key={m.key} className="text-center">
                <div className="text-[20px] font-black tabular-nums" style={{ color: meta.state === 'under' ? 'white' : fillColor }}>
                  {Math.round(c)}<span className="text-[12px] text-white/40">/{tg}g</span>
                </div>
                <div className="text-[9px] text-white/55 uppercase font-bold tracking-[0.1em] mt-1">{m.label}</div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
                  <div className="h-full" style={{ width: `${meta.clampedPercent}%`, background: fillColor }} />
                </div>
                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full"
                    style={{
                      width: `${meta.overflowPercent}%`,
                      background: '#ef4444',
                      opacity: meta.state === 'over' ? 1 : 0,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Hydratation bar */}
        <div className="flex items-center gap-3 mt-4 pt-3">
          <span className="text-[13px]">💧</span>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-white/50 font-semibold uppercase tracking-[0.08em]">Hydratation</span>
              <span className="text-white font-bold tabular-nums">
                {(effectiveWaterMl / 1000).toFixed(1)} / {(target.water_ml / 1000).toFixed(1)} L
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${waterMeta.clampedPercent}%`,
                  background: getStateColor(waterMeta.state, '#22d3ee'),
                }}
              />
            </div>
            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden mt-1">
              <div
                className="h-full"
                style={{
                  width: `${waterMeta.overflowPercent}%`,
                  background: '#ef4444',
                  opacity: waterMeta.state === 'over' ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
