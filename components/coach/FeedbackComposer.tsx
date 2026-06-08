'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import type { FeedbackEntityType } from '@/lib/feedback/types'

interface FeedbackComposerProps {
  open: boolean
  clientId: string
  entityType: FeedbackEntityType
  entityId: string
  entityLabel: string
  onClose: () => void
  onSent: () => void
}

export default function FeedbackComposer({
  open,
  clientId,
  entityType,
  entityId,
  entityLabel,
  onClose,
  onSent,
}: FeedbackComposerProps) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, entity_label: entityLabel, body: body.trim() }),
      })
      if (!res.ok) throw new Error('Erreur réseau')
      setBody('')
      onSent()
      onClose()
    } catch {
      setError('Envoi échoué. Réessaie.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[65] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#181818] rounded-t-2xl border-t border-white/[0.06] p-5"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
            exit={{ y: '100%', transition: { duration: 0.18, ease: 'easeIn' } }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/[0.12]" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-white">Commentaire</p>
                <p className="text-[11px] text-white/40 mt-0.5 truncate max-w-[260px]">{entityLabel}</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Écris ton retour..."
              rows={3}
              autoFocus
              className="w-full bg-white/[0.04] border border-[0.3px] border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#1f8a65]/40 resize-none transition-colors leading-relaxed mb-3"
            />

            {error && <p className="text-[11px] text-red-400 mb-2">{error}</p>}

            <button
              onClick={handleSend}
              disabled={!body.trim() || sending}
              className="w-full h-11 flex items-center justify-center gap-2 bg-[#1f8a65] text-white text-[12px] font-bold uppercase tracking-[0.1em] rounded-xl disabled:opacity-50 hover:bg-[#217356] active:scale-[0.98] transition-all"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
