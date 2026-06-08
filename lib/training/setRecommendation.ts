import { calculateOneRM } from '@/lib/formulas/oneRM'
import { getTrainingZone } from './trainingZones'

// Future hook for Approach C (ML regression) — unused in Phase 1
export interface HistoricalSession {
  date: string
  sets: Array<{ set_number: number; weight_kg: number; reps: number; rir_actual: number }>
}

export interface SetRecommendationInput {
  actual_weight_kg: number
  actual_reps: number
  rir_actual: number
  goal: string
  level: string
  planned_reps: number
  set_number: number
  rep_min?: number
  rep_max?: number
  target_rir?: number
  weight_increment_kg?: number
  lastWeek?: {
    weight_kg: number
    reps: number
    rir_actual: number
  }
  // Weight used in the previous set this session — recommendation never goes below this
  prev_set_weight_kg?: number
  // Intentionally unused Phase 1 — branch added in Approach C
  historicalSessions?: HistoricalSession[]
}

export interface SetRecommendation {
  weight_kg: number
  reps: number
  confidence: 'high' | 'low'
  delta_vs_last: number | null
  // Phase hint for UI — informs client of current progression phase
  phase: 'double_progression_reps' | 'double_progression_overload' | 'intra_session' | 'prescription'
}

// Arrondi au palier configuré (weight_increment_kg) — évite des valeurs impossibles sur machine/barre
function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0) return Math.round(value * 2) / 2
  return Math.round(value / increment) * increment
}

function estimateOneRM(weight_kg: number, reps: number, rir_actual: number): number {
  const repsToFailure = reps + rir_actual
  const clampedRTF = Math.max(1, repsToFailure)
  const result = calculateOneRM({ weight: weight_kg, reps: clampedRTF }, 'average')
  return result.oneRM
}

export function recommendNextSet(input: SetRecommendationInput): SetRecommendation | null {
  const {
    actual_weight_kg, actual_reps, rir_actual,
    goal, planned_reps,
    rep_min, rep_max, target_rir,
    weight_increment_kg = 2.5,
    lastWeek, prev_set_weight_kg,
  } = input

  if (actual_weight_kg <= 0 || actual_reps <= 0) return null
  if (actual_reps + rir_actual < 1) return null

  const increment = weight_increment_kg > 0 ? weight_increment_kg : 2.5

  // ── Path A : double progression (historique disponible + plage reps configurée) ──
  if (lastWeek && lastWeek.weight_kg > 0 && lastWeek.reps > 0 && rep_min !== undefined && rep_max !== undefined) {
    const effectiveTargetRir = target_rir ?? 2

    // Phase 2 — overload : S-1 avait atteint rep_max avec effort suffisant
    const lastAtRepMax = lastWeek.reps >= rep_max
    const lastRirCompliant = lastWeek.rir_actual <= effectiveTargetRir + 1

    if (lastAtRepMax && lastRirCompliant) {
      let targetWeight = roundToIncrement(lastWeek.weight_kg + increment, increment)
      if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
        targetWeight = Math.max(targetWeight, prev_set_weight_kg)
      }
      const delta = roundToIncrement(targetWeight - lastWeek.weight_kg, increment)
      return {
        weight_kg: targetWeight,
        reps: rep_min,
        confidence: 'high',
        delta_vs_last: delta,
        phase: 'double_progression_overload',
      }
    }

    // Phase 1 — reps ↑ : garder charge, pousser vers rep_max
    let targetWeight = roundToIncrement(lastWeek.weight_kg, increment)
    if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
      targetWeight = Math.max(targetWeight, prev_set_weight_kg)
    }
    const targetReps = Math.min(lastWeek.reps + 1, rep_max)
    const delta = roundToIncrement(targetWeight - lastWeek.weight_kg, increment)
    return {
      weight_kg: targetWeight,
      reps: targetReps,
      confidence: 'high',
      delta_vs_last: delta !== 0 ? delta : null,
      phase: 'double_progression_reps',
    }
  }

  // ── Path B : intra-séance uniquement (pas d'historique S-1) ──
  // Utilise le 1RM du set courant pour estimer la charge optimale
  const zone = getTrainingZone(goal)
  const liveOneRM = estimateOneRM(actual_weight_kg, actual_reps, rir_actual)
  const confidence: 'high' | 'low' = actual_reps > 8 ? 'low' : 'high'

  const rawWeight = liveOneRM * zone.targetPct
  let targetWeight = roundToIncrement(rawWeight, increment)

  // Jamais en dessous de la prescription coach ni du set précédent
  if (actual_weight_kg > 0) targetWeight = Math.max(targetWeight, actual_weight_kg)
  if (prev_set_weight_kg !== undefined && prev_set_weight_kg > 0) {
    targetWeight = Math.max(targetWeight, prev_set_weight_kg)
  }

  const targetReps = rep_min !== undefined
    ? rep_min
    : planned_reps > 0
      ? planned_reps
      : Math.round(((zone.repRangeMin + zone.repRangeMax) / 2))

  return {
    weight_kg: targetWeight,
    reps: targetReps,
    confidence,
    delta_vs_last: null,
    phase: 'intra_session',
  }
}
