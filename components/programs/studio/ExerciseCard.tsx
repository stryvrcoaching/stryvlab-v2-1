// components/programs/studio/ExerciseCard.tsx
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  Trash2, Upload, Library, Link2, Link2Off, ChevronUp, ChevronDown, GripVertical,
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import IntelligenceAlertBadge from '@/components/programs/IntelligenceAlertBadge'
import ExerciseClientAlternatives, { type ExerciseClientAlternativesHandle } from '@/components/programs/ExerciseClientAlternatives'
import type { IntelligenceAlert } from '@/lib/programs/intelligence'

const MOVEMENT_PATTERNS = [
  { value: '', label: '— Pattern —' },
  { value: 'horizontal_push', label: 'Poussée horizontale' },
  { value: 'vertical_push', label: 'Poussée verticale' },
  { value: 'horizontal_pull', label: 'Tirage horizontal' },
  { value: 'vertical_pull', label: 'Tirage vertical' },
  { value: 'squat_pattern', label: 'Pattern squat' },
  { value: 'hip_hinge', label: 'Charnière hanche' },
  { value: 'knee_flexion', label: 'Flexion genou' },
  { value: 'knee_extension', label: 'Extension genou' },
  { value: 'calf_raise', label: 'Extension mollets' },
  { value: 'elbow_flexion', label: 'Flexion coude (Biceps)' },
  { value: 'elbow_extension', label: 'Extension coude (Triceps)' },
  { value: 'lateral_raise', label: 'Élévation latérale' },
  { value: 'hip_abduction', label: 'Abduction hanche' },
  { value: 'hip_adduction', label: 'Adduction hanche' },
  { value: 'shoulder_rotation', label: 'Rotation épaule' },
  { value: 'carry', label: 'Porté (Carry)' },
  { value: 'scapular_elevation', label: 'Élévation scapulaire (Shrug)' },
  { value: 'scapular_retraction', label: 'Rétraction scapulaire' },
  { value: 'scapular_protraction', label: 'Protraction scapulaire' },
  { value: 'core_anti_flex', label: 'Gainage anti-flexion' },
  { value: 'core_flex', label: 'Flexion core' },
  { value: 'core_rotation', label: 'Rotation core' },
]

const EQUIPMENT_ITEMS = [
  { value: 'bodyweight', label: 'Poids corps' },
  { value: 'band', label: 'Élastique' },
  { value: 'dumbbell', label: 'Haltère' },
  { value: 'barbell', label: 'Barre' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Poulie' },
  { value: 'smith', label: 'Smith' },
  { value: 'trx', label: 'TRX' },
  { value: 'ez_bar', label: 'Barre EZ' },
  { value: 'trap_bar', label: 'Trap Bar' },
]

const MUSCLE_GROUPS = [
  { slug: 'chest', label: 'Pectoraux' },
  { slug: 'shoulders', label: 'Épaules' },
  { slug: 'biceps', label: 'Biceps' },
  { slug: 'triceps', label: 'Triceps' },
  { slug: 'abs', label: 'Abdos' },
  { slug: 'back_upper', label: 'Dos haut' },
  { slug: 'back_lower', label: 'Lombaires' },
  { slug: 'traps', label: 'Trapèzes' },
  { slug: 'quads', label: 'Quadriceps' },
  { slug: 'hamstrings', label: 'Ischios' },
  { slug: 'glutes', label: 'Fessiers' },
  { slug: 'calves', label: 'Mollets' },
]

export interface ExerciseData {
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  weight_increment_kg: number | null
  notes: string
  image_url: string | null
  movement_pattern: string | null
  equipment_required: string[]
  primary_muscles: string[]
  secondary_muscles: string[]
  is_compound: boolean | undefined
  group_id?: string
  dbId?: string
}

interface Props {
  dragId: string
  exercise: ExerciseData
  si: number
  ei: number
  isHighlighted: boolean
  isUploading: boolean
  alerts: IntelligenceAlert[]
  templateId?: string
  supersetGroupColor?: string
  groupSize?: number
  nextInSameGroup?: boolean
  onUpdate: (patch: Partial<ExerciseData>) => void
  onRemove: () => void
  onImageUpload: (file: File) => void
  onPickExercise: () => void
  onPickExerciseForAlternative?: (addFn: (name: string) => Promise<void>) => void
  onOpenAlternatives: () => void
  onToggleSuperset?: () => void
  exerciseRef: (el: HTMLDivElement | null) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
  performanceTrend?: 'progression' | 'stagnation' | 'overtraining' | null
  performanceSuggestion?: string | null
}

const SUPERSET_COLORS = [
  '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
]

export default function ExerciseCard({
  dragId,
  exercise,
  si,
  ei,
  isHighlighted,
  isUploading,
  alerts,
  templateId,
  supersetGroupColor,
  groupSize = 2,
  nextInSameGroup = false,
  onUpdate,
  onRemove,
  onImageUpload,
  onPickExercise,
  onPickExerciseForAlternative,
  onOpenAlternatives,
  onToggleSuperset,
  exerciseRef,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  performanceTrend,
  performanceSuggestion,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const altRef = useRef<ExerciseClientAlternativesHandle>(null)
  const isInSuperset = !!exercise.group_id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId })

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={(el) => { setNodeRef(el); exerciseRef(el) }}
      style={{
        ...dragStyle,
        ...(isInSuperset && supersetGroupColor ? {
          borderColor: `${supersetGroupColor}40`,
          boxShadow: `inset 3px 0 0 ${supersetGroupColor}`,
        } : {}),
      }}
      className={[
        'rounded-xl border-[0.3px] bg-white/[0.02] transition-all duration-200',
        isHighlighted
          ? 'border-[#1f8a65]/60 ring-1 ring-[#1f8a65]/30'
          : isInSuperset
          ? 'border-transparent'
          : 'border-white/[0.06]',
      ].join(' ')}
    >
      {/* Superset / Triset / Giant Set badge */}
      {isInSuperset && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 border-b-[0.3px]"
          style={{ borderBottomColor: `${supersetGroupColor}20` }}
        >
          <Link2 size={9} style={{ color: supersetGroupColor ?? '#f59e0b' }} />
          <span className="text-[9px] font-semibold" style={{ color: supersetGroupColor ?? '#f59e0b' }}>
            {groupSize === 2 ? 'SUPERSET' : groupSize === 3 ? 'TRISET' : 'SÉRIE GÉANTE'}
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="grid grid-cols-[120px_1fr] gap-3">
          {/* Left column: image */}
          <div className="flex flex-col gap-2">
            {/* Image — primary CTA: opens catalogue if no image */}
            <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden bg-white/[0.03] border-[0.3px] border-white/[0.06] group">
              {exercise.image_url ? (
                <>
                  <Image
                    src={exercise.image_url}
                    alt={exercise.name}
                    fill
                    className="object-cover"
                    unoptimized={exercise.image_url.endsWith('.gif')}
                  />
                  {/* Hover overlay: upload */}
                  <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} className="text-white" />
                    <span className="text-[9px] text-white/70">Changer</span>
                  </div>
                </>
              ) : (
                /* No image: primary CTA = open catalogue */
                <button
                  type="button"
                  onClick={onPickExercise}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-white/[0.04] transition-colors"
                >
                  <Library size={20} className="text-[#1f8a65]/60" />
                  <span className="text-[9px] font-medium text-[#1f8a65]/60 leading-tight text-center px-2">
                    Choisir depuis le catalogue
                  </span>
                </button>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#1f8a65] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) onImageUpload(f)
                e.target.value = ''
              }}
            />
          </div>

          {/* Right column: name, sets/reps, muscles, notes */}
          <div className="flex flex-col gap-2 min-w-0">
            {/* Name row: drag handle + input + catalogue button + superset + delete */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/50 transition-colors shrink-0"
                title="Déplacer"
              >
                <GripVertical size={13} />
              </div>
              <input
                value={exercise.name}
                onChange={e => onUpdate({ name: e.target.value })}
                placeholder={`Exercice ${ei + 1}`}
                className="flex-1 min-w-0 bg-transparent text-[13px] font-medium text-white placeholder:text-white/20 outline-none"
              />
              {/* Catalogue button — always visible, primary action */}
              <button
                onClick={onPickExercise}
                title="Choisir depuis le catalogue"
                className="shrink-0 flex items-center gap-1 h-6 px-2 rounded-md bg-[#1f8a65]/10 text-[#1f8a65]/70 hover:bg-[#1f8a65]/20 hover:text-[#1f8a65] transition-colors"
              >
                <Library size={11} />
                <span className="text-[9px] font-semibold hidden sm:inline">Catalogue</span>
              </button>
              {/* Superset toggle */}
              {onToggleSuperset && (
                <button
                  onClick={onToggleSuperset}
                  title={
                    isInSuperset
                      ? nextInSameGroup
                        ? 'Retirer du groupe'
                        : 'Étendre le groupe vers l\'exercice suivant'
                      : 'Grouper avec l\'exercice suivant'
                  }
                  className={[
                    'shrink-0 p-1 rounded-md transition-colors',
                    isInSuperset
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : 'text-white/20 hover:text-white/50 hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  {isInSuperset ? <Link2 size={12} /> : <Link2Off size={12} />}
                </button>
              )}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={onMoveUp}
                  disabled={isFirst}
                  className="p-1 rounded text-white/20 hover:text-white/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Monter"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={isLast}
                  className="p-1 rounded text-white/20 hover:text-white/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Descendre"
                >
                  <ChevronDown size={11} />
                </button>
              </div>
              <button
                onClick={onRemove}
                className="shrink-0 p-1 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Performance trend badge — only when clientId context is active */}
            {performanceTrend && (
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: performanceTrend === 'progression' ? '#1f8a65'
                      : performanceTrend === 'stagnation' ? '#f59e0b'
                      : '#ef4444',
                    backgroundColor: performanceTrend === 'progression' ? 'rgba(31,138,101,0.12)'
                      : performanceTrend === 'stagnation' ? 'rgba(245,158,11,0.12)'
                      : 'rgba(239,68,68,0.12)',
                  }}
                >
                  {performanceTrend === 'progression' ? '↗ Progression'
                    : performanceTrend === 'stagnation' ? '→ Stagnation'
                    : '↘ Surmenage'}
                </span>
                {performanceSuggestion && (
                  <span className="text-[10px] text-white/35 truncate max-w-[200px]" title={performanceSuggestion}>
                    {performanceSuggestion}
                  </span>
                )}
              </div>
            )}

            {/* Sets / Reps / Rest / RIR */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Séries', value: String(exercise.sets), key: 'sets', type: 'number' },
                { label: 'Reps', value: exercise.reps, key: 'reps', type: 'text' },
                { label: 'Repos', value: exercise.rest_sec != null ? String(exercise.rest_sec) : '', key: 'rest_sec', type: 'number' },
                { label: 'RIR', value: exercise.rir != null ? String(exercise.rir) : '', key: 'rir', type: 'number' },
              ].map(f => (
                <div key={f.key} className="min-w-0">
                  <label className="block text-[9px] text-white/30 mb-0.5 truncate">{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => {
                      const v = e.target.value
                      if (f.key === 'sets') onUpdate({ sets: Number(v) || 1 })
                      else if (f.key === 'reps') onUpdate({ reps: v })
                      else if (f.key === 'rest_sec') onUpdate({ rest_sec: v ? Number(v) : null })
                      else if (f.key === 'rir') onUpdate({ rir: v ? Number(v) : null })
                    }}
                    className="w-full bg-[#0a0a0a] rounded-md border-[0.3px] border-white/[0.06] text-[11px] text-white/80 px-1.5 py-1 outline-none font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Palier de surcharge progressive */}
            <div className="flex items-start gap-2">
              <div className="min-w-0" style={{ width: '25%' }}>
                <label className="block text-[9px] text-white/30 mb-0.5 truncate">+kg / overload</label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={exercise.weight_increment_kg != null ? String(exercise.weight_increment_kg) : ''}
                  onChange={e => {
                    const v = e.target.value
                    onUpdate({ weight_increment_kg: v ? Number(v) : null })
                  }}
                  placeholder="2.5"
                  className="w-full bg-[#0a0a0a] rounded-md border-[0.3px] border-white/[0.06] text-[11px] text-white/80 px-1.5 py-1 outline-none font-mono"
                />
              </div>
              <p className="text-[9px] text-white/20 leading-relaxed mt-4 flex-1">
                Charge ajoutée quand rep_max atteint sur tous les sets
              </p>
            </div>

            {/* Notes */}
            <textarea
              value={exercise.notes}
              onChange={e => onUpdate({ notes: e.target.value })}
              placeholder="Notes coach..."
              rows={2}
              className="w-full bg-[#0a0a0a] rounded-lg border-[0.3px] border-white/[0.06] text-[11px] text-white/60 placeholder:text-white/20 px-2 py-1.5 outline-none resize-none"
            />

            {/* Intelligence alerts */}
            {alerts.length > 0 && (
              <IntelligenceAlertBadge
                alerts={alerts}
                onOpenAlternatives={onOpenAlternatives}
              />
            )}

            {/* Client alternatives (edit mode) */}
            {templateId && exercise.dbId && (
              <ExerciseClientAlternatives
                ref={altRef}
                templateId={templateId}
                exerciseId={exercise.dbId}
                onRequestAddFromCatalog={() => {
                  onPickExerciseForAlternative?.(
                    (name) => altRef.current?.addAlternative(name) ?? Promise.resolve()
                  )
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
