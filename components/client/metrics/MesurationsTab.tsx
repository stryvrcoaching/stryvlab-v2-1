'use client'

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import MetricCard from './MetricCard'
import type { BodyDataResponse } from '@/app/api/client/body-data/route'

interface Props {
  data: BodyDataResponse
  onSaved?: () => Promise<void> | void
}

function buildMeasureSeries(
  measuresByBilan: BodyDataResponse['measuresByBilan'],
  key: string,
) {
  return measuresByBilan
    .filter(b => b.values?.[key] != null)
    .map(b => ({ date: b.date, value: b.values[key] as number, bilanIndex: b.bilanIndex }))
}

function measureDelta(series: { value: number }[]): { delta: string; deltaGood: boolean } | undefined {
  if (series.length < 2) return undefined
  const diff = series[series.length - 1].value - series[0].value
  const sign = diff > 0 ? '+' : ''
  return { delta: `${sign}${diff} cm`, deltaGood: diff <= 0 }
}

export default function MesurationsTab({ data, onSaved }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [weightKg, setWeightKg] = useState('')
  const [measureInputs, setMeasureInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function saveEntry() {
    const values: Record<string, number> = {}
    const w = Number(weightKg)
    if (Number.isFinite(w) && w > 0) values.weight_kg = w
    for (const key of data.measureOrder) {
      const v = Number(measureInputs[key] ?? '')
      if (Number.isFinite(v) && v > 0) values[key] = v
    }
    if (Object.keys(values).length === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/client/body-data/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      if (res.ok) {
        setWeightKg('')
        setMeasureInputs({})
        await onSaved?.()
      }
    } finally {
      setSaving(false)
    }
  }

  const hasCards = data.measureOrder.some(
    key => buildMeasureSeries(data.measuresByBilan, key).length > 0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-[#5a5a5a]">
          Évolution
        </p>
        <button
          onClick={() => setEditorOpen(v => !v)}
          className="h-8 w-8 rounded-xl bg-white/[0.06] text-[#f2f2f2] flex items-center justify-center active:scale-[0.96] transition-transform"
          aria-label="Ajouter des mensurations"
        >
          <Plus size={16} weight="bold" />
        </button>
      </div>

      {editorOpen && (
        <div className="rounded-2xl bg-[#111111] p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 max-h-[42vh] overflow-y-auto pr-1">
            <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="decimal" placeholder="Poids (kg)" className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none" />
            <div />
            {data.measureOrder.map((key) => (
              <input
                key={key}
                value={measureInputs[key] ?? ''}
                onChange={(e) => setMeasureInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                inputMode="decimal"
                placeholder={`${data.measureLabels[key] ?? key} (cm)`}
                className="h-9 rounded-xl bg-white/[0.05] px-3 text-[12px] text-white placeholder:text-white/30 outline-none"
              />
            ))}
          </div>
          <button onClick={saveEntry} disabled={saving} className="h-9 px-4 rounded-xl bg-[#f2f2f2] text-[#080808] text-[11px] font-bold uppercase tracking-[0.12em] disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {!hasCards && (
        <p className="text-[12px] text-[#5a5a5a] leading-relaxed py-1 text-center">
          Aucune mensuration enregistrée pour le moment.
        </p>
      )}

      {hasCards && (
        <div className="space-y-3">
          {data.measureOrder.map((key) => {
            const series = buildMeasureSeries(data.measuresByBilan, key)
            if (series.length === 0) return null
            const latest = series[series.length - 1]
            const d = measureDelta(series)
            const label = data.measureLabels[key] ?? key
            const unit = ' cm'
            return (
              <MetricCard
                key={key}
                label={label}
                value={`${latest.value}${unit}`}
                series={series}
                unit={unit}
                {...(d ?? {})}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
