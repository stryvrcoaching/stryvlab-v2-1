'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useClient } from '@/lib/client-context'
import { useClientTopBar } from '@/components/clients/useClientTopBar'
import { MessageSquare } from 'lucide-react'
import type { CoachFeedback, FeedbackEntityType } from '@/lib/feedback/types'
import { ENTITY_TYPE_LABEL } from '@/lib/feedback/types'
import { Skeleton } from '@/components/ui/skeleton'

const FILTERS: { label: string; value: FeedbackEntityType | 'all' }[] = [
  { label: 'Tout', value: 'all' },
  { label: '🏋️ Sessions', value: 'session' },
  { label: '💪 Exercices', value: 'exercise' },
  { label: '📊 Check-ins', value: 'checkin' },
  { label: '📷 Morpho', value: 'morpho' },
  { label: '📋 Bilans', value: 'bilan' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export default function ClientFeedbackPage() {
  const { clientId } = useParams() as { clientId: string }
  const { client } = useClient()
  useClientTopBar('Feedback')

  const [feedbacks, setFeedbacks] = useState<CoachFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FeedbackEntityType | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? `/api/clients/${clientId}/feedback`
        : `/api/clients/${clientId}/feedback?entity_type=${filter}`
      const res = await fetch(url)
      if (res.ok) setFeedbacks(await res.json())
    } finally {
      setLoading(false)
    }
  }, [clientId, filter])

  useEffect(() => { load() }, [load])

  return (
    <div className="px-4 pb-24 space-y-4 pt-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              filter === f.value
                ? 'bg-[#1f8a65]/10 text-[#1f8a65]'
                : 'bg-white/[0.03] text-white/40 hover:text-white/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
            <MessageSquare size={20} className="text-white/20" />
          </div>
          <p className="text-[13px] text-white/40">Aucun commentaire</p>
          <p className="text-[11px] text-white/25 mt-1">Ajoute des retours depuis les fiches séance, check-in ou morpho</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-white/30">
                  {ENTITY_TYPE_LABEL[fb.entity_type]}{fb.entity_label ? ` — ${fb.entity_label}` : ''}
                </span>
                <span className="text-[10px] text-white/20">{timeAgo(fb.created_at)}</span>
              </div>
              <p className="text-[13px] text-white/80 leading-relaxed">{fb.body}</p>
              {fb.reactions.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-white/[0.04] pt-3">
                  {fb.reactions.map(r => (
                    <div key={r.id} className="flex items-start gap-2">
                      <span className="text-[14px]">{r.emoji}</span>
                      <div>
                        <span className="text-[10px] text-white/30">{r.author_type === 'client' ? client.first_name ?? 'Client' : 'Coach'}</span>
                        {r.reply_text && <p className="text-[12px] text-white/60 mt-0.5">{r.reply_text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
