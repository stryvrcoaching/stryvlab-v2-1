# Client Profil — Accordion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte complète de `/client/profil` avec un hero compact, 7 sections accordion (une seule ouverte à la fois, Framer Motion), et une nouvelle section "Données corporelles" affichant poids/composition/mesures/photos morpho depuis les bilans.

**Architecture:** `ProfilAccordion` (client component) gère l'état `openSection` central + passe callbacks aux sections enfants. `BodyDataSection` est un nouveau client component qui fetch `/api/client/body-data` (nouvelle route). Les composants existants (ProfileForm, NotificationsPanel, etc.) sont réutilisés sans modification structurelle.

**Tech Stack:** Next.js App Router, TypeScript strict, Framer Motion (AnimatePresence), Tailwind DS v3.0, Supabase service role.

---

## File Map

| Action | Fichier | Rôle |
|--------|---------|------|
| Modify | `app/client/profil/page.tsx` | Server Component — hero + fetch body data + passe props à ProfilAccordion |
| Create | `components/client/profile/ProfilAccordion.tsx` | Client component — état openSection + 7 sections accordion |
| Create | `components/client/profile/AccordionSection.tsx` | Composant réutilisable — header cliquable + AnimatePresence contenu |
| Create | `components/client/profile/BodyDataSection.tsx` | Section données corporelles — sparkline poids + comp + mesures + photos morpho |
| Create | `app/api/client/body-data/route.ts` | GET — agrège bilans récents pour le client connecté |
| Modify | `components/client/profile/NotificationsPanel.tsx` | Ajoute `max-h-64 overflow-y-auto` sur la liste de notifs |
| Modify | `lib/i18n/clientTranslations.ts` | Nouvelles clés i18n pour body data section |

---

## Task 1 — API route `/api/client/body-data`

**Files:**
- Create: `app/api/client/body-data/route.ts`

Cette route agrège depuis `assessment_submissions` + `assessment_responses` les séries poids, composition corporelle, et mesures pour le client connecté.

- [ ] **Step 1: Créer la route**

```typescript
// app/api/client/body-data/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

const WEIGHT_KEY = 'weight_kg'
const BODY_COMP_KEYS = ['body_fat_pct', 'lean_mass_kg', 'muscle_mass_kg']
const MEASURE_KEYS = ['waist_cm', 'hips_cm', 'arm_cm', 'chest_cm']

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user.id, user.email, service, 'id')
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data: submissions } = await service
    .from('assessment_submissions')
    .select('id, bilan_date, submitted_at, assessment_responses(field_key, value_number)')
    .eq('client_id', (client as any).id)
    .eq('status', 'completed')
    .order('bilan_date', { ascending: true })
    .limit(20)

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ weightSeries: [], composition: null, measures: null, latest: null })
  }

  // Build series
  const weightSeries: { date: string; value: number }[] = []
  const latestValues: Record<string, number> = {}

  for (const sub of submissions) {
    const date = sub.bilan_date ?? sub.submitted_at?.split('T')[0] ?? ''
    const responses = (sub as any).assessment_responses as { field_key: string; value_number: number | null }[]
    if (!responses) continue

    for (const r of responses) {
      if (r.value_number == null) continue
      if (r.field_key === WEIGHT_KEY) {
        weightSeries.push({ date, value: r.value_number })
      }
      latestValues[r.field_key] = r.value_number
    }
  }

  const composition = {
    body_fat_pct: latestValues['body_fat_pct'] ?? null,
    lean_mass_kg: latestValues['lean_mass_kg'] ?? null,
    muscle_mass_kg: latestValues['muscle_mass_kg'] ?? null,
  }

  const measures = {
    waist_cm: latestValues['waist_cm'] ?? null,
    hips_cm: latestValues['hips_cm'] ?? null,
    arm_cm: latestValues['arm_cm'] ?? null,
    chest_cm: latestValues['chest_cm'] ?? null,
  }

  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].value : null

  return NextResponse.json({
    weightSeries,
    composition,
    measures,
    latestWeight,
  })
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "body-data" | head -10
```

Résultat attendu : aucune erreur sur ce fichier.

- [ ] **Step 3: Tester la route manuellement (si serveur tourne)**

```bash
curl -s http://localhost:3000/api/client/body-data | head -200
```

Résultat attendu : JSON `{ weightSeries, composition, measures, latestWeight }`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/client/body-data/route.ts"
git commit -m "feat(profil): add /api/client/body-data route — weight series + composition + measures"
```

---

## Task 2 — Nouvelles clés i18n

**Files:**
- Modify: `lib/i18n/clientTranslations.ts`

- [ ] **Step 1: Ajouter les clés dans le dictionnaire**

Ajouter après la ligne `'profil.days.plural'` (ligne ~236) :

```typescript
  // Body data section
  'profil.section.bodyData':      { fr: 'Données corporelles', en: 'Body data', es: 'Datos corporales' },
  'profil.body.weight':           { fr: 'Poids actuel', en: 'Current weight', es: 'Peso actual' },
  'profil.body.bodyFat':          { fr: '% Masse grasse', en: 'Body fat %', es: '% Grasa' },
  'profil.body.leanMass':         { fr: 'Masse maigre', en: 'Lean mass', es: 'Masa magra' },
  'profil.body.waist':            { fr: 'Tour de taille', en: 'Waist', es: 'Cintura' },
  'profil.body.hips':             { fr: 'Tour de hanches', en: 'Hips', es: 'Caderas' },
  'profil.body.arm':              { fr: 'Tour de bras', en: 'Arm', es: 'Brazo' },
  'profil.body.chest':            { fr: 'Tour de poitrine', en: 'Chest', es: 'Pecho' },
  'profil.body.noData':           { fr: 'Complète un bilan pour voir tes données corporelles.', en: 'Complete an assessment to see your body data.', es: 'Completa una evaluación para ver tus datos corporales.' },
  'profil.body.evolution':        { fr: 'Évolution du poids', en: 'Weight evolution', es: 'Evolución del peso' },
  'profil.body.composition':      { fr: 'Composition corporelle', en: 'Body composition', es: 'Composición corporal' },
  'profil.body.measures':         { fr: 'Mensurations', en: 'Measurements', es: 'Medidas' },
  'profil.body.photos':           { fr: 'Photos de transformation', en: 'Transformation photos', es: 'Fotos de transformación' },
  'profil.body.noPhotos':         { fr: 'Aucune photo enregistrée.', en: 'No photos recorded.', es: 'No hay fotos registradas.' },
  // Accordion sections
  'profil.section.restrictions':  { fr: 'Restrictions physiques', en: 'Physical restrictions', es: 'Restricciones físicas' },
  'profil.section.portions':      { fr: 'Portions visuelles', en: 'Visual portions', es: 'Porciones visuales' },
  'profil.section.progress':      { fr: 'Ma progression', en: 'My progress', es: 'Mi progreso' },
```

- [ ] **Step 2: Vérifier que les nouvelles clés sont bien typées**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "clientTranslations" | head -5
```

Résultat attendu : 0 erreurs sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/clientTranslations.ts
git commit -m "feat(profil): add i18n keys for body data section and accordion sections"
```

---

## Task 3 — `AccordionSection` component

**Files:**
- Create: `components/client/profile/AccordionSection.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// components/client/profile/AccordionSection.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface Props {
  id: string
  title: string
  icon: string
  badge?: number
  isOpen: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}

export default function AccordionSection({ id, title, icon, badge, isOpen, onToggle, children }: Props) {
  return (
    <div className="bg-[#161616] rounded-2xl border-[0.3px] border-white/[0.08] overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-[15px] shrink-0">{icon}</span>
        <span className="flex-1 text-[13px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/70">
          {title}
        </span>
        {badge != null && badge > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#ffe01e] text-[#0d0d0d] text-[10px] font-bold flex items-center justify-center shrink-0">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <ChevronDown size={16} className="text-white/30" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 border-t-[0.3px] border-white/[0.06]">
              <div className="pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "AccordionSection" | head -5
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3: Commit**

```bash
git add components/client/profile/AccordionSection.tsx
git commit -m "feat(profil): add AccordionSection component with Framer Motion"
```

---

## Task 4 — `BodyDataSection` component

**Files:**
- Create: `components/client/profile/BodyDataSection.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// components/client/profile/BodyDataSection.tsx
'use client'

import { useEffect, useState } from 'react'
import { useClientT } from '@/components/client/ClientI18nProvider'

interface WeightPoint { date: string; value: number }
interface Composition { body_fat_pct: number | null; lean_mass_kg: number | null; muscle_mass_kg: number | null }
interface Measures { waist_cm: number | null; hips_cm: number | null; arm_cm: number | null; chest_cm: number | null }

interface BodyData {
  weightSeries: WeightPoint[]
  composition: Composition
  measures: Measures
  latestWeight: number | null
}

interface MorphoPhoto {
  id: string
  photo_url: string
  created_at: string
}

function WeightSparkline({ series }: { series: WeightPoint[] }) {
  if (series.length < 2) return null
  const values = series.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 200
  const H = 48
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * W
    const y = H - ((p.value - min) / range) * (H - 8) - 4
    return `${x},${y}`
  }).join(' ')

  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  const color = delta <= 0 ? '#ffe01e' : '#ef4444'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/40">
          30j
        </span>
        <span className={`text-[11px] font-bold ${delta <= 0 ? 'text-[#ffe01e]' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {/* Last point dot */}
        {(() => {
          const last = series[series.length - 1]
          const x = W
          const y = H - ((last.value - min) / range) * (H - 8) - 4
          return <circle cx={x} cy={y} r="2.5" fill={color} />
        })()}
      </svg>
    </div>
  )
}

export default function BodyDataSection() {
  const { t } = useClientT()
  const [data, setData] = useState<BodyData | null>(null)
  const [photos, setPhotos] = useState<MorphoPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/client/body-data').then(r => r.ok ? r.json() : null),
      fetch('/api/morpho/photos').then(r => r.ok ? r.json() : { photos: [] }).catch(() => ({ photos: [] })),
    ]).then(([bodyData, morphoData]) => {
      setData(bodyData)
      setPhotos(morphoData?.photos?.slice(0, 4) ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const hasAnyData = data && (
    data.latestWeight != null ||
    data.composition.body_fat_pct != null ||
    data.composition.lean_mass_kg != null ||
    data.measures.waist_cm != null
  )

  if (!hasAnyData) {
    return (
      <p className="text-[12px] text-white/40 leading-relaxed py-2">
        {t('profil.body.noData')}
      </p>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Poids + sparkline ── */}
      {data!.latestWeight != null && (
        <div className="bg-white/[0.03] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/40">
              {t('profil.body.weight')}
            </span>
            <span className="text-[18px] font-black text-white leading-none">
              {data!.latestWeight} <span className="text-[12px] font-medium text-white/40">kg</span>
            </span>
          </div>
          {data!.weightSeries.length >= 2 && (
            <WeightSparkline series={data!.weightSeries} />
          )}
        </div>
      )}

      {/* ── Composition corporelle ── */}
      {(data!.composition.body_fat_pct != null || data!.composition.lean_mass_kg != null) && (
        <div>
          <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/30 mb-2">
            {t('profil.body.composition')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data!.composition.body_fat_pct != null && (
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <p className="text-[16px] font-black text-[#ffe01e] leading-none mb-1">
                  {data!.composition.body_fat_pct.toFixed(1)}%
                </p>
                <p className="text-[9px] font-medium text-white/40">{t('profil.body.bodyFat')}</p>
              </div>
            )}
            {data!.composition.lean_mass_kg != null && (
              <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                <p className="text-[16px] font-black text-white leading-none mb-1">
                  {data!.composition.lean_mass_kg.toFixed(1)} <span className="text-[10px] font-medium text-white/40">kg</span>
                </p>
                <p className="text-[9px] font-medium text-white/40">{t('profil.body.leanMass')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mensurations ── */}
      {(data!.measures.waist_cm != null || data!.measures.hips_cm != null || data!.measures.arm_cm != null) && (
        <div>
          <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/30 mb-2">
            {t('profil.body.measures')}
          </p>
          <div className="space-y-1.5">
            {([
              ['waist_cm', 'profil.body.waist'],
              ['hips_cm',  'profil.body.hips'],
              ['arm_cm',   'profil.body.arm'],
              ['chest_cm', 'profil.body.chest'],
            ] as const).map(([key, labelKey]) => {
              const val = data!.measures[key as keyof Measures]
              if (val == null) return null
              return (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-[12px] text-white/50">{t(labelKey)}</span>
                  <span className="text-[12px] font-bold text-white">{val} <span className="text-white/30 font-normal">cm</span></span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Photos morpho ── */}
      <div>
        <p className="text-[10px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white/30 mb-2">
          {t('profil.body.photos')}
        </p>
        {photos.length === 0 ? (
          <p className="text-[11px] text-white/30">{t('profil.body.noPhotos')}</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map(p => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.photo_url}
                alt=""
                className="w-20 h-20 rounded-xl object-cover shrink-0 border-[0.3px] border-white/[0.08]"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "BodyDataSection" | head -5
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3: Vérifier l'API `/api/morpho/photos` — format retourné**

```bash
grep -n "photos\|photo_url" "/Users/user/Desktop/STRYVLAB/app/api/morpho/photos/route.ts" | head -10
```

Si la structure est différente de `{ photos: [{ id, photo_url, created_at }] }`, ajuster le destructuring dans `useEffect`.

- [ ] **Step 4: Commit**

```bash
git add components/client/profile/BodyDataSection.tsx
git commit -m "feat(profil): add BodyDataSection — weight sparkline, composition, measures, morpho photos"
```

---

## Task 5 — Fix `NotificationsPanel` — liste scrollable

**Files:**
- Modify: `components/client/profile/NotificationsPanel.tsx`

Actuellement la liste de notifications se déroule à l'infini. On limite à `max-h-64 overflow-y-auto`.

- [ ] **Step 1: Modifier le container de la liste**

Dans `NotificationsPanel.tsx`, ligne ~101, remplacer :

```typescript
          <div className="flex flex-col gap-1">
```

par :

```typescript
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "NotificationsPanel" | head -5
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3: Commit**

```bash
git add components/client/profile/NotificationsPanel.tsx
git commit -m "fix(profil): cap notifications list at max-h-64 with scroll"
```

---

## Task 6 — `ProfilAccordion` orchestrateur

**Files:**
- Create: `components/client/profile/ProfilAccordion.tsx`

- [ ] **Step 1: Créer le composant**

```typescript
// components/client/profile/ProfilAccordion.tsx
'use client'

import { useState } from 'react'
import AccordionSection from './AccordionSection'
import ProfilePhotoUpload from './ProfilePhotoUpload'
import ProfileForm from './ProfileForm'
import PreferencesForm from './PreferencesForm'
import NotificationsPanel from './NotificationsPanel'
import PasswordResetButton from './PasswordResetButton'
import PortionScalingForm from './PortionScalingForm'
import BodyDataSection from './BodyDataSection'
import ClientRestrictionsSection from '@/components/client/ClientRestrictionsSection'
import ClientLogoutButton from '@/app/client/profil/LogoutButton'
import Link from 'next/link'
import { useClientT } from '@/components/client/ClientI18nProvider'

type SectionId =
  | 'info'
  | 'body'
  | 'restrictions'
  | 'portions'
  | 'progress'
  | 'notif'
  | 'prefs'
  | 'security'

interface Props {
  clientId: string
  profilePhotoUrl: string | null
  initials: string
  fullName: string
  email: string
  status: string | null
  memberSince: string
  profileInitial: {
    first_name: string
    last_name: string
    phone: string
    goal: string
    date_of_birth: string
    gender: string
    training_goal: string
    fitness_level: string
    sport_practice: string
    weekly_frequency: number | null
  }
  prefsInitial: {
    weight_unit: 'kg' | 'lbs'
    height_unit: 'cm' | 'ft'
    language: 'fr' | 'en' | 'es'
  }
  notifications: {
    id: string
    type: string
    message: string
    read: boolean
    created_at: string
  }[]
  notifPrefs: {
    notif_session_reminder: boolean
    notif_bilan_received: boolean
    notif_program_updated: boolean
  }
  unreadCount: number
  streak: {
    current_streak: number
    longest_streak: number
    total_points: number
    level: string
  } | null
}

const LEVEL_COLORS: Record<string, string> = {
  bronze:   'text-amber-400',
  silver:   'text-white/60',
  gold:     'text-yellow-400',
  platinum: 'text-cyan-400',
}

export default function ProfilAccordion({
  clientId,
  profilePhotoUrl,
  initials,
  fullName,
  email,
  status,
  memberSince,
  profileInitial,
  prefsInitial,
  notifications,
  notifPrefs,
  unreadCount,
  streak,
}: Props) {
  const { t } = useClientT()
  const [openSection, setOpenSection] = useState<SectionId | null>(null)

  function toggle(id: SectionId) {
    setOpenSection(prev => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── Hero compact ── */}
      <div className="bg-[#161616] rounded-2xl border-[0.3px] border-white/[0.08] p-4 flex items-center gap-4">
        <ProfilePhotoUpload
          currentUrl={profilePhotoUrl}
          initials={initials}
          compact
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-white truncate">{fullName}</p>
          <p className="text-[11px] text-white/40 truncate">{email}</p>
          {status && (
            <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
              status === 'active'
                ? 'bg-[#ffe01e]/15 text-[#ffe01e]'
                : 'bg-white/[0.06] text-white/40'
            }`}>
              {status === 'active' ? t('profil.status.active') : status}
            </span>
          )}
        </div>
        {streak && (
          <div className="text-right shrink-0">
            <p className="text-[18px] font-black text-[#ffe01e] leading-none">{streak.current_streak}</p>
            <p className="text-[9px] text-white/30 mt-0.5">streak</p>
          </div>
        )}
      </div>

      {/* ── Section 1 : Infos personnelles ── */}
      <AccordionSection
        id="info"
        title={t('profil.section.info')}
        icon="👤"
        isOpen={openSection === 'info'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <ProfileForm clientId={clientId} initial={profileInitial} />
      </AccordionSection>

      {/* ── Section 2 : Données corporelles ── */}
      <AccordionSection
        id="body"
        title={t('profil.section.bodyData')}
        icon="💪"
        isOpen={openSection === 'body'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <BodyDataSection />
      </AccordionSection>

      {/* ── Section 3 : Restrictions physiques ── */}
      <AccordionSection
        id="restrictions"
        title={t('profil.section.restrictions')}
        icon="🚫"
        isOpen={openSection === 'restrictions'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <ClientRestrictionsSection />
      </AccordionSection>

      {/* ── Section 4 : Portions visuelles ── */}
      <AccordionSection
        id="portions"
        title={t('profil.section.portions')}
        icon="🤚"
        isOpen={openSection === 'portions'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <PortionScalingForm />
      </AccordionSection>

      {/* ── Section 5 : Ma progression ── */}
      {streak && (
        <AccordionSection
          id="progress"
          title={t('profil.section.progress')}
          icon="🏆"
          isOpen={openSection === 'progress'}
          onToggle={(id) => toggle(id as SectionId)}
        >
          <ProgressionContent streak={streak} />
        </AccordionSection>
      )}

      {/* ── Section 6 : Notifications ── */}
      <AccordionSection
        id="notif"
        title={t('profil.section.notif')}
        icon="🔔"
        badge={unreadCount}
        isOpen={openSection === 'notif'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <NotificationsPanel notifications={notifications} preferences={notifPrefs} />
        <Link
          href="/client/checkin/schedule"
          className="mt-3 flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
        >
          <p className="text-[12px] text-white/60">{t('profil.configReminders')}</p>
          <p className="text-[10px] text-white/30">→</p>
        </Link>
      </AccordionSection>

      {/* ── Section 7 : Préférences ── */}
      <AccordionSection
        id="prefs"
        title={t('profil.section.prefs')}
        icon="⚙️"
        isOpen={openSection === 'prefs'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <PreferencesForm initial={prefsInitial} />
      </AccordionSection>

      {/* ── Section 8 : Sécurité ── */}
      <AccordionSection
        id="security"
        title={t('profil.section.security')}
        icon="🔒"
        isOpen={openSection === 'security'}
        onToggle={(id) => toggle(id as SectionId)}
      >
        <PasswordResetButton email={email} />
      </AccordionSection>

      {/* ── Déconnexion + mention ── */}
      <div className="pt-2 flex flex-col gap-3">
        <ClientLogoutButton />
        <p className="text-center text-[10px] text-white/20 pb-2">
          {t('profil.memberSince')} {memberSince}
        </p>
      </div>

    </div>
  )
}

function ProgressionContent({ streak }: { streak: { current_streak: number; longest_streak: number; total_points: number; level: string } }) {
  const { t } = useClientT()
  const levelColor = LEVEL_COLORS[streak.level] ?? LEVEL_COLORS.bronze
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[20px] font-black text-[#ffe01e] leading-none mb-1">{streak.current_streak}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('profil.streakCurrent')}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[20px] font-black text-white leading-none mb-1">{streak.total_points}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('profil.pointsTotal')}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className={`text-[13px] font-black leading-none mb-1 ${levelColor}`}>{streak.level}</p>
          <p className="text-[9.5px] font-medium text-white/40">{t('home.level')}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-white/40">{t('profil.recordStreak')}</p>
        <p className="text-[12px] font-bold text-white">{streak.longest_streak} {t('profil.days.plural')}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "ProfilAccordion" | head -10
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3: Commit**

```bash
git add components/client/profile/ProfilAccordion.tsx
git commit -m "feat(profil): add ProfilAccordion orchestrator — 8 accordion sections, one-open-at-a-time"
```

---

## Task 7 — Adapter `ProfilePhotoUpload` pour mode compact

**Files:**
- Modify: `components/client/profile/ProfilePhotoUpload.tsx`

Le composant doit accepter une prop `compact?: boolean` qui réduit la photo de 80px à 56px pour le hero.

- [ ] **Step 1: Lire le composant actuel**

```bash
cat /Users/user/Desktop/STRYVLAB/components/client/profile/ProfilePhotoUpload.tsx
```

- [ ] **Step 2: Ajouter la prop `compact`**

Localiser le container principal de l'image (chercher `w-20 h-20` ou `w-16 h-16` ou similaire). Ajouter la prop et conditionner les tailles :

```typescript
interface Props {
  currentUrl: string | null
  initials: string
  compact?: boolean
}

export default function ProfilePhotoUpload({ currentUrl, initials, compact = false }: Props) {
  // Dans le JSX, remplacer les classes de taille statiques par :
  // avatar container : compact ? 'w-14 h-14' : 'w-20 h-20'
  // texte initials : compact ? 'text-[16px]' : 'text-[22px]'
  // bouton caméra : si compact, masquer (hidden) ou réduire à w-5 h-5
```

Adapter selon ce que le fichier contient réellement (lire d'abord).

- [ ] **Step 3: Vérifier TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "ProfilePhotoUpload" | head -5
```

Résultat attendu : 0 erreurs.

- [ ] **Step 4: Commit**

```bash
git add components/client/profile/ProfilePhotoUpload.tsx
git commit -m "feat(profil): add compact prop to ProfilePhotoUpload for hero display"
```

---

## Task 8 — Refonte `page.tsx` — utiliser `ProfilAccordion`

**Files:**
- Modify: `app/client/profil/page.tsx`

Remplacer la page complète par une version épurée qui fetche les données côté serveur et passe tout à `ProfilAccordion`.

- [ ] **Step 1: Remplacer le contenu de page.tsx**

```typescript
// app/client/profil/page.tsx
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import ClientTopBar from "@/components/client/ClientTopBar";
import ProfilAccordion from "@/components/client/profile/ProfilAccordion";
import { ct, type ClientLang } from "@/lib/i18n/clientTranslations";

export const metadata = { title: "Mon profil" };

export default async function ClientProfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/client/login");

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const client = (await resolveClientFromUser(
    user.id,
    user.email,
    service,
    "id, first_name, last_name, email, phone, goal, date_of_birth, gender, training_goal, fitness_level, sport_practice, weekly_frequency, status, profile_photo_url, created_at",
  )) as any;

  const [{ data: prefs }, { data: notifData }, { data: streakData }] = await Promise.all([
    client
      ? service.from("client_preferences").select("*").eq("client_id", client.id).single()
      : Promise.resolve({ data: null }),
    service
      .from("client_notifications")
      .select("id, type, message, read, created_at")
      .eq("target_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      ? service.from("client_streaks").select("current_streak, longest_streak, total_points, level").eq("client_id", client.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const firstName = client?.first_name ?? "";
  const lastName  = client?.last_name ?? "";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || (user.email ?? "Client");

  const preferences = prefs ?? {
    weight_unit: "kg",
    height_unit: "cm",
    language: "fr",
    notif_session_reminder: true,
    notif_bilan_received: true,
    notif_program_updated: true,
  };

  const lang: ClientLang = ['fr', 'en', 'es'].includes(preferences.language as string)
    ? preferences.language as ClientLang
    : 'fr';
  const dateLocale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';

  const notifications = notifData ?? [];
  const unreadCount   = notifications.filter((n) => !n.read).length;

  const memberSince = new Date(client?.created_at ?? Date.now()).toLocaleDateString(
    dateLocale,
    { month: "long", year: "numeric" },
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] font-sans">
      <ClientTopBar
        section={ct(lang, 'profil.section')}
        title={ct(lang, 'profil.title')}
        right={
          <div className="w-8 h-8 rounded-full bg-[#ffe01e]/20 border-[0.3px] border-[#ffe01e]/30 flex items-center justify-center shrink-0 overflow-hidden">
            {client?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.profile_photo_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-[#ffe01e]">{initials}</span>
            )}
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-24">
        <ProfilAccordion
          clientId={client?.id ?? ""}
          profilePhotoUrl={client?.profile_photo_url ?? null}
          initials={initials}
          fullName={fullName}
          email={user.email ?? ""}
          status={client?.status ?? null}
          memberSince={memberSince}
          profileInitial={{
            first_name:       client?.first_name ?? "",
            last_name:        client?.last_name ?? "",
            phone:            client?.phone ?? "",
            goal:             client?.goal ?? "",
            date_of_birth:    client?.date_of_birth ?? "",
            gender:           client?.gender ?? "",
            training_goal:    client?.training_goal ?? "",
            fitness_level:    client?.fitness_level ?? "",
            sport_practice:   client?.sport_practice ?? "",
            weekly_frequency: client?.weekly_frequency ?? null,
          }}
          prefsInitial={{
            weight_unit: preferences.weight_unit as "kg" | "lbs",
            height_unit: preferences.height_unit as "cm" | "ft",
            language:    preferences.language as "fr" | "en" | "es",
          }}
          notifications={notifications}
          notifPrefs={{
            notif_session_reminder: preferences.notif_session_reminder,
            notif_bilan_received:   preferences.notif_bilan_received,
            notif_program_updated:  preferences.notif_program_updated,
          }}
          unreadCount={unreadCount}
          streak={streakData ?? null}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Supprimer les anciens helpers devenus inutiles dans page.tsx**

Les fonctions `Section`, `ProgressionSection`, et les imports `Link`, `ClientRestrictionsSection`, `PortionScalingForm`, `NotificationsPanel`, etc. doivent être retirés (ils sont maintenant dans `ProfilAccordion`). Le fichier page.tsx ne doit plus contenir de composants client ni de logique d'affichage.

- [ ] **Step 3: Vérifier TypeScript global**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : 0 nouvelles erreurs (les erreurs pré-existantes stripe/BodyFatCalculator sont acceptables).

- [ ] **Step 4: Commit**

```bash
git add app/client/profil/page.tsx
git commit -m "feat(profil): refactor page.tsx — Server Component passes all props to ProfilAccordion"
```

---

## Task 9 — CHANGELOG + project-state

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `.claude/rules/project-state.md`

- [ ] **Step 1: Mettre à jour CHANGELOG.md**

Ajouter en haut de `CHANGELOG.md` sous la date du jour :

```
## 2026-05-19

FEATURE: Client profil — refonte accordion (7 sections, une seule ouverte à la fois, Framer Motion)
FEATURE: Client profil — nouvelle section "Données corporelles" (poids sparkline, composition, mesures, photos morpho)
FEATURE: Client profil — hero compact avec avatar 56px + streak pill
FIX: Client profil — liste notifications limitée à max-h-64 avec scroll
```

- [ ] **Step 2: Mettre à jour project-state.md**

Ajouter une section `## 2026-05-19 — Client Profil — Accordion Redesign` avec les fichiers modifiés, les comportements clés, et les points de vigilance.

- [ ] **Step 3: Commit final**

```bash
git add CHANGELOG.md .claude/rules/project-state.md
git commit -m "docs: update changelog and project-state after profil accordion redesign"
```

---

## Points de vigilance

- `ProfilePhotoUpload` — lire le fichier avant d'ajouter la prop `compact` (Task 7) car la structure exacte est inconnue
- `ProfilAccordion` est `'use client'` → les imports de composants serveur (comme `ClientRestrictionsSection`) doivent être compatibles client; si `ClientRestrictionsSection` est Server Component, le wrapper `'use client'` de `ProfilAccordion` l'enveloppe automatiquement
- `/api/morpho/photos` — vérifier le format exact retourné (Task 4, Step 3) avant d'utiliser `morphoData.photos`
- DS v3.0 strict : `bg-[#161616]` pour surfaces, `rounded-2xl` pour cards principals, `rounded-xl` pour items internes, `#ffe01e` accent jaune, texte sur jaune = `#0d0d0d`
- La prop `compact` dans `ProfilePhotoUpload` doit rester optionnelle avec `default = false` pour ne pas casser l'usage existant dans la section accordion info
