'use client'

import { useState } from 'react'
import BodyMap from '@/components/client/BodyMap'
import type { BilanMeasures } from '@/app/api/client/body-data/route'

interface Props {
  bilanList: BilanMeasures[]
}

// Vertical positions as % of front SVG height (88px wide → ~187px tall at aspect 616/1308)
// Values derived from anatomical y-positions in BodyMap viewBox "42 42 616 1308"
const ANNOTATIONS = [
  { key: 'chest_cm' as const, label: 'Poitrine', topPct: 29 },
  { key: 'arm_cm'   as const, label: 'Bras',     topPct: 34 },
  { key: 'waist_cm' as const, label: 'Taille',   topPct: 40 },
  { key: 'hips_cm'  as const, label: 'Hanches',  topPct: 48 },
]

function deltaInfo(cur: number | null, prev: number | null) {
  if (cur == null || prev == null) return null
  const diff = parseFloat((cur - prev).toFixed(1))
  if (Math.abs(diff) < 0.4) return null
  return {
    text: `${diff > 0 ? '+' : ''}${diff}`,
    color: diff < 0 ? '#6aab8e' : '#ef4444',
  }
}

export default function BodyMapAnnotated({ bilanList }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(bilanList.length - 1)

  if (bilanList.length === 0) return null

  const idx     = Math.min(selectedIdx, bilanList.length - 1)
  const selected = bilanList[idx]
  const prev     = idx > 0 ? bilanList[idx - 1] : null

  // SVG front renders at w-[88px] → ~187px tall (aspect 616/1308)
  // Both SVGs together = 88 + 24 (gap-6) + 88 = 200px, centered in container.
  // Front SVG left edge = calc(50% - 100px), right edge = calc(50% - 12px).
  // Value labels: right edge at calc(50% + 100px) from left = front SVG left edge.
  // Label text: left edge at calc(50% - 12px) = front SVG right edge.

  return (
    <div className="space-y-3">

      {/* Bilan selector pills */}
      {bilanList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {bilanList.map((b, i) => {
            const active = i === idx
            const dt = new Date(b.date + 'T00:00:00')
            const label = dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            return (
              <button
                key={b.bilanIndex}
                onClick={() => setSelectedIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? 'bg-[#f2f2f2] text-[#080808]'
                    : 'bg-white/[0.06] text-[#5a5a5a]'
                }`}
              >
                B{b.bilanIndex} · {label}
              </button>
            )
          })}
        </div>
      )}

      {/* BodyMap + annotation overlay */}
      <div className="relative w-full" style={{ height: 200 }}>

        {/* BodyMap — bright, centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BodyMap className="opacity-[0.88]" />
        </div>

        {/* Left side — measurement values */}
        {ANNOTATIONS.map(({ key, topPct }) => {
          const val = selected[key]
          if (val == null) return null
          const delta = deltaInfo(val, prev ? prev[key] : null)
          return (
            <div
              key={key}
              className="absolute flex items-center justify-end gap-1.5"
              style={{ top: `${topPct}%`, right: 'calc(50% + 103px)' }}
            >
              <div className="text-right leading-none">
                <span className="block text-[11px] font-barlow font-bold text-[#d0d0d0]">
                  {val}
                  <span className="text-[9px] font-normal text-[#6a6a6a] ml-0.5">cm</span>
                </span>
                {delta && (
                  <span className="block text-[8px] font-barlow" style={{ color: delta.color }}>
                    {delta.text}
                  </span>
                )}
              </div>
              {/* Dashed connector to body */}
              <div
                className="shrink-0"
                style={{
                  width: 14,
                  height: 1,
                  background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 3px, transparent 3px, transparent 6px)',
                }}
              />
            </div>
          )
        })}

        {/* Right side — measurement labels */}
        {ANNOTATIONS.map(({ key, label, topPct }) => {
          if (selected[key] == null) return null
          return (
            <div
              key={key}
              className="absolute flex items-center gap-1.5"
              style={{ top: `${topPct}%`, left: 'calc(50% - 12px)' }}
            >
              {/* Dashed connector from body */}
              <div
                className="shrink-0"
                style={{
                  width: 14,
                  height: 1,
                  background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 3px, transparent 3px, transparent 6px)',
                }}
              />
              <span className="text-[9px] font-barlow text-[#5a5a5a] uppercase tracking-[0.08em]">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
