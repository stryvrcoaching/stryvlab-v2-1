'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Loader2, AlertCircle, RefreshCw, TrendingUp,
  Clock, ChevronUp, X, MessageSquare, Flag, ArrowLeftRight
} from 'lucide-react'
import { useClientT } from '@/components/client/ClientI18nProvider'
import ExerciseSwapSheet from './ExerciseSwapSheet'
import ClientAlternativesSheet from '@/components/client/ClientAlternativesSheet'
import { recommendNextSet, type SetRecommendation } from '@/lib/training/setRecommendation'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_sec: number | null
  rir: number | null
  notes: string | null
  image_url: string | null
  is_unilateral: boolean
  target_rir: number | null
  current_weight_kg: number | null
  rep_min: number | null
  rep_max: number | null
  progressive_overload_enabled: boolean
  weight_increment_kg?: number | null
  primary_muscles?: string[]
  secondary_muscles?: string[]
  group_id?: string | null
  clientAlternatives?: string[]
}

interface SetLog {
  exercise_id: string
  exercise_name: string
  set_number: number
  side: 'left' | 'right' | 'bilateral'
  planned_reps: string
  actual_reps: string
  actual_weight_kg: string
  completed: boolean
  rir_actual: string
  notes: string
  rest_sec_actual: number | null
  primary_muscles: string[]
  secondary_muscles: string[]
}

interface LastPerf {
  weight: number | null
  reps: number | null
  rir?: number | null
  side?: string | null
  set_number?: number | null
}

interface Props {
  clientId: string
  sessionId: string
  session: { id: string; name: string }
  exercises: Exercise[]
  lastPerformance: Record<string, LastPerf[]>
  goal: string
  level: string
}

type SaveState = 'idle' | 'saving' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialSets(exercises: Exercise[]): SetLog[] {
  const sets: SetLog[] = []
  for (const ex of exercises) {
    for (let i = 0; i < ex.sets; i++) {
      if (ex.is_unilateral) {
        for (const side of ['left', 'right'] as const) {
          sets.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            set_number: i + 1,
            side,
            planned_reps: ex.reps,
            actual_reps: '',
            actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
            completed: false,
            rir_actual: '',
            notes: '',
            rest_sec_actual: null,
            primary_muscles: ex.primary_muscles ?? [],
            secondary_muscles: ex.secondary_muscles ?? [],
          })
        }
      } else {
        sets.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          set_number: i + 1,
          side: 'bilateral',
          planned_reps: ex.reps,
          actual_reps: '',
          actual_weight_kg: ex.current_weight_kg !== null ? String(ex.current_weight_kg) : '',
          completed: false,
          rir_actual: '',
          notes: '',
          rest_sec_actual: null,
          primary_muscles: ex.primary_muscles ?? [],
          secondary_muscles: ex.secondary_muscles ?? [],
        })
      }
    }
  }
  return sets
}

function formatTime(sec: number) {
  const abs = Math.abs(sec)
  const m = Math.floor(abs / 60).toString().padStart(2, '0')
  const s = (abs % 60).toString().padStart(2, '0')
  return sec < 0 ? `-${m}:${s}` : `${m}:${s}`
}

function sideLabel(side: 'left' | 'right' | 'bilateral') {
  if (side === 'left') return 'G'
  if (side === 'right') return 'D'
  return null
}

function sideColor(side: 'left' | 'right' | 'bilateral') {
  if (side === 'left') return 'text-blue-400'
  if (side === 'right') return 'text-violet-400'
  return ''
}

function recKey(exerciseId: string, setNumber: number, side: string): string {
  return `${exerciseId}_set${setNumber}_${side}`
}

function DeltaBadge({ rec }: { rec: SetRecommendation }) {
  if (rec.delta_vs_last === null) return null
  const isLowConfidence = rec.confidence === 'low'
  const delta = rec.delta_vs_last
  const colorClass = isLowConfidence
    ? 'text-white/40'
    : delta > 0
      ? 'text-[#1f8a65]'
      : delta < 0
        ? 'text-amber-400'
        : 'text-white/40'
  const label = delta > 0 ? `↑ +${delta}kg` : delta < 0 ? `↓ ${delta}kg` : `= S-1`
  return <span className={`text-[10px] font-semibold ${colorClass}`}>{label}</span>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SessionLogger({ clientId, sessionId, session, exercises, lastPerformance, goal, level }: Props) {
  const router = useRouter()
  const { t } = useClientT()
  const [sets, setSets] = useState<SetLog[]>(() => buildInitialSets(exercises))
  // Navigation par "groupe" (superset ou exercice solo)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null)
  const [hiddenImages, setHiddenImages] = useState<Set<string>>(new Set())
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [swappedNames, setSwappedNames] = useState<Record<string, string>>({})
  const [altSheetTarget, setAltSheetTarget] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState<Record<string, SetRecommendation>>({})
  const [manuallyEdited, setManuallyEdited] = useState<Set<string>>(new Set())

  // ── Live save ──
  const sessionLogIdRef = useRef<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const DRAFT_KEY = `draft_session_log_id_${sessionId}`

  // ── Chrono repos ──
  // restElapsed : secondes écoulées depuis le début du chrono (peut dépasser restPrescribed → overtime)
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
  const [restPrescribed, setRestPrescribed] = useState<number | null>(null)
  const [restElapsed, setRestElapsed] = useState(0)
  const [restModalOpen, setRestModalOpen] = useState(false)
  // Set qui a déclenché le repos (pour enregistrer rest_sec_actual à la prochaine interaction)
  const [pendingRestSet, setPendingRestSet] = useState<{ exId: string; setNum: number; side: string } | null>(null)
  // Délai d'inactivité avant ouverture du modal
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track si un input est focused pour ne pas ouvrir le modal pendant la saisie
  const activeInputRef = useRef(false)

  // ── Bouton Terminer — appui long ──
  const [longPressProgress, setLongPressProgress] = useState(0) // 0→1
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longPressStartRef = useRef<number | null>(null)
  const LONG_PRESS_DURATION = 3000

  // Convertit les strings en nombres — || null bug: "0" → 0 → falsy → null. Utiliser ?? null après parse.
  function parseSetForApi(s: SetLog) {
    const reps = s.actual_reps !== '' ? parseInt(s.actual_reps, 10) : null
    const weight = s.actual_weight_kg !== '' ? parseFloat(s.actual_weight_kg) : null
    const rir = s.rir_actual !== '' ? parseInt(s.rir_actual, 10) : null
    return {
      ...s,
      actual_reps: reps !== null && !isNaN(reps) ? reps : null,
      actual_weight_kg: weight !== null && !isNaN(weight) ? weight : null,
      rir_actual: rir !== null && !isNaN(rir) ? rir : null,
      planned_reps: s.planned_reps || null,
    }
  }

  // Envoie un upsert des sets actuels vers la DB
  async function patchSets(currentSets: SetLog[]) {
    const logId = sessionLogIdRef.current
    if (!logId) return
    try {
      const payload = currentSets.map(parseSetForApi)
      const res = await fetch(`/api/session-logs/${logId}/sets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_logs: payload }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[patchSets] failed', res.status, body)
        // Si 42P10 (contrainte UNIQUE absente), loguer clairement
        if (body?.code === '42P10') {
          console.error('[patchSets] UNIQUE constraint missing on client_set_logs — apply migration in Supabase Dashboard')
        }
      }
    } catch {
      // Erreur réseau silencieuse — les données sont en state React
    }
  }

  const triggerRecommendation = useCallback((completedSet: SetLog) => {
    const { exercise_id, exercise_name, set_number, side, actual_reps, actual_weight_kg, rir_actual } = completedSet

    if (!actual_reps || !actual_weight_kg || rir_actual === '') return
    const reps = parseInt(actual_reps, 10)
    const weight = parseFloat(actual_weight_kg)
    const rir = parseInt(rir_actual, 10)
    if (isNaN(reps) || isNaN(weight) || isNaN(rir)) return

    const exerciseSets = sets.filter(s => s.exercise_id === exercise_id && s.side === side)
    const currentIdx = exerciseSets.findIndex(s => s.set_number === set_number)
    if (currentIdx === -1 || currentIdx >= exerciseSets.length - 1) return
    const nextSet = exerciseSets[currentIdx + 1]

    const nextKey = recKey(exercise_id, nextSet.set_number, side)
    if (manuallyEdited.has(nextKey)) return

    const ex = exercises.find(e => e.id === exercise_id)

    // Match historique par set_number exact — évite d'utiliser set 3 comme référence pour set 1
    const history = lastPerformance[exercise_name] ?? []
    const historyEntry = history.find(h =>
      (side === 'bilateral' ? true : h.side === side) &&
      (h as any).set_number === nextSet.set_number
    ) ?? history.find(h => side === 'bilateral' ? true : h.side === side)

    const lastWeek = historyEntry && historyEntry.weight != null && historyEntry.reps != null
      ? { weight_kg: historyEntry.weight, reps: historyEntry.reps, rir_actual: historyEntry.rir ?? 2 }
      : undefined

    const plannedReps = parseInt(nextSet.planned_reps, 10) || 0
    const prevSetWeight = parseFloat(completedSet.actual_weight_kg) || undefined

    const rec = recommendNextSet({
      actual_weight_kg: weight,
      actual_reps: reps,
      rir_actual: rir,
      goal,
      level,
      planned_reps: plannedReps,
      set_number: nextSet.set_number,
      rep_min: ex?.rep_min ?? undefined,
      rep_max: ex?.rep_max ?? undefined,
      target_rir: ex?.target_rir ?? ex?.rir ?? undefined,
      weight_increment_kg: ex?.weight_increment_kg ?? 2.5,
      lastWeek,
      prev_set_weight_kg: prevSetWeight,
    })

    if (!rec) return

    setRecommendations(prev => ({ ...prev, [nextKey]: rec }))
    setSets(prev => prev.map(s => {
      if (s.exercise_id === exercise_id && s.set_number === nextSet.set_number && s.side === side) {
        return { ...s, actual_weight_kg: String(rec.weight_kg), actual_reps: String(rec.reps) }
      }
      return s
    }))
  }, [sets, lastPerformance, goal, level, manuallyEdited])

  // ── Groupes d'exercices (supersets regroupés) ──
  // Un "groupe" = soit un exercice solo, soit une liste d'exercices avec le même group_id
  const exerciseGroups: Exercise[][] = []
  const seenGroupIds = new Set<string>()
  for (const ex of exercises) {
    if (ex.group_id) {
      if (!seenGroupIds.has(ex.group_id)) {
        seenGroupIds.add(ex.group_id)
        exerciseGroups.push(exercises.filter(e => e.group_id === ex.group_id))
      }
    } else {
      exerciseGroups.push([ex])
    }
  }
  const currentGroup = exerciseGroups[currentGroupIndex] ?? []
  const currentEx = currentGroup[0] // pour compatibilité — exercice principal du groupe
  const isFirst = currentGroupIndex === 0
  const isLast = currentGroupIndex === exerciseGroups.length - 1
  // currentExIndex virtuel pour rétro-compat (index du premier ex du groupe dans exercises[])
  const currentExIndex = currentEx ? exercises.indexOf(currentEx) : 0

  const completedCount = sets.filter(s => s.completed).length
  const totalSets = sets.length
  const progress = totalSets > 0 ? completedCount / totalSets : 0
  const allDone = completedCount === totalSets && totalSets > 0

  // ── Chrono global ──
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(iv)
  }, [startTime])

  // ── Création ou récupération du draft session log au montage ──
  useEffect(() => {
    let cancelled = false

    async function initDraft() {
      const existingId = localStorage.getItem(DRAFT_KEY)

      if (existingId) {
        // Vérifier que ce log existe encore en DB et n'est pas terminé
        try {
          // Ping de validation : set_logs=[] déclenche un early return dans la route (sans mutation)
          const res = await fetch(`/api/session-logs/${existingId}/sets`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ set_logs: [] }),
          })
          if (res.ok && !cancelled) {
            sessionLogIdRef.current = existingId
            setDraftReady(true)
            return
          }
        } catch {
          // Log invalide ou réseau coupé — on en crée un nouveau
        }
        if (!cancelled) localStorage.removeItem(DRAFT_KEY)
      }

      // Créer un nouveau session log
      try {
        const res = await fetch('/api/session-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_session_id: session.id,
            session_name: session.name,
            set_logs: [],
          }),
        })
        if (res.ok && !cancelled) {
          const data = await res.json()
          const newId = data?.session_log?.id
          if (newId) {
            sessionLogIdRef.current = newId
            localStorage.setItem(DRAFT_KEY, newId)
          }
        }
      } catch {
        // Pas de réseau au démarrage — on fonctionnera sans live save
      }
      if (!cancelled) setDraftReady(true)
    }

    initDraft()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup debounce au démontage ──
  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    }
  }, [])

  // ── Chrono repos — tick ──
  useEffect(() => {
    if (restStartedAt === null) {
      clearInterval(restIntervalRef.current!)
      setRestElapsed(0)
      return
    }
    restIntervalRef.current = setInterval(() => {
      setRestElapsed(Math.floor((Date.now() - restStartedAt) / 1000))
    }, 1000)
    return () => clearInterval(restIntervalRef.current!)
  }, [restStartedAt])

  // ── Ouvrir le modal après 8s d'inactivité, seulement si aucun input n'est actif ──
  function scheduleModalOpen() {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => {
      if (!activeInputRef.current) {
        setRestModalOpen(true)
      } else {
        // Un input est encore actif — replanifier dans 5s
        scheduleModalOpen()
      }
    }, 8000)
  }

  function startRest(exId: string, setNum: number, side: string, prescribed: number | null) {
    // Enregistrer le rest_sec_actual du set précédent si applicable
    if (pendingRestSet && restStartedAt !== null) {
      const actual = Math.floor((Date.now() - restStartedAt) / 1000)
      setSets(prev => prev.map(s =>
        s.exercise_id === pendingRestSet.exId &&
        s.set_number === pendingRestSet.setNum &&
        s.side === pendingRestSet.side
          ? { ...s, rest_sec_actual: actual }
          : s
      ))
    }
    setRestStartedAt(Date.now())
    setRestPrescribed(prescribed)
    setRestElapsed(0)
    setPendingRestSet({ exId, setNum, side })
    scheduleModalOpen()
  }

  function stopRest() {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    setRestStartedAt(null)
    setRestPrescribed(null)
    setRestElapsed(0)
    setRestModalOpen(false)
    setPendingRestSet(null)
  }

  // Appelé quand l'utilisateur interagit avec un champ d'un set — enregistre le repos du set précédent
  function onSetInteraction(exId: string, setNum: number, side: string) {
    if (pendingRestSet && restStartedAt !== null) {
      const isSameSet = pendingRestSet.exId === exId && pendingRestSet.setNum === setNum && pendingRestSet.side === side
      if (!isSameSet) {
        // Nouvelle interaction sur un set différent → stopper le chrono et enregistrer
        const actual = Math.floor((Date.now() - restStartedAt) / 1000)
        setSets(prev => prev.map(s =>
          s.exercise_id === pendingRestSet.exId &&
          s.set_number === pendingRestSet.setNum &&
          s.side === pendingRestSet.side
            ? { ...s, rest_sec_actual: actual }
            : s
        ))
        stopRest()
      }
    }
  }

  function updateSet(exId: string, setNum: number, side: string, patch: Partial<SetLog>) {
    onSetInteraction(exId, setNum, side)
    setSets(prev => {
      const next = prev.map(s =>
        s.exercise_id === exId && s.set_number === setNum && s.side === side
          ? { ...s, ...patch }
          : s
      )
      const updated = next.find(s => s.exercise_id === exId && s.set_number === setNum && s.side === side)
      if (updated && !updated.completed && (updated.actual_reps || updated.actual_weight_kg)) {
        const ex = exercises.find(e => e.id === exId)
        const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
        if (!alreadyTracking) {
          startRest(exId, setNum, side, ex?.rest_sec ?? null)
        } else {
          scheduleModalOpen()
        }
      }
      // Debounce 800ms sur la saisie clavier
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      const exSetsUpdated = next.filter(s => s.exercise_id === exId)
      saveDebounceRef.current = setTimeout(() => {
        patchSets(exSetsUpdated)
      }, 800)
      return next
    })
  }

  function toggleSet(exId: string, setNum: number, side: string, restSec: number | null) {
    setSets(prev => {
      const current = prev.find(s => s.exercise_id === exId && s.set_number === setNum && s.side === side)
      const wasCompleted = current?.completed ?? false

      const next = prev.map(s => {
        if (s.exercise_id !== exId || s.set_number !== setNum || s.side !== side) return s
        const nowCompleted = !s.completed
        if (nowCompleted) {
          const alreadyTracking = pendingRestSet?.exId === exId && pendingRestSet?.setNum === setNum && pendingRestSet?.side === side
          if (!alreadyTracking) {
            startRest(exId, setNum, side, restSec)
          }
        }
        return { ...s, completed: nowCompleted }
      })
      // Patch immédiat sur la coche — intentionnel, pas de debounce
      const exSetsUpdated = next.filter(s => s.exercise_id === exId)
      patchSets(exSetsUpdated)

      // Trigger recommendation when completing (not uncompleting)
      if (!wasCompleted && current) {
        triggerRecommendation(current)
      }

      return next
    })
  }

  // Sets du groupe courant (tous les exercices du superset)
  const groupSets = currentGroup.flatMap(ex => sets.filter(s => s.exercise_id === ex.id))
  const exSets = currentEx ? sets.filter(s => s.exercise_id === currentEx.id) : []
  const allCurrentDone = groupSets.length > 0 && groupSets.every(s => s.completed)
  // Vrai si tous les sets du groupe sont complétés (pour déclencher le repos de fin de superset)
  const allGroupDone = groupSets.length > 0 && groupSets.every(s => s.completed)

  const lastPerf = currentEx ? (lastPerformance[currentEx.name] ?? []) : []
  function getLastPerfLabel(setNum: number, side: 'left' | 'right' | 'bilateral') {
    if (lastPerf.length === 0) return null
    const match = lastPerf.find(p => side !== 'bilateral' ? p.side === side : true)
    return match ?? lastPerf[0]
  }

  function getProgressionHint(ex: Exercise): string | null {
    if (!ex.progressive_overload_enabled) return null
    if (ex.rep_min === null || ex.rep_max === null) return null
    const effectiveRir = ex.target_rir ?? ex.rir
    if (effectiveRir === null) return null
    return `Atteins ${ex.rep_max} reps à RIR ${effectiveRir} sur toutes tes séries pour augmenter la charge.`
  }

  // ── Supersets — couleur + lettre par group_id ──
  const SUPERSET_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  const supersetColors: Record<string, string> = {}
  const supersetLetters: Record<string, string> = {} // group_id → 'A', 'B', 'C'...
  let colorIdx = 0
  for (const ex of exercises) {
    if (ex.group_id && !supersetColors[ex.group_id]) {
      supersetColors[ex.group_id] = SUPERSET_COLORS[colorIdx % SUPERSET_COLORS.length]
      supersetLetters[ex.group_id] = String.fromCharCode(65 + colorIdx) // A, B, C...
      colorIdx++
    }
  }
  const isSuperset = currentGroup.length > 1
  const supersetLetter = isSuperset && currentGroup[0].group_id ? supersetLetters[currentGroup[0].group_id] ?? 'A' : ''

  // ── Chrono repos — valeurs dérivées ──
  const restRemaining = restPrescribed !== null ? restPrescribed - restElapsed : null // peut être négatif
  const isOvertime = restRemaining !== null && restRemaining < 0
  const overtimeLabel = isOvertime ? formatTime(restRemaining!) : null

  // ── Long press Terminer ──
  function onFinishPressStart() {
    if (allDone) {
      // Dernier exercice complété → simple clic
      submitSession()
      return
    }
    longPressStartRef.current = Date.now()
    longPressRef.current = setInterval(() => {
      const elapsed = Date.now() - (longPressStartRef.current ?? Date.now())
      const p = Math.min(elapsed / LONG_PRESS_DURATION, 1)
      setLongPressProgress(p)
      if (p >= 1) {
        clearInterval(longPressRef.current!)
        setLongPressProgress(0)
        setShowFinishConfirm(true)
      }
    }, 16)
  }

  function onFinishPressEnd() {
    if (longPressRef.current) clearInterval(longPressRef.current)
    setLongPressProgress(0)
  }

  async function submitSession() {
    setSaveState('saving')
    setErrorMsg(null)
    const durationMin = Math.round(elapsed / 60)
    const logId = sessionLogIdRef.current
    const allSetsPayload = sets.map(parseSetForApi)

    if (logId) {
      // Flush final — tous les sets d'un coup, vérifié obligatoirement
      try {
        const flushRes = await fetch(`/api/session-logs/${logId}/sets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ set_logs: allSetsPayload }),
        })
        if (!flushRes.ok) {
          // Le live save a échoué — on retente via DELETE+POST atomique
          const retryRes = await fetch('/api/session-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              program_session_id: session.id,
              session_name: session.name,
              exercise_notes: exerciseNotes,
              set_logs: allSetsPayload,
            }),
          })
          if (!retryRes.ok) {
            const body = await retryRes.json().catch(() => ({}))
            setSaveState('error')
            setErrorMsg(body?.error ?? `Erreur sauvegarde (${retryRes.status})`)
            return
          }
          const retryData = await retryRes.json()
          const retryLogId = retryData?.session_log?.id
          if (retryLogId) {
            await fetch(`/api/session-logs/${retryLogId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true, duration_min: durationMin }),
            })
            setSaveState('idle')
            localStorage.removeItem(DRAFT_KEY)
            router.refresh()
            router.push(`/client/programme/recap/${retryLogId}`)
            return
          }
        }
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau — vérifie ta connexion')
        return
      }

      // Marquer la séance comme terminée
      try {
        const completeRes = await fetch(`/api/session-logs/${logId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin, notes: JSON.stringify(exerciseNotes) }),
        })
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}))
          setSaveState('error')
          setErrorMsg(body?.error ?? `Erreur finalisation (${completeRes.status})`)
          return
        }
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau — vérifie ta connexion')
        return
      }

      setSaveState('idle')
      localStorage.removeItem(DRAFT_KEY)
      router.refresh()
      router.push(`/client/programme/recap/${logId}`)
    } else {
      // Pas de logId (réseau coupé au démarrage) — POST atomique complet
      try {
        const res = await fetch('/api/session-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_session_id: session.id,
            session_name: session.name,
            exercise_notes: exerciseNotes,
            set_logs: allSetsPayload,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `Erreur serveur (${res.status})`)
        }
        const data = await res.json()
        const newLogId = data?.session_log?.id
        if (!newLogId) throw new Error('Identifiant de séance manquant')
        await fetch(`/api/session-logs/${newLogId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true, duration_min: durationMin }),
        })
        setSaveState('idle')
        localStorage.removeItem(DRAFT_KEY)
        router.refresh()
        router.push(`/client/programme/recap/${newLogId}`)
      } catch (err) {
        setSaveState('error')
        setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau — vérifie ta connexion')
      }
    }
  }

  function handleSwap(exerciseId: string, newName: string) {
    setSwappedNames(prev => ({ ...prev, [exerciseId]: newName }))
    setSwapTarget(null)
  }

  if (currentGroup.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-white/40 text-sm">Aucun exercice dans cette séance.</p>
      </div>
    )
  }

  const remainingSets = totalSets - completedCount

  return (
    <div className="min-h-screen bg-[#121212] font-sans pb-24">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#121212] px-5 py-4">
        <div className="relative z-10 max-w-lg mx-auto flex items-center justify-between">
          <div className="h-9 w-9" />
          <div className="text-center">
            <p className="text-[13px] font-bold text-white">{session.name}</p>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">{formatTime(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1f8a65]">{completedCount}/{totalSets}</span>
            {/* Mini-badge repos — temps restant positif */}
            {restStartedAt !== null && !isOvertime && restRemaining !== null && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-lg">
                <Clock size={10} />
                {formatTime(restRemaining)}
              </span>
            )}
            {/* Mini-badge overtime */}
            {isOvertime && restStartedAt !== null && (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg animate-pulse">
                {overtimeLabel}
              </span>
            )}
          </div>
        </div>
        {/* Barre de progression */}
        <div className="relative z-10 max-w-lg mx-auto mt-3 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1f8a65] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      {/* ── Bannière erreur ── */}
      {saveState === 'error' && errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-3">
          <div className="max-w-lg mx-auto flex items-start gap-3">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-red-400">Sauvegarde échouée</p>
              <p className="text-[11px] text-red-400/70 mt-0.5 break-all">{errorMsg}</p>
            </div>
            <button
              onClick={submitSession}
              className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
            >
              <RefreshCw size={11} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── Modal repos ── */}
      {restModalOpen && restStartedAt !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-2xl p-8 w-full max-w-xs text-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                {isOvertime ? 'Temps dépassé' : 'Temps de repos'}
              </p>
              <button
                onClick={() => setRestModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:bg-white/[0.07] hover:text-white/60 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Jauge circulaire */}
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                {/* Progress */}
                {restPrescribed !== null && (
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={isOvertime ? (restElapsed > (restPrescribed + 30) ? '#ef4444' : '#f97316') : '#1f8a65'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(restElapsed / restPrescribed, 1))}`}
                    className="transition-all duration-1000"
                  />
                )}
              </svg>
              <div className="absolute text-center">
                <p className={`text-[2.4rem] font-black font-mono leading-none tracking-tight ${isOvertime ? 'text-red-400' : 'text-white'}`}>
                  {restPrescribed !== null
                    ? formatTime(restPrescribed - restElapsed)
                    : formatTime(restElapsed)
                  }
                </p>
                {isOvertime && (
                  <p className="text-[10px] font-bold text-red-400/70 mt-1 uppercase tracking-wider">Overtime</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setRestModalOpen(false)}
              className="w-full py-3 rounded-xl bg-white/[0.04] text-[13px] font-bold text-white/60 hover:bg-white/[0.07] hover:text-white/90 transition-colors"
            >
              {t('logger.rest.skip')}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal confirmation Terminer ── */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-2">{t('logger.finish.confirm')}</h3>
            <p className="text-[13px] text-white/55 mb-5">
              Il te reste encore <span className="text-white font-semibold">{remainingSets} série{remainingSets > 1 ? 's' : ''}</span> {t('logger.finish.incomplete')}. Tu es sûr de vouloir terminer ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[13px] text-white/55 hover:text-white/80 transition-colors font-medium"
              >
                {t('logger.finish.cancel')}
              </button>
              <button
                onClick={() => { setShowFinishConfirm(false); submitSession() }}
                disabled={saveState === 'saving'}
                className="flex-1 py-2.5 rounded-xl bg-[#1f8a65] text-white text-[13px] font-bold hover:bg-[#217356] disabled:opacity-50 transition-colors"
              >
                {saveState === 'saving' ? '…' : t('logger.finish.action')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-5 py-5 flex flex-col gap-4">

        {/* ── Navigation groupes ── */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentGroupIndex(i => Math.max(0, i - 1))}
            disabled={isFirst}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex gap-1.5 items-center flex-1 justify-center">
            {exerciseGroups.map((grp, i) => {
              const grpDone = grp.every(ex => sets.filter(s => s.exercise_id === ex.id).every(s => s.completed))
              const grpColor = grp[0].group_id ? supersetColors[grp[0].group_id] : undefined
              return (
                <button
                  key={i}
                  onClick={() => setCurrentGroupIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === currentGroupIndex
                      ? 'w-6'
                      : grpDone
                      ? 'w-1.5 opacity-50'
                      : 'w-1.5 bg-white/[0.12]'
                  }`}
                  style={i === currentGroupIndex
                    ? { backgroundColor: grpColor ?? '#1f8a65' }
                    : grpDone
                    ? { backgroundColor: grpColor ?? '#1f8a65' }
                    : undefined
                  }
                />
              )
            })}
          </div>
          <button
            onClick={() => setCurrentGroupIndex(i => Math.min(exerciseGroups.length - 1, i + 1))}
            disabled={isLast}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── Superset — bande couleur (pas de label texte) ── */}
        {isSuperset && currentGroup[0].group_id && (
          <div className="h-0.5 rounded-full mx-1" style={{ backgroundColor: `${supersetColors[currentGroup[0].group_id]}60` }} />
        )}

        {/* ── Exercices headers (solos) ou round-based (supersets) ── */}
        {!isSuperset ? (
          // ── Solo : affichage classique par exercice ──
          currentGroup.map((ex) => {
            const exSetsForEx = sets.filter(s => s.exercise_id === ex.id)
            const allExDone = exSetsForEx.length > 0 && exSetsForEx.every(s => s.completed)
            const exLastPerf = lastPerformance[ex.name] ?? []
            const exEffectiveRir = ex.target_rir ?? ex.rir
            const exProgressionHint = getProgressionHint(ex)

            function getExLastPerfLabel(setNum: number, side: 'left' | 'right' | 'bilateral') {
              if (exLastPerf.length === 0) return null
              const match = exLastPerf.find(p => side !== 'bilateral' ? p.side === side : true)
              return match ?? exLastPerf[0]
            }

            return (
              <div key={ex.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {ex.image_url && (
                  <div className="relative">
                    {!hiddenImages.has(ex.id) ? (
                      <div className="relative w-full aspect-square bg-black/20 overflow-hidden">
                        <Image src={ex.image_url} alt={ex.name} fill className="object-cover" unoptimized={ex.image_url.endsWith('.gif')} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 to-transparent" />
                        <button onClick={() => setHiddenImages(prev => new Set(prev).add(ex.id))} className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium text-white/60 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-black/60 transition-colors">
                          <ChevronUp size={11} />{t('logger.demo.hide')}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setHiddenImages(prev => { const n = new Set(prev); n.delete(ex.id); return n })} className="w-full h-14 bg-black/20 flex items-center justify-center gap-2 text-[10px] font-medium text-white/35 hover:text-white/55 hover:bg-black/30 transition-colors">
                        <span>{t('logger.demo.show')}</span>
                      </button>
                    )}
                  </div>
                )}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[15px] font-bold text-white leading-tight">{swappedNames[ex.id] ?? ex.name}</h2>
                        <button onClick={() => setSwapTarget(ex.id)} className="flex items-center gap-1 h-7 px-2 rounded-lg bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors"><ArrowLeftRight size={13} /></button>
                        {ex.clientAlternatives && ex.clientAlternatives.length > 0 && !swappedNames[ex.id] && (
                          <button type="button" onClick={() => setAltSheetTarget(exercises.indexOf(ex))} className="text-[10px] font-semibold text-white/30 hover:text-amber-400 transition-colors">Indisponible ?</button>
                        )}
                        {ex.progressive_overload_enabled && ex.rep_min !== null && <TrendingUp size={12} className="text-[#1f8a65] shrink-0" />}
                        {ex.is_unilateral && <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Unilatéral</span>}
                        {allExDone && <CheckCircle2 size={14} className="text-[#1f8a65] shrink-0" />}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <span className="text-[11px] font-mono font-bold text-[#1f8a65]">{ex.sets} × {ex.reps}</span>
                        {ex.rest_sec ? <span className="flex items-center gap-1 text-[11px] text-white/40"><Clock size={10} />{ex.rest_sec}s repos</span> : null}
                        {exEffectiveRir !== null && exEffectiveRir !== undefined && <span className="text-[11px] text-white/40">{t('logger.rir.target')} : <span className="text-white/70 font-semibold">{exEffectiveRir}</span></span>}
                        {ex.current_weight_kg !== null && <span className="text-[11px] text-white/40">Suggéré : <span className="text-white/70 font-semibold">{ex.current_weight_kg}kg</span></span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/25 shrink-0 mt-1">{exercises.indexOf(ex) + 1}/{exercises.length}</span>
                  </div>
                  {exProgressionHint && <div className="mt-3 px-3 py-2 bg-[#1f8a65]/[0.08] border border-[#1f8a65]/20 rounded-xl"><p className="text-[10px] text-[#1f8a65] font-medium leading-relaxed">{exProgressionHint}</p></div>}
                  {ex.notes && <p className="mt-2 text-[11px] text-white/35 italic leading-relaxed">{ex.notes}</p>}
                </div>
                <div className="border-t border-white/[0.05]">
                  <div className="grid items-center px-5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/25" style={{ gridTemplateColumns: ex.is_unilateral ? '1fr 1fr 1.8fr 1.8fr 1.5fr 1fr' : '0.6fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' }}>
                    <div>#</div>{ex.is_unilateral && <div>{t('logger.set')}</div>}<div>{t('logger.target.label')}</div><div>{t('logger.actual.label')}</div><div>Kg</div><div>{t('logger.rir.label')}</div><div className="text-center">✓</div>
                  </div>
                  {exSetsForEx.map((s, idx) => {
                    const lastP = getExLastPerfLabel(s.set_number, s.side)
                    const isFirstOfSet = !ex.is_unilateral || s.side === 'left'
                    return (
                      <div key={`${s.set_number}-${s.side}`}>
                        {ex.is_unilateral && isFirstOfSet && idx > 0 && <div className="h-px bg-white/[0.04] mx-5" />}
                        <div className={`grid items-center gap-2 px-5 py-3 transition-all duration-200 ${s.completed ? 'bg-[#1f8a65]/[0.08]' : ''} ${!ex.is_unilateral ? 'border-t border-white/[0.04]' : ''}`} style={{ gridTemplateColumns: ex.is_unilateral ? '1fr 1fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' : '0.6fr 1.8fr 1.8fr 1.8fr 1.5fr 1fr' }}>
                          <div className="text-[12px] font-mono font-bold text-white/30">{(!ex.is_unilateral || s.side === 'left') ? s.set_number : ''}</div>
                          {ex.is_unilateral && <div className={`text-[11px] font-bold ${sideColor(s.side)}`}>{sideLabel(s.side)}</div>}
                          {(() => {
                            const key = recKey(ex.id, s.set_number, s.side)
                            const rec = recommendations[key]
                            const isRec = !!rec && !s.completed
                            return (
                              <div>
                                <div className="text-[11px] font-mono text-white/30 truncate">{s.planned_reps}</div>
                                {lastP && (!ex.is_unilateral || s.side === 'left') && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] text-white/20 truncate">↩ {lastP.weight ? `${lastP.weight}kg` : '—'} × {lastP.reps ?? '—'}</span>
                                    {isRec && <DeltaBadge rec={rec} />}
                                  </div>
                                )}
                                {isRec && !lastP && <DeltaBadge rec={rec} />}
                              </div>
                            )
                          })()}
                          {(() => {
                            const key = recKey(ex.id, s.set_number, s.side)
                            const isRec = !!recommendations[key] && !s.completed
                            return (
                              <input type="number" inputMode="numeric" min={0} value={s.actual_reps}
                                onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                                onChange={e => { setManuallyEdited(prev => new Set(prev).add(key)); setRecommendations(prev => { const next = { ...prev }; delete next[key]; return next }); updateSet(ex.id, s.set_number, s.side, { actual_reps: e.target.value }) }}
                                placeholder={lastP?.reps ? String(lastP.reps) : '—'}
                                className={`h-10 rounded-xl px-2 text-[13px] font-mono font-bold text-center outline-none w-full placeholder:text-white/20 transition-colors focus:ring-1 focus:ring-[#1f8a65]/40 focus:border-[#1f8a65]/30 ${isRec ? 'bg-[#1f8a65]/[0.06] border border-[#1f8a65]/30 text-[#1f8a65]/70' : 'bg-white/[0.04] border border-white/[0.06] text-white'}`} />
                            )
                          })()}
                          <input type="number" inputMode="decimal" min={0} step={0.5} value={s.actual_weight_kg}
                            onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                            onChange={e => { const key = recKey(ex.id, s.set_number, s.side); setManuallyEdited(prev => new Set(prev).add(key)); setRecommendations(prev => { const next = { ...prev }; delete next[key]; return next }); updateSet(ex.id, s.set_number, s.side, { actual_weight_kg: e.target.value }) }}
                            placeholder={lastP?.weight ? String(lastP.weight) : '—'}
                            className={`h-10 rounded-xl px-2 text-[13px] font-mono font-bold text-center outline-none w-full placeholder:text-white/20 transition-colors focus:ring-1 focus:ring-[#1f8a65]/40 focus:border-[#1f8a65]/30 ${(() => { const key = recKey(ex.id, s.set_number, s.side); return !!recommendations[key] && !s.completed })() ? 'bg-[#1f8a65]/[0.06] border border-[#1f8a65]/30 text-[#1f8a65]/70' : 'bg-white/[0.04] border border-white/[0.06] text-white'}`} />
                          <input type="number" inputMode="numeric" min={0} max={10} value={s.rir_actual}
                            onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                            onChange={e => updateSet(ex.id, s.set_number, s.side, { rir_actual: e.target.value })}
                            placeholder={exEffectiveRir !== null && exEffectiveRir !== undefined ? String(exEffectiveRir) : '—'}
                            className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 text-[13px] font-mono font-bold text-white text-center outline-none focus:ring-1 focus:ring-violet-400/40 focus:border-violet-400/30 w-full placeholder:text-white/20 transition-colors" />
                          <button onClick={() => toggleSet(ex.id, s.set_number, s.side, ex.rest_sec)} title="Valider" className={`flex justify-center items-center h-10 w-10 rounded-xl transition-all duration-200 active:scale-90 ${s.completed ? 'bg-[#1f8a65]/20 shadow-[0_0_12px_rgba(31,138,101,0.3)]' : 'hover:bg-white/[0.06]'}`}>
                            {s.completed ? <CheckCircle2 size={22} className="text-[#1f8a65]" /> : <Circle size={22} className="text-white/20 hover:text-white/50 transition-colors" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-white/[0.05] px-5 py-3">
                  {showNoteInput === ex.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea autoFocus rows={3} value={exerciseNotes[ex.id] ?? ''} onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }} onChange={e => setExerciseNotes(prev => ({ ...prev, [ex.id]: e.target.value }))} placeholder={t('logger.note.placeholder')} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#1f8a65]/30 focus:border-[#1f8a65]/20 resize-none transition-colors leading-relaxed" />
                      <div className="flex justify-end"><button onClick={() => setShowNoteInput(null)} className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors">Fermer</button></div>
                    </div>
                  ) : (
                    <button onClick={() => setShowNoteInput(ex.id)} className="flex items-center gap-2 text-[11px] font-medium text-white/30 hover:text-white/55 transition-colors">
                      <MessageSquare size={13} />
                      {exerciseNotes[ex.id] ? <span className="text-white/50 truncate max-w-[260px]">{exerciseNotes[ex.id]}</span> : 'Ajouter un ressenti'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          // ── Superset : affichage par round ──
          (() => {
            const groupColor = currentGroup[0].group_id ? supersetColors[currentGroup[0].group_id] : '#f59e0b'
            const numRounds = Math.max(...currentGroup.map(ex => ex.sets))

            return (
              <div className="flex flex-col gap-3">
                {/* En-têtes exercices du superset */}
                <div className="border rounded-2xl overflow-hidden" style={{ borderColor: `${groupColor}40`, backgroundColor: `${groupColor}06` }}>
                  {currentGroup.map((ex, exIdx) => {
                    const exEffectiveRir = ex.target_rir ?? ex.rir
                    const allExDone = sets.filter(s => s.exercise_id === ex.id).every(s => s.completed)
                    const code = `${supersetLetter}${exIdx + 1}`
                    return (
                      <div key={ex.id} className={exIdx > 0 ? 'border-t' : ''} style={exIdx > 0 ? { borderColor: `${groupColor}20` } : {}}>
                        {/* Image fullwidth collapsible — identique pour tous les exercices du superset */}
                        {ex.image_url && (
                          !hiddenImages.has(ex.id) ? (
                            <div className="relative w-full aspect-[16/9] bg-black/20 overflow-hidden">
                              <Image src={ex.image_url} alt={ex.name} fill className="object-cover" unoptimized={ex.image_url.endsWith('.gif')} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <button onClick={() => setHiddenImages(prev => new Set(prev).add(ex.id))} className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium text-white/60 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-black/60 transition-colors">
                                <ChevronUp size={11} />{t('logger.demo.hide')}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setHiddenImages(prev => { const n = new Set(prev); n.delete(ex.id); return n })} className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors" style={{ borderBottom: `1px solid ${groupColor}20` }}>
                              <span>{t('logger.demo.show')}</span>
                            </button>
                          )
                        )}
                        <div className="px-4 py-3 flex items-start gap-3">
                          {/* Code A1/A2 */}
                          <span className="text-[11px] font-black w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 tabular-nums" style={{ backgroundColor: `${groupColor}25`, color: groupColor, border: `1px solid ${groupColor}50` }}>{code}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <p className="text-[13px] font-bold text-white leading-snug">{swappedNames[ex.id] ?? ex.name}</p>
                              {allExDone && <CheckCircle2 size={12} className="text-[#1f8a65] shrink-0 mt-0.5" />}
                              <button onClick={() => setSwapTarget(ex.id)} className="flex items-center h-6 px-1.5 rounded-lg bg-white/[0.04] text-white/35 hover:text-white/60 hover:bg-white/[0.07] transition-colors shrink-0"><ArrowLeftRight size={11} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[10px] font-mono font-bold" style={{ color: groupColor }}>{ex.sets} × {ex.reps}</span>
                              {ex.rest_sec != null && ex.rest_sec > 0
                                ? <span className="flex items-center gap-1 text-[10px] text-white/35"><Clock size={9} />{ex.rest_sec}s avant suivant</span>
                                : exIdx < currentGroup.length - 1
                                  ? <span className="text-[10px] text-white/25 italic">→ Enchaîner directement</span>
                                  : null
                              }
                              {exEffectiveRir !== null && exEffectiveRir !== undefined && <span className="text-[10px] text-white/35">RIR cible <span className="text-white/60 font-semibold">{exEffectiveRir}</span></span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Rounds */}
                {Array.from({ length: numRounds }, (_, roundIdx) => {
                  const roundNum = roundIdx + 1
                  const roundSets = currentGroup.flatMap(ex =>
                    sets.filter(s => s.exercise_id === ex.id && s.set_number === roundNum)
                  )
                  const roundDone = roundSets.length > 0 && roundSets.every(s => s.completed)

                  return (
                    <div key={roundIdx} className="border rounded-2xl overflow-hidden" style={{ borderColor: roundDone ? `${groupColor}40` : `${groupColor}18`, backgroundColor: roundDone ? `${groupColor}04` : 'transparent' }}>
                      {/* Sets de chaque exercice dans ce round — pas de header texte */}
                      {currentGroup.map((ex, exInGroupIdx) => {
                        const exSetsForRound = sets.filter(s => s.exercise_id === ex.id && s.set_number === roundNum)
                        const exLastPerf = lastPerformance[ex.name] ?? []
                        const exEffectiveRir = ex.target_rir ?? ex.rir
                        const isLastExInGroup = exInGroupIdx === currentGroup.length - 1
                        // Timer : déclenché après validation du set de cet exercice dans ce round
                        const restSecForToggle = ex.rest_sec ?? null

                        function getExLastPerfLabel(side: 'left' | 'right' | 'bilateral') {
                          if (exLastPerf.length === 0) return null
                          const match = exLastPerf.find(p => side !== 'bilateral' ? p.side === side : true)
                          return match ?? exLastPerf[0]
                        }

                        const exCode = `${supersetLetter}${exInGroupIdx + 1}`
                        return (
                          <div key={ex.id} className={exInGroupIdx > 0 ? 'border-t' : ''} style={exInGroupIdx > 0 ? { borderColor: `${groupColor}15` } : {}}>
                            {/* Nom exercice dans le tour */}
                            <div className="px-4 pt-2.5 pb-1 flex items-center gap-2">
                              <span className="text-[9px] font-black w-6 h-5 rounded flex items-center justify-center shrink-0 tabular-nums" style={{ backgroundColor: `${groupColor}18`, color: groupColor }}>{exCode}</span>
                              <p className="text-[11px] font-semibold text-white/70 leading-snug">{swappedNames[ex.id] ?? ex.name}</p>
                              {/* Séparateur repos entre exercices du superset */}
                              {!isLastExInGroup && (
                                ex.rest_sec != null && ex.rest_sec > 0
                                  ? <span className="ml-auto flex items-center gap-1 text-[9px] text-white/30 shrink-0"><Clock size={8} />{ex.rest_sec}s</span>
                                  : <span className="ml-auto text-[9px] text-white/20 italic shrink-0">→</span>
                              )}
                              {isLastExInGroup && ex.rest_sec != null && ex.rest_sec > 0 && roundIdx < numRounds - 1 && (
                                <span className="ml-auto flex items-center gap-1 text-[9px] shrink-0" style={{ color: `${groupColor}99` }}><Clock size={8} />{ex.rest_sec}s repos</span>
                              )}
                            </div>

                            {/* Header colonnes */}
                            <div className="grid items-center px-4 pb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/25" style={{ gridTemplateColumns: ex.is_unilateral ? '1fr 1.8fr 1.8fr 1.5fr 1fr' : '1.8fr 1.8fr 1.5fr 1fr' }}>
                              {ex.is_unilateral && <div>{t('logger.set')}</div>}
                              <div>{t('logger.actual.label')}</div>
                              <div>Kg</div>
                              <div>{t('logger.rir.label')}</div>
                              <div className="text-center">✓</div>
                            </div>

                            {/* Sets (bilatéral ou unilatéral) */}
                            {exSetsForRound.map((s) => {
                              const lastP = getExLastPerfLabel(s.side)
                              const key = recKey(ex.id, s.set_number, s.side)
                              const isRec = !!recommendations[key] && !s.completed

                              return (
                                <div key={`${s.set_number}-${s.side}`} className={`grid items-center gap-2 px-4 pb-3 pt-1 transition-all duration-200 ${s.completed ? 'bg-[#1f8a65]/[0.06]' : ''}`} style={{ gridTemplateColumns: ex.is_unilateral ? '1fr 1.8fr 1.8fr 1.5fr 1fr' : '1.8fr 1.8fr 1.5fr 1fr' }}>
                                  {ex.is_unilateral && (
                                    <div className={`text-[11px] font-bold ${sideColor(s.side)}`}>{sideLabel(s.side)}</div>
                                  )}
                                  {/* Reps */}
                                  <input type="number" inputMode="numeric" min={0} value={s.actual_reps}
                                    onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                                    onChange={e => { setManuallyEdited(prev => new Set(prev).add(key)); setRecommendations(prev => { const next = { ...prev }; delete next[key]; return next }); updateSet(ex.id, s.set_number, s.side, { actual_reps: e.target.value }) }}
                                    placeholder={lastP?.reps ? String(lastP.reps) : s.planned_reps || '—'}
                                    className={`h-10 rounded-xl px-2 text-[13px] font-mono font-bold text-center outline-none w-full placeholder:text-white/20 transition-colors focus:ring-1 focus:ring-[#1f8a65]/40 ${isRec ? 'bg-[#1f8a65]/[0.06] border border-[#1f8a65]/30 text-[#1f8a65]/70' : 'bg-white/[0.04] border border-white/[0.06] text-white'}`} />
                                  {/* Kg */}
                                  <input type="number" inputMode="decimal" min={0} step={0.5} value={s.actual_weight_kg}
                                    onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                                    onChange={e => { setManuallyEdited(prev => new Set(prev).add(key)); setRecommendations(prev => { const next = { ...prev }; delete next[key]; return next }); updateSet(ex.id, s.set_number, s.side, { actual_weight_kg: e.target.value }) }}
                                    placeholder={lastP?.weight ? String(lastP.weight) : '—'}
                                    className={`h-10 rounded-xl px-2 text-[13px] font-mono font-bold text-center outline-none w-full placeholder:text-white/20 transition-colors focus:ring-1 focus:ring-[#1f8a65]/40 ${isRec ? 'bg-[#1f8a65]/[0.06] border border-[#1f8a65]/30 text-[#1f8a65]/70' : 'bg-white/[0.04] border border-white/[0.06] text-white'}`} />
                                  {/* RIR */}
                                  <input type="number" inputMode="numeric" min={0} max={10} value={s.rir_actual}
                                    onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }}
                                    onChange={e => updateSet(ex.id, s.set_number, s.side, { rir_actual: e.target.value })}
                                    placeholder={exEffectiveRir !== null && exEffectiveRir !== undefined ? String(exEffectiveRir) : '—'}
                                    className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 text-[13px] font-mono font-bold text-white text-center outline-none focus:ring-1 focus:ring-violet-400/40 w-full placeholder:text-white/20 transition-colors" />
                                  {/* Valider */}
                                  <button onClick={() => toggleSet(ex.id, s.set_number, s.side, restSecForToggle)} className={`flex justify-center items-center h-10 w-10 rounded-xl transition-all duration-200 active:scale-90 ${s.completed ? 'bg-[#1f8a65]/20 shadow-[0_0_12px_rgba(31,138,101,0.3)]' : 'hover:bg-white/[0.06]'}`}>
                                    {s.completed ? <CheckCircle2 size={22} className="text-[#1f8a65]" /> : <Circle size={22} className="text-white/20 hover:text-white/50 transition-colors" />}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Notes superset */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3">
                  {showNoteInput === currentGroup[0].id ? (
                    <div className="flex flex-col gap-2">
                      <textarea autoFocus rows={3} value={exerciseNotes[currentGroup[0].id] ?? ''} onFocus={() => { activeInputRef.current = true }} onBlur={() => { activeInputRef.current = false }} onChange={e => setExerciseNotes(prev => ({ ...prev, [currentGroup[0].id]: e.target.value }))} placeholder={t('logger.note.placeholder')} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#1f8a65]/30 resize-none transition-colors leading-relaxed" />
                      <div className="flex justify-end"><button onClick={() => setShowNoteInput(null)} className="px-4 py-1.5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors">Fermer</button></div>
                    </div>
                  ) : (
                    <button onClick={() => setShowNoteInput(currentGroup[0].id)} className="flex items-center gap-2 text-[11px] font-medium text-white/30 hover:text-white/55 transition-colors">
                      <MessageSquare size={13} />
                      {exerciseNotes[currentGroup[0].id] ? <span className="text-white/50 truncate max-w-[260px]">{exerciseNotes[currentGroup[0].id]}</span> : 'Ajouter un ressenti'}
                    </button>
                  )}
                </div>
              </div>
            )
          })()
        )}

        {/* ── Groupe suivant ── */}
        {!isLast && (
          <button
            onClick={() => setCurrentGroupIndex(i => i + 1)}
            className="w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] text-white/60 font-semibold py-3.5 rounded-xl hover:bg-white/[0.06] hover:text-white/80 transition-colors text-[12px]"
          >
            {exerciseGroups[currentGroupIndex + 1]?.length > 1 ? 'Superset suivant' : 'Exercice suivant'}
            <ChevronRight size={14} />
          </button>
        )}
      </main>

      {swapTarget && (
        <ExerciseSwapSheet
          exercise={exercises.find(e => e.id === swapTarget)!}
          allExercises={exercises}
          onSwap={(newName) => handleSwap(swapTarget, newName)}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* ── ClientAlternativesSheet ── */}
      {altSheetTarget !== null && exercises[altSheetTarget]?.clientAlternatives?.length ? (
        <ClientAlternativesSheet
          exerciseName={swappedNames[exercises[altSheetTarget].id] ?? exercises[altSheetTarget].name}
          alternatives={exercises[altSheetTarget].clientAlternatives!}
          onSelect={(name) => {
            setSwappedNames(prev => ({ ...prev, [exercises[altSheetTarget].id]: name }))
          }}
          onClose={() => setAltSheetTarget(null)}
        />
      ) : null}

      {/* ── Bouton Terminer (fixe) ── */}
      <div className="fixed bottom-6 left-0 right-0 px-5 z-40">
        <div className="max-w-lg mx-auto">
          {allDone ? (
            /* Séance complète → simple clic, vert proéminent */
            <button
              onClick={submitSession}
              disabled={saveState === 'saving' || !draftReady}
              className="group w-full flex items-center justify-between bg-[#1f8a65] pl-5 pr-1.5 py-1.5 rounded-xl hover:bg-[#217356] active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                {!draftReady ? 'Initialisation…' : saveState === 'saving' ? 'Enregistrement…' : t('logger.finish')}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.15]">
                {(!draftReady || saveState === 'saving')
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Flag size={15} className="text-white" />
                }
              </div>
            </button>
          ) : (
            /* Séance incomplète → appui long 3s, gris discret */
            <div className="relative overflow-hidden rounded-xl">
              {/* Jauge de remplissage */}
              {longPressProgress > 0 && (
                <div
                  className="absolute inset-0 bg-[#1f8a65] rounded-xl transition-none origin-left"
                  style={{ transform: `scaleX(${longPressProgress})` }}
                />
              )}
              <button
                onMouseDown={onFinishPressStart}
                onMouseUp={onFinishPressEnd}
                onMouseLeave={onFinishPressEnd}
                onTouchStart={onFinishPressStart}
                onTouchEnd={onFinishPressEnd}
                disabled={saveState === 'saving' || !draftReady}
                className="relative w-full flex items-center justify-between bg-white/[0.06] pl-5 pr-1.5 py-1.5 rounded-xl disabled:opacity-50 select-none"
              >
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">
                  {!draftReady ? 'Initialisation…' : saveState === 'saving' ? 'Enregistrement…' : 'Terminer · Maintenir 3s'}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                  {saveState === 'saving'
                    ? <Loader2 size={15} className="text-white/40 animate-spin" />
                    : <Flag size={15} className="text-white/30" />
                  }
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
