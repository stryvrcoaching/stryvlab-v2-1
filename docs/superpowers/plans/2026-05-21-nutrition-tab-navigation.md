# Nutrition Tab Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organise the `/client/nutrition` page into 3 tabs (Aujourd'hui / Tendances / Protocole) using the same tab-bar pattern as `ProgrammeClientPage`.

**Architecture:** Server Component `page.tsx` keeps all data fetching unchanged (+ a `client_preferences` lang fetch added). It delegates all rendering to a new Client Component `NutritionClientPage.tsx` that owns tab state. No existing nutrition components are modified.

**Tech Stack:** Next.js App Router, React `useState`, Tailwind DS v4 tokens, existing i18n `ct()` helper.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/client/nutrition/NutritionClientPage.tsx` | **Create** | Tab state, tab bar, conditional render of sections |
| `app/client/nutrition/page.tsx` | **Modify** | Add lang fetch, import + render NutritionClientPage, remove direct JSX render |
| `lib/i18n/clientTranslations.ts` | **Modify** | Add 3 `nutrition.tab.*` keys |
| `CHANGELOG.md` | **Modify** | Log the change |

---

## Task 1 — Add i18n tab keys

**Files:**
- Modify: `lib/i18n/clientTranslations.ts`

- [ ] **Step 1: Add 3 tab keys after the existing nutrition block**

Open `lib/i18n/clientTranslations.ts`. Find line:
```ts
  'nutrition.recommendations': { fr: 'Recommandations',     en: 'Recommendations',      es: 'Recomendaciones' },
```

Add immediately after:
```ts
  'nutrition.tab.aujourd_hui': { fr: "Aujourd'hui", en: 'Today',    es: 'Hoy'        },
  'nutrition.tab.tendances':   { fr: 'Tendances',   en: 'Trends',   es: 'Tendencias' },
  'nutrition.tab.protocole':   { fr: 'Protocole',   en: 'Protocol', es: 'Protocolo'  },
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors (or same pre-existing errors as before).

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/clientTranslations.ts
git commit -m "feat(nutrition): add tab i18n keys (aujourd_hui / tendances / protocole)"
```

---

## Task 2 — Create NutritionClientPage.tsx

**Files:**
- Create: `app/client/nutrition/NutritionClientPage.tsx`

- [ ] **Step 1: Create the file with full content**

```tsx
'use client'

import { useState } from 'react'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import MacroWeekGrid from '@/components/client/smart/MacroWeekGrid'
import ProtocolRationale from '@/components/client/smart/ProtocolRationale'
import NutritionMealsList from '@/components/client/smart/NutritionMealsList'
import NutritionStreakCard from '@/components/client/smart/NutritionStreakCard'
import TdeeChart from '@/components/client/smart/TdeeChart'
import VoiceEntryFab from '@/components/client/smart/VoiceEntryFab'
import { ct, type ClientLang } from '@/lib/i18n/clientTranslations'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'

type DayPoint = {
  date: string
  consumed: number
  protein_g: number
  carbs_g: number
  fat_g: number
  target: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

type Tab = 'aujourd_hui' | 'tendances' | 'protocole'

interface Props {
  date: string
  target: NutritionMacros
  consumed: NutritionMacros
  meals: NutritionMeal[]
  alerts: GenericAlert[]
  trend: DayPoint[]
  loggedDates: Set<string>
  tdeeAdaptive: number | null
  tdeeDataSource: string | null
  bodyWeightKg: number | null
  protocolDay: { name?: string } | null
  lang: ClientLang
  dayTypeBadge: React.ReactNode
}

const TABS: { id: Tab; labelKey: string }[] = [
  { id: 'aujourd_hui', labelKey: 'nutrition.tab.aujourd_hui' },
  { id: 'tendances',   labelKey: 'nutrition.tab.tendances'   },
  { id: 'protocole',   labelKey: 'nutrition.tab.protocole'   },
]

export default function NutritionClientPage({
  date, target, consumed, meals, alerts, trend,
  loggedDates, tdeeAdaptive, tdeeDataSource, bodyWeightKg,
  protocolDay, lang, dayTypeBadge,
}: Props) {
  const [tab, setTab] = useState<Tab>('aujourd_hui')

  return (
    <div className="min-h-screen bg-[#080808] font-sans pb-32">
      <ClientTopBar section={ct(lang, 'nutrition.section')} title={date} right={dayTypeBadge} />

      <main className="max-w-[480px] mx-auto px-4 pt-[88px] flex flex-col gap-3">

        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          {TABS.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-[#f2f2f2] text-[#080808] shadow-sm font-barlow-condensed font-bold uppercase tracking-wide'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {ct(lang, labelKey)}
            </button>
          ))}
        </div>

        {/* ══ AUJOURD'HUI ══ */}
        {tab === 'aujourd_hui' && (
          <>
            <SmartAlertsFeed alerts={alerts} />
            <SmartNutritionHero date={date} consumed={consumed} target={target} />
            <RemainingBreakdown consumed={consumed} target={target} />
            <NutritionMealsList initialMeals={meals} date={date} target={target} />
            <VoiceEntryFab lang={lang} />
          </>
        )}

        {/* ══ TENDANCES ══ */}
        {tab === 'tendances' && (
          <>
            <MacroWeekGrid trend={trend} />
            <TdeeChart />
            <NutritionStreakCard loggedDates={loggedDates} today={date} />
          </>
        )}

        {/* ══ PROTOCOLE ══ */}
        {tab === 'protocole' && (
          <ProtocolRationale
            tdee={tdeeAdaptive}
            tdeeSource={tdeeDataSource}
            target={target}
            bodyWeightKg={bodyWeightKg}
            dayName={protocolDay?.name ?? null}
          />
        )}

      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add app/client/nutrition/NutritionClientPage.tsx
git commit -m "feat(nutrition): add NutritionClientPage with 3-tab layout"
```

---

## Task 3 — Update page.tsx

**Files:**
- Modify: `app/client/nutrition/page.tsx`

- [ ] **Step 1: Add ClientLang import and NutritionClientPage import**

At the top of `app/client/nutrition/page.tsx`, replace:
```tsx
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { computeNutritionAlerts } from '@/lib/client/smart/nutritionAlerts'
import ClientTopBar from '@/components/client/ClientTopBar'
import SmartNutritionHero from '@/components/client/smart/SmartNutritionHero'
import SmartAlertsFeed, { type GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import RemainingBreakdown from '@/components/client/smart/RemainingBreakdown'
import MacroWeekGrid from '@/components/client/smart/MacroWeekGrid'
import ProtocolRationale from '@/components/client/smart/ProtocolRationale'
import NutritionMealsList from '@/components/client/smart/NutritionMealsList'
import NutritionStreakCard from '@/components/client/smart/NutritionStreakCard'
import TdeeChart from '@/components/client/smart/TdeeChart'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'
import VoiceEntryFab from '@/components/client/smart/VoiceEntryFab'
```

With:
```tsx
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { computeNutritionAlerts } from '@/lib/client/smart/nutritionAlerts'
import type { NutritionMacros } from '@/components/client/smart/SmartNutritionWidget'
import type { NutritionMeal } from '@/lib/nutrition/food-items'
import type { GenericAlert } from '@/components/client/smart/SmartAlertsFeed'
import { type ClientLang } from '@/lib/i18n/clientTranslations'
import NutritionClientPage from './NutritionClientPage'
```

- [ ] **Step 2: Add lang fetch to Promise.allSettled**

Find the `Promise.allSettled([` call. It currently has 6 entries ending with `streakResult`. Add a 7th entry for language preferences:

Replace:
```tsx
  const [protoResult, mealsResult, waterResult, weightResult, trendResult, streakResult] = await Promise.allSettled([
```

With:
```tsx
  const [protoResult, mealsResult, waterResult, weightResult, trendResult, streakResult, prefsResult] = await Promise.allSettled([
```

Then at the end of the `Promise.allSettled([...])` array, before the closing `])`, add a comma and this entry:

```tsx
    // Client language preference
    svc()
      .from('client_preferences')
      .select('language')
      .eq('client_id', clientId)
      .maybeSingle(),
```

- [ ] **Step 3: Resolve lang from prefsResult**

Find the line:
```tsx
  // Day type badge for TopBar
```

Add the lang computation before it:
```tsx
  // ── Language ──────────────────────────────────────────────────────────────
  const rawLang = prefsResult.status === 'fulfilled' ? (prefsResult.value as any)?.data?.language : null
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? (rawLang as ClientLang) : 'fr'
```

- [ ] **Step 4: Replace the return block**

Replace the entire `return (` block (lines 220–245, from `return (` to the closing `</>`) with:

```tsx
  return (
    <NutritionClientPage
      date={date}
      target={target}
      consumed={consumed}
      meals={meals}
      alerts={alerts}
      trend={trend}
      loggedDates={loggedDatesSet}
      tdeeAdaptive={tdeeAdaptive}
      tdeeDataSource={tdeeDataSource}
      bodyWeightKg={bodyWeightKg}
      protocolDay={protocolDay}
      lang={lang}
      dayTypeBadge={dayTypeBadge}
    />
  )
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 6: Commit**

```bash
git add app/client/nutrition/page.tsx
git commit -m "feat(nutrition): wire page.tsx to NutritionClientPage, add lang fetch"
```

---

## Task 4 — CHANGELOG + final check

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add CHANGELOG entry**

Open `CHANGELOG.md`. Find or create today's `## 2026-05-21` section. Add at the top:

```
FEATURE: Add 3-tab navigation to /client/nutrition (Aujourd'hui / Tendances / Protocole)
```

- [ ] **Step 2: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for nutrition tab navigation"
```
