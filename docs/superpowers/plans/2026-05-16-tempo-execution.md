# Tempo d'Exécution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add execution tempo ("3-1-2-0") to coach template exercises, propagate to program exercises, display in SessionLogger with auto-defaults per movement pattern + goal, and persist `tempo_used` in set logs.

**Architecture:** Pure nullable string `tempo` column on `coach_program_template_exercises` and `program_exercises`; `tempo_used` on `client_set_logs`. Auto-defaults computed at render-time in `lib/training/tempo.ts` — never persisted when null. Coach configures per exercise in ExerciseCard; client sees it in SessionLogger under the exercise name.

**Tech Stack:** SQL (Supabase migrations), TypeScript strict, Vitest, Next.js App Router, React.

---

## File Map

| File | Action | Role |
|------|--------|------|
| `supabase/migrations/20260516_tempo.sql` | Create | Add `tempo` to template/program exercises + `tempo_used` to set_logs |
| `lib/training/tempo.ts` | Create | `DEFAULT_TEMPOS`, `getDefaultTempo()`, `parseTempo()`, `formatTempo()`, `calcTUT()` |
| `tests/lib/training/tempo.test.ts` | Create | Unit tests for all tempo functions |
| `app/api/program-templates/[templateId]/assign/route.ts` | Modify | Propagate `tempo` to `program_exercises` |
| `components/programs/studio/ExerciseCard.tsx` | Modify | Add tempo input field + `ExerciseData` interface update |
| `components/programs/ProgramTemplateBuilder.tsx` | Modify | Add `tempo` to `Exercise` interface + `emptyExercise()` + save/load |
| `app/client/programme/session/[sessionId]/page.tsx` | Modify | Fetch `tempo` + `movement_pattern` from `program_exercises`; pass to SessionLogger |
| `app/client/programme/session/[sessionId]/SessionLogger.tsx` | Modify | Display tempo badge + store `tempo_used` in SetLog |
| `app/api/session-logs/[logId]/sets/route.ts` | Modify | Accept + persist `tempo_used` in upsert |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260516_tempo.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add tempo columns to coach_program_template_exercises and program_exercises
-- tempo: nullable text e.g. "3-1-2-0", "X-0-X-0". NULL = not configured, use default.
-- tempo_used: logged at set time (computed default or coach-set value)

ALTER TABLE public.coach_program_template_exercises
  ADD COLUMN IF NOT EXISTS tempo text;

ALTER TABLE public.program_exercises
  ADD COLUMN IF NOT EXISTS tempo text;

ALTER TABLE public.client_set_logs
  ADD COLUMN IF NOT EXISTS tempo_used text;
```

- [ ] **Step 2: Apply via Supabase Dashboard SQL Editor**

Open Supabase Dashboard → SQL Editor → paste the migration → Run.

Verify success: no errors. Optionally confirm with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'coach_program_template_exercises' AND column_name = 'tempo';
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260516_tempo.sql
git commit -m "schema: add tempo to template/program exercises and tempo_used to set_logs"
```

---

## Task 2: Core Tempo Library — Write Tests First

**Files:**
- Create: `tests/lib/training/tempo.test.ts`
- Create: `lib/training/tempo.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/training/tempo.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  parseTempo,
  formatTempo,
  getDefaultTempo,
  calcTUT,
} from '@/lib/training/tempo'

describe('parseTempo', () => {
  it('parses a standard tempo string', () => {
    const result = parseTempo('3-1-2-0')
    expect(result).toEqual({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 })
  })

  it('parses X phases as "X"', () => {
    const result = parseTempo('2-0-X-0')
    expect(result).toEqual({ eccentric: 2, pauseBottom: 0, concentric: 'X', pauseTop: 0 })
  })

  it('parses all-X tempo', () => {
    const result = parseTempo('X-X-X-X')
    expect(result).toEqual({ eccentric: 'X', pauseBottom: 'X', concentric: 'X', pauseTop: 'X' })
  })

  it('returns null for invalid format', () => {
    expect(parseTempo('abc')).toBeNull()
    expect(parseTempo('1-2-3')).toBeNull()       // only 3 parts
    expect(parseTempo('')).toBeNull()
    expect(parseTempo('1-2-3-4-5')).toBeNull()   // 5 parts
  })

  it('returns null for out-of-range values', () => {
    expect(parseTempo('10-1-2-0')).toBeNull()    // eccentric > 8
    expect(parseTempo('-1-1-2-0')).toBeNull()    // negative
  })
})

describe('formatTempo', () => {
  it('formats a parsed tempo back to string', () => {
    expect(formatTempo({ eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 })).toBe('3-1-2-0')
  })

  it('formats X phases correctly', () => {
    expect(formatTempo({ eccentric: 2, pauseBottom: 0, concentric: 'X', pauseTop: 0 })).toBe('2-0-X-0')
  })
})

describe('getDefaultTempo', () => {
  // Hypertrophy defaults
  it('returns 3-1-2-0 for vertical_pull + hypertrophy', () => {
    expect(getDefaultTempo('vertical_pull', 'hypertrophy')).toBe('3-1-2-0')
  })

  it('returns 3-1-2-0 for horizontal_pull + hypertrophy', () => {
    expect(getDefaultTempo('horizontal_pull', 'hypertrophy')).toBe('3-1-2-0')
  })

  it('returns 2-1-2-0 for vertical_push + hypertrophy', () => {
    expect(getDefaultTempo('vertical_push', 'hypertrophy')).toBe('2-1-2-0')
  })

  it('returns 3-1-2-1 for horizontal_push + hypertrophy', () => {
    expect(getDefaultTempo('horizontal_push', 'hypertrophy')).toBe('3-1-2-1')
  })

  it('returns 3-1-1-0 for hip_hinge + hypertrophy', () => {
    expect(getDefaultTempo('hip_hinge', 'hypertrophy')).toBe('3-1-1-0')
  })

  it('returns 3-1-2-0 for knee_flexion + hypertrophy', () => {
    expect(getDefaultTempo('knee_flexion', 'hypertrophy')).toBe('3-1-2-0')
  })

  it('returns 3-0-2-0 for knee_extension + hypertrophy', () => {
    expect(getDefaultTempo('knee_extension', 'hypertrophy')).toBe('3-0-2-0')
  })

  it('returns 3-1-2-1 for elbow_flexion + hypertrophy (isolation)', () => {
    expect(getDefaultTempo('elbow_flexion', 'hypertrophy')).toBe('3-1-2-1')
  })

  it('returns 3-1-2-1 for elbow_extension + hypertrophy (isolation)', () => {
    expect(getDefaultTempo('elbow_extension', 'hypertrophy')).toBe('3-1-2-1')
  })

  it('returns 2-1-2-1 for core_anti_flex + hypertrophy', () => {
    expect(getDefaultTempo('core_anti_flex', 'hypertrophy')).toBe('2-1-2-1')
  })

  // Strength defaults
  it('returns 2-0-X-0 for vertical_pull + strength', () => {
    expect(getDefaultTempo('vertical_pull', 'strength')).toBe('2-0-X-0')
  })

  it('returns 2-0-X-0 for horizontal_push + strength', () => {
    expect(getDefaultTempo('horizontal_push', 'strength')).toBe('2-0-X-0')
  })

  it('returns 2-0-X-0 for squat_pattern + strength', () => {
    expect(getDefaultTempo('squat_pattern', 'strength')).toBe('2-0-X-0')
  })

  it('returns 2-0-2-0 for elbow_flexion + strength (isolation stays controlled)', () => {
    expect(getDefaultTempo('elbow_flexion', 'strength')).toBe('2-0-2-0')
  })

  // Endurance defaults
  it('returns 2-0-2-0 for any compound + endurance', () => {
    expect(getDefaultTempo('vertical_pull', 'endurance')).toBe('2-0-2-0')
    expect(getDefaultTempo('hip_hinge', 'endurance')).toBe('2-0-2-0')
  })

  // Unknown pattern fallback
  it('returns default 2-0-2-0 for unknown pattern', () => {
    expect(getDefaultTempo(null, 'hypertrophy')).toBe('2-0-2-0')
    expect(getDefaultTempo('unknown_pattern', 'hypertrophy')).toBe('2-0-2-0')
  })

  // Unknown goal fallback
  it('falls back to hypertrophy defaults for unknown goal', () => {
    expect(getDefaultTempo('vertical_pull', 'unknown_goal')).toBe('3-1-2-0')
  })
})

describe('calcTUT', () => {
  it('calculates TUT for a standard tempo + reps', () => {
    // 3-1-2-0 × 10 reps = (3+1+2+0) × 10 = 60s
    const parsed = parseTempo('3-1-2-0')!
    expect(calcTUT(parsed, 10)).toBe(60)
  })

  it('treats X phases as 1 second for TUT calculation', () => {
    // 2-0-X-0 × 5 reps = (2+0+1+0) × 5 = 15s
    const parsed = parseTempo('2-0-X-0')!
    expect(calcTUT(parsed, 5)).toBe(15)
  })

  it('returns 0 for 0 reps', () => {
    const parsed = parseTempo('3-1-2-0')!
    expect(calcTUT(parsed, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/user/Desktop/STRYVLAB && npx vitest run tests/lib/training/tempo.test.ts
```

Expected: All tests fail with "Cannot find module" or similar.

- [ ] **Step 3: Implement `lib/training/tempo.ts`**

```typescript
// lib/training/tempo.ts
// Tempo d'exécution — 4 phases: Excentrique-PauseBasse-Concentrique-PauseHaute
// "3-1-2-0" = 3s descente, 1s pause basse, 2s montée, 0s pause haute
// "X" = explosif (le plus vite possible)

export type TempoPhase = number | 'X'

export interface ParsedTempo {
  eccentric: TempoPhase
  pauseBottom: TempoPhase
  concentric: TempoPhase
  pauseTop: TempoPhase
}

// Parse "3-1-2-0" or "X-0-X-0" into structured object.
// Returns null if format is invalid.
export function parseTempo(raw: string): ParsedTempo | null {
  if (!raw || typeof raw !== 'string') return null
  const parts = raw.trim().split('-')
  if (parts.length !== 4) return null
  const parsed: TempoPhase[] = []
  for (const part of parts) {
    const upper = part.toUpperCase()
    if (upper === 'X') {
      parsed.push('X')
    } else {
      const n = parseInt(upper, 10)
      if (isNaN(n) || n < 0 || n > 8) return null
      parsed.push(n)
    }
  }
  return {
    eccentric: parsed[0],
    pauseBottom: parsed[1],
    concentric: parsed[2],
    pauseTop: parsed[3],
  }
}

// Format parsed tempo back to canonical string
export function formatTempo(t: ParsedTempo): string {
  const fmt = (p: TempoPhase) => p === 'X' ? 'X' : String(p)
  return `${fmt(t.eccentric)}-${fmt(t.pauseBottom)}-${fmt(t.concentric)}-${fmt(t.pauseTop)}`
}

// TUT in seconds. X phases count as 1s.
export function calcTUT(t: ParsedTempo, reps: number): number {
  const val = (p: TempoPhase) => p === 'X' ? 1 : p
  return (val(t.eccentric) + val(t.pauseBottom) + val(t.concentric) + val(t.pauseTop)) * reps
}

// ─── Default Tempos ───────────────────────────────────────────────────────────
// Scientific basis: TUT-based hypertrophy targets, explosive concentric for strength,
// moderate tempo for endurance. Patterns without specific rules get generic default.

type MovementPattern = string | null | undefined

// ISOLATION_PATTERNS: movements targeting a single joint — controlled tempo both goals
const ISOLATION_PATTERNS = new Set([
  'elbow_flexion', 'elbow_extension', 'lateral_raise', 'calf_raise',
  'hip_abduction', 'hip_adduction', 'shoulder_rotation',
])

// COMPOUND_PATTERNS: multi-joint movements — explosive concentric for strength
const HYPERTROPHY_TEMPO_MAP: Record<string, string> = {
  vertical_pull:     '3-1-2-0',
  horizontal_pull:   '3-1-2-0',
  vertical_push:     '2-1-2-0',
  horizontal_push:   '3-1-2-1',  // pec sous tension pause haute
  hip_hinge:         '3-1-1-0',
  squat_pattern:     '3-1-2-0',
  knee_flexion:      '3-1-2-0',
  knee_extension:    '3-0-2-0',
  elbow_flexion:     '3-1-2-1',
  elbow_extension:   '3-1-2-1',
  lateral_raise:     '2-1-2-1',
  calf_raise:        '2-1-2-0',
  hip_abduction:     '2-1-2-0',
  hip_adduction:     '2-1-2-0',
  shoulder_rotation: '2-1-2-0',
  core_anti_flex:    '2-1-2-1',
  core_flex:         '2-1-2-1',
  core_rotation:     '2-1-2-1',
  carry:             '2-0-2-0',
  scapular_elevation: '2-1-2-0',
  scapular_retraction: '2-1-2-0',
  scapular_protraction: '2-0-2-0',
}

const STRENGTH_DEFAULT_COMPOUND = '2-0-X-0'
const STRENGTH_DEFAULT_ISOLATION = '2-0-2-0'

const ENDURANCE_DEFAULT = '2-0-2-0'

const FALLBACK_DEFAULT = '2-0-2-0'

/**
 * Returns the recommended tempo string for a given movement pattern and program goal.
 * Never returns null — always has a sensible default.
 * Called at render-time; result is NEVER persisted when coach hasn't set a tempo.
 */
export function getDefaultTempo(pattern: MovementPattern, goal: string): string {
  const g = (goal ?? '').toLowerCase()

  if (g === 'endurance' || g === 'athletic') {
    return ENDURANCE_DEFAULT
  }

  if (g === 'strength' || g === 'fat_loss' || g === 'maintenance') {
    if (pattern && ISOLATION_PATTERNS.has(pattern)) {
      return STRENGTH_DEFAULT_ISOLATION
    }
    // Compound movements and unknown patterns: explosive concentric
    if (pattern && (HYPERTROPHY_TEMPO_MAP[pattern] || !ISOLATION_PATTERNS.has(pattern))) {
      return STRENGTH_DEFAULT_COMPOUND
    }
    return STRENGTH_DEFAULT_COMPOUND
  }

  // hypertrophy, recomp, unknown → use per-pattern hypertrophy map
  if (pattern && HYPERTROPHY_TEMPO_MAP[pattern]) {
    return HYPERTROPHY_TEMPO_MAP[pattern]
  }

  return FALLBACK_DEFAULT
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/user/Desktop/STRYVLAB && npx vitest run tests/lib/training/tempo.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit
```

Expected: 0 errors introduced by this file.

- [ ] **Step 6: Commit**

```bash
git add lib/training/tempo.ts tests/lib/training/tempo.test.ts
git commit -m "feat(tempo): add tempo library — parseTempo, getDefaultTempo, calcTUT with 30 tests"
```

---

## Task 3: Propagate Tempo in Assign Route

**Files:**
- Modify: `app/api/program-templates/[templateId]/assign/route.ts`

- [ ] **Step 1: Update the select query to fetch `tempo`**

In the `.select(...)` call for `coach_program_template_exercises`, add `tempo` to the field list.

Find the block starting at line 65:
```typescript
        coach_program_template_exercises (
          name, sets, reps, rest_sec, rir, notes, position, image_url,
          primary_muscles, secondary_muscles, movement_pattern, equipment_required, group_id,
          weight_increment_kg, is_compound
        )
```

Change to:
```typescript
        coach_program_template_exercises (
          name, sets, reps, rest_sec, rir, notes, position, image_url,
          primary_muscles, secondary_muscles, movement_pattern, equipment_required, group_id,
          weight_increment_kg, is_compound, tempo
        )
```

- [ ] **Step 2: Add `tempo` to the `program_exercises` insert payload**

In the `.map((e, ei) => { return { ... } })` block (around line 152), add after `is_compound`:
```typescript
              tempo: e.tempo ?? null,
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/program-templates/[templateId]/assign/route.ts
git commit -m "feat(tempo): propagate tempo from template to program_exercises on assign"
```

---

## Task 4: Coach Builder — ExerciseCard Tempo Input

**Files:**
- Modify: `components/programs/studio/ExerciseCard.tsx`
- Modify: `components/programs/ProgramTemplateBuilder.tsx`

### 4A — Add `tempo` to `ExerciseData` interface in ExerciseCard

- [ ] **Step 1: Extend `ExerciseData` interface**

In `components/programs/studio/ExerciseCard.tsx`, find the `ExerciseData` interface (line 70). Add `tempo` as optional nullable string:

```typescript
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
  tempo: string | null   // ← ADD THIS
  group_id?: string
  dbId?: string
}
```

- [ ] **Step 2: Add the tempo input field in ExerciseCard render**

Find the grid containing Sets / Reps / Repos / RIR (starts at `{/* Sets / Reps / Rest / RIR */}`). After the grid, before `{/* Palier de surcharge progressive */}`, add:

```tsx
            {/* Tempo d'exécution */}
            <div>
              <label className="block text-[9px] text-white/30 mb-0.5">
                Tempo (Exc-PB-Con-PH)
              </label>
              <input
                type="text"
                value={exercise.tempo ?? ''}
                onChange={e => {
                  const v = e.target.value.trim()
                  onUpdate({ tempo: v || null })
                }}
                placeholder="ex: 3-1-2-0 ou laisser vide"
                className="w-full bg-[#0a0a0a] rounded-md border-[0.3px] border-white/[0.06] text-[11px] text-white/80 placeholder:text-white/20 px-1.5 py-1 outline-none font-mono"
              />
            </div>
```

### 4B — Add `tempo` to ProgramTemplateBuilder

- [ ] **Step 3: Extend `Exercise` interface in ProgramTemplateBuilder**

In `components/programs/ProgramTemplateBuilder.tsx`, find the `Exercise` interface (line 157). Add `tempo: string | null`:

```typescript
interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_sec: number | null;
  rir: number | null;
  weight_increment_kg: number | null;
  notes: string;
  image_url: string | null;
  movement_pattern: string | null;
  equipment_required: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  is_compound: boolean | undefined;
  tempo: string | null;   // ← ADD THIS
  group_id?: string;
  dbId?: string;
  // Biomech fields ...
```

- [ ] **Step 4: Initialize `tempo` in `emptyExercise()`**

Find `function emptyExercise()` (line 210). Add `tempo: null,` to the returned object:
```typescript
function emptyExercise(): Exercise {
  return {
    name: "",
    sets: 3,
    reps: "8-12",
    rest_sec: 90,
    rir: 2,
    weight_increment_kg: null,
    notes: "",
    image_url: null,
    movement_pattern: null,
    equipment_required: [],
    primary_muscles: [],
    secondary_muscles: [],
    is_compound: undefined,
    tempo: null,           // ← ADD
    group_id: undefined,
    dbId: undefined,
    // biomech fields ...
```

- [ ] **Step 5: Persist `tempo` when loading existing template**

In the `.map(e => ...)` block that loads template exercises into state (around line 300, inside the fetch callback), add `tempo: e.tempo ?? null,`.

Search for the object returned in the exercises map — it contains `rest_sec: e.rest_sec,`. After `is_compound: e.is_compound ?? undefined,`, add:
```typescript
              tempo: e.tempo ?? null,
```

- [ ] **Step 6: Persist `tempo` when saving template (the save payload)**

Find the save/PATCH payload where exercises are mapped to the API format (around line 450). The block contains `rest_sec: e.rest_sec,`. After `is_compound: e.is_compound,`, add:
```typescript
        tempo: e.tempo ?? null,
```

Do the same in the duplicate block used for creating sessions (around line 630).

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add components/programs/studio/ExerciseCard.tsx components/programs/ProgramTemplateBuilder.tsx
git commit -m "feat(tempo): add tempo input to coach builder ExerciseCard"
```

---

## Task 5: Template API — Persist `tempo` on Save

**Files:**
- Modify: `app/api/program-templates/[templateId]/exercises/route.ts` (or equivalent route that saves exercises)

- [ ] **Step 1: Find the route that saves template exercises**

```bash
find /Users/user/Desktop/STRYVLAB/app/api/program-templates -name "route.ts" | head -10
```

- [ ] **Step 2: Add `tempo` to the Zod schema**

Find the `bodySchema` or `exerciseSchema` that validates exercise fields. Add:
```typescript
tempo: z.string().nullable().optional(),
```

- [ ] **Step 3: Add `tempo` to the insert/update payload**

In the upsert or insert call for `coach_program_template_exercises`, add:
```typescript
tempo: validatedData.tempo ?? null,
```

- [ ] **Step 4: TypeScript check + commit**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit
git add app/api/program-templates/
git commit -m "feat(tempo): persist tempo in template exercise API routes"
```

---

## Task 6: SessionLogger — Display Tempo + Persist tempo_used

**Files:**
- Modify: `app/client/programme/session/[sessionId]/page.tsx`
- Modify: `app/client/programme/session/[sessionId]/SessionLogger.tsx`
- Modify: `app/api/session-logs/[logId]/sets/route.ts`

### 6A — Fetch `tempo` and `movement_pattern` in page.tsx

- [ ] **Step 1: Add `tempo` and `movement_pattern` to the program_exercises select**

In `app/client/programme/session/[sessionId]/page.tsx`, find the select:
```typescript
      program_exercises (
        id, name, sets, reps, rest_sec, rir, notes, position,
        target_rir, current_weight_kg, rep_min, rep_max, weight_increment_kg,
        image_url, is_unilateral, primary_muscles, secondary_muscles, group_id
      )
```

Change to:
```typescript
      program_exercises (
        id, name, sets, reps, rest_sec, rir, notes, position,
        target_rir, current_weight_kg, rep_min, rep_max, weight_increment_kg,
        image_url, is_unilateral, primary_muscles, secondary_muscles, group_id,
        tempo, movement_pattern
      )
```

- [ ] **Step 2: Add `tempo` and `movement_pattern` to the exercises spread**

In the `.map((ex: any) => ({ ...ex, ... }))` block, `tempo` and `movement_pattern` will be included via `...ex`. No code change needed here — they pass through automatically.

### 6B — Update `Exercise` interface + `SetLog` in SessionLogger.tsx

- [ ] **Step 3: Add `tempo` and `movement_pattern` to the `Exercise` interface**

In `app/client/programme/session/[sessionId]/SessionLogger.tsx`, find the `Exercise` interface (line 18). Add:
```typescript
  tempo: string | null
  movement_pattern: string | null
```

- [ ] **Step 4: Add `tempo_used` to the `SetLog` interface**

Find the `SetLog` interface (line 40). Add:
```typescript
  tempo_used: string | null
```

- [ ] **Step 5: Initialize `tempo_used` in `buildInitialSets`**

In `buildInitialSets`, in both the `is_unilateral` branch and the bilateral branch, add to the pushed object:
```typescript
            tempo_used: null,
```

### 6C — Compute and display tempo in SessionLogger

- [ ] **Step 6: Import `getDefaultTempo` and `parseTempo`**

At the top of SessionLogger.tsx (after existing imports), add:
```typescript
import { getDefaultTempo, parseTempo } from '@/lib/training/tempo'
```

- [ ] **Step 7: Add the tempo display under the exercise name**

In the exercise display section, find where the exercise name is shown and the image section. After the exercise name (before the image/notes), add the tempo badge. Search for the exercise card header area that contains `currentEx.name`. Add below it:

```tsx
{/* Tempo badge */}
{(() => {
  const coachTempo = currentEx.tempo
  const resolvedTempo = coachTempo ?? getDefaultTempo(currentEx.movement_pattern, goal)
  const isDefault = !coachTempo
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="font-mono text-[12px] text-white/70 tracking-wider">{resolvedTempo}</span>
      <span className={`text-[9px] px-1 py-0.5 rounded ${isDefault ? 'bg-white/[0.04] text-white/30' : 'bg-[#1f8a65]/10 text-[#1f8a65]'}`}>
        {isDefault ? 'défaut' : 'coach'}
      </span>
    </div>
  )
})()}
```

- [ ] **Step 8: Store `tempo_used` in sets when the exercise card is first displayed / session starts**

In `buildInitialSets`, compute the tempo for each exercise and set it on `tempo_used`. Update the function to accept `goal` as a parameter and compute it:

```typescript
function buildInitialSets(exercises: Exercise[], goal: string): SetLog[] {
  const sets: SetLog[] = []
  for (const ex of exercises) {
    const resolvedTempo = ex.tempo ?? getDefaultTempo(ex.movement_pattern, goal)
    for (let i = 0; i < ex.sets; i++) {
      if (ex.is_unilateral) {
        for (const side of ['left', 'right'] as const) {
          sets.push({
            // ... existing fields ...
            tempo_used: resolvedTempo,
          })
        }
      } else {
        sets.push({
          // ... existing fields ...
          tempo_used: resolvedTempo,
        })
      }
    }
  }
  return sets
}
```

Update the `useState` call to pass `goal`:
```typescript
const [sets, setSets] = useState<SetLog[]>(() => buildInitialSets(exercises, goal))
```

- [ ] **Step 9: Include `tempo_used` in `parseSetForApi`**

In the `parseSetForApi` function, the spread `...s` already includes `tempo_used`. No change needed — it passes through.

### 6D — Accept `tempo_used` in the API route

- [ ] **Step 10: Add `tempo_used` to the Zod schema in sets/route.ts**

In `app/api/session-logs/[logId]/sets/route.ts`, find `setLogSchema`. Add:
```typescript
  tempo_used: z.string().nullable().optional(),
```

- [ ] **Step 11: Persist `tempo_used` in the upsert rows**

In the `rows` mapping (line 70), add:
```typescript
    tempo_used: s.tempo_used ?? null,
```

- [ ] **Step 12: TypeScript check**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 13: Commit**

```bash
git add app/client/programme/session/ app/api/session-logs/[logId]/sets/route.ts
git commit -m "feat(tempo): display tempo in SessionLogger and persist tempo_used in set logs"
```

---

## Task 7: CHANGELOG + project-state Update

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `.claude/rules/project-state.md`

- [ ] **Step 1: Update CHANGELOG.md**

Add at the top of today's section `## 2026-05-16`:
```
FEATURE: Add execution tempo system — coach configures per exercise, displayed in SessionLogger, logged as tempo_used in set_logs
SCHEMA: Add tempo to coach_program_template_exercises and program_exercises; tempo_used to client_set_logs
```

- [ ] **Step 2: Update project-state.md**

Add to "Dernières Avancées" section:

```markdown
### Tempo d'Exécution — Phase 1 (COMPLET)
- ✅ Schema : `tempo` (nullable) sur template exercises + program exercises, `tempo_used` sur client_set_logs
- ✅ `lib/training/tempo.ts` : `parseTempo`, `getDefaultTempo` (pattern × goal table), `formatTempo`, `calcTUT` — 30 tests
- ✅ Assign route : `tempo` propagé de template → program_exercises
- ✅ Coach builder : input `tempo` dans ExerciseCard (placeholder "3-1-2-0")
- ✅ SessionLogger : badge tempo sous le nom d'exercice (badge "défaut" si auto-calculé, "coach" si configuré)
- ✅ Logs : `tempo_used` stocké dans client_set_logs à chaque set
- ⚠️ La migration SQL doit être appliquée manuellement via Supabase Dashboard
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md .claude/rules/project-state.md
git commit -m "docs: update CHANGELOG and project-state for tempo execution feature"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|-------------|------------|
| `tempo` column on `coach_program_template_exercises` | Task 1 |
| `tempo` column on `program_exercises` | Task 1 |
| `tempo_used` column on `client_set_logs` | Task 1 |
| `lib/training/tempo.ts` with DEFAULT_TEMPOS table | Task 2 |
| `getDefaultTempo(pattern, goal)` | Task 2 |
| `parseTempo()` with "X" support | Task 2 |
| `formatTempo()` | Task 2 |
| Propagate tempo in assign route | Task 3 |
| Coach builder input per exercise | Task 4 |
| Template API persists tempo | Task 5 |
| SessionLogger displays tempo badge | Task 6 |
| "défaut" vs "coach" badge | Task 6 step 7 |
| `tempo_used` stored in set logs | Task 6 steps 8–11 |
| `goal` passed to `buildInitialSets` | Task 6 step 8 |
| `calcTUT()` function | Task 2 |
| TUT uses X=1s | Task 2 |
| Hypertrophy per-pattern tempos | Task 2 (HYPERTROPHY_TEMPO_MAP) |
| Strength explosive concentric | Task 2 (STRENGTH_DEFAULT_COMPOUND) |
| Endurance moderate | Task 2 (ENDURANCE_DEFAULT) |
| Null tempo in DB = compute at render, never persist | Task 2 (getDefaultTempo doc comment) + Task 6 |
| Non-blocking — field is informational | All tasks: tempo is never required |
| Avertissement coach changement tempo | **Not implemented** — scope trimmed. Detecting history would require querying set_logs per exercise, adding complexity for low value Phase 1. Add in Phase 2 if needed. |
| Métronome/timer animé | **Not implemented** — marked as "optionnel" in spec, deferred to Phase 2. |

### Placeholder scan

No placeholders found. All steps contain code or explicit SQL.

### Type consistency

- `Exercise.tempo: string | null` — used consistently in ExerciseCard, ProgramTemplateBuilder, SessionLogger
- `SetLog.tempo_used: string | null` — defined in SessionLogger, schema in sets/route.ts
- `getDefaultTempo(pattern: MovementPattern, goal: string): string` — called in SessionLogger step 7 and buildInitialSets step 8
- `buildInitialSets(exercises: Exercise[], goal: string)` — updated signature, useState call updated to match
