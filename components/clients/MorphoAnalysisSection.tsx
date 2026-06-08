'use client'

import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dna, RefreshCw, MessageSquare } from 'lucide-react'
import FeedbackComposer from '@/components/coach/FeedbackComposer'

interface MorphoAnalysis {
  id: string
  analysis_date: string
  status: 'pending' | 'completed' | 'failed'
  body_composition?: {
    body_fat_pct?: number
    estimated_muscle_mass_kg?: number
  } | null
  asymmetries?: {
    arm_diff_cm?: number
    shoulder_imbalance_cm?: number
    posture_notes?: string
  } | null
  stimulus_adjustments?: Record<string, number> | null
}

interface Props {
  clientId: string
}

export function MorphoAnalysisSection({ clientId }: Props) {
  const [latest, setLatest] = useState<MorphoAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/morpho/latest`)
      const data = await res.json()
      setLatest(data.data ?? null)
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchLatest()
  }, [fetchLatest])

  // Polling du job en cours
  useEffect(() => {
    if (!pollingJobId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/morpho/job-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: pollingJobId }),
        })
        const data = await res.json()
        console.log('[morpho/job-status] poll:', data)

        if (data.status === 'completed') {
          clearInterval(interval)
          setPollingJobId(null)
          fetchLatest()
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setPollingJobId(null)
          setErrorMsg(data.error_message ?? 'Analyse échouée. Vérifiez les photos du bilan.')
        }
      } catch {
        // silently ignore polling errors
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [pollingJobId, clientId, fetchLatest])

  async function handleAnalyze() {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/morpho/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      console.log('[morpho/analyze] status:', res.status, 'body:', data)
      if (res.ok) {
        setPollingJobId(data.job_id)
      } else {
        setErrorMsg(data.error ?? `Erreur ${res.status}`)
      }
    } catch (e) {
      setErrorMsg(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  const isAnalyzing = !!pollingJobId

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
          Analyse Morphologique
        </p>
        {!isAnalyzing && (
          <button
            onClick={handleAnalyze}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#1f8a65]/10 text-[#1f8a65] text-[10px] font-bold hover:bg-[#1f8a65]/20 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            <Dna size={11} strokeWidth={2} />
            Analyser Morpho
          </button>
        )}
      </div>

      {errorMsg && !isAnalyzing && (
        <div className="bg-red-500/[0.08] rounded-xl px-4 py-3 border-[0.3px] border-red-500/20">
          <p className="text-[11px] text-red-400">{errorMsg}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-4 py-3 border-[0.3px] border-[#1f8a65]/20">
          <RefreshCw size={12} className="text-[#1f8a65] animate-spin" />
          <p className="text-[11px] text-white/60">Analyse en cours (~30s)…</p>
        </div>
      )}

      {latest && !isAnalyzing && (
        <div className="bg-white/[0.02] rounded-xl p-4 space-y-3 border-[0.3px] border-white/[0.06]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/35">
              {new Date(latest.analysis_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <button
              onClick={() => setComposerOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:text-white/70 transition-colors"
              title="Commenter cette analyse"
            >
              <MessageSquare size={13} />
            </button>
          </div>

          {latest.body_composition && (
            <div className="grid grid-cols-2 gap-2">
              {latest.body_composition.body_fat_pct !== undefined && (
                <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                  <p className="text-[15px] font-black text-[#1f8a65] leading-none">
                    {latest.body_composition.body_fat_pct}%
                  </p>
                  <p className="text-[9px] text-white/40 mt-0.5">Masse grasse</p>
                </div>
              )}
              {latest.body_composition.estimated_muscle_mass_kg !== undefined && (
                <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                  <p className="text-[15px] font-black text-[#1f8a65] leading-none">
                    {Math.round(latest.body_composition.estimated_muscle_mass_kg)}kg
                  </p>
                  <p className="text-[9px] text-white/40 mt-0.5">Masse musc.</p>
                </div>
              )}
            </div>
          )}

          {latest.asymmetries && (
            <div className="space-y-1">
              {latest.asymmetries.shoulder_imbalance_cm !== undefined && (
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-white/50">Déséquilibre épaule</p>
                  <p className="text-[10px] font-semibold text-white/80">
                    {latest.asymmetries.shoulder_imbalance_cm}cm
                  </p>
                </div>
              )}
              {latest.asymmetries.arm_diff_cm !== undefined && (
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-white/50">Asymétrie bras</p>
                  <p className="text-[10px] font-semibold text-white/80">
                    {latest.asymmetries.arm_diff_cm}cm
                  </p>
                </div>
              )}
              {latest.asymmetries.posture_notes && (
                <p className="text-[10px] text-white/40 italic mt-1">
                  {latest.asymmetries.posture_notes}
                </p>
              )}
            </div>
          )}

          {latest.stimulus_adjustments && (
            <p className="text-[9px] text-[#1f8a65]/70">
              ✓ Ajustements de stimulus appliqués au scoring
            </p>
          )}
        </div>
      )}

      {!latest && !isAnalyzing && (
        <p className="text-[11px] text-white/30 italic">
          Aucune analyse disponible. Ajoutez des photos au bilan pour démarrer.
        </p>
      )}

      {latest && composerOpen && (
        <FeedbackComposer
          open={composerOpen}
          clientId={clientId}
          entityType="morpho"
          entityId={latest.id}
          entityLabel={`Morpho du ${new Date(latest.analysis_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          onClose={() => setComposerOpen(false)}
          onSent={() => setComposerOpen(false)}
        />
      )}
    </div>
  )
}
