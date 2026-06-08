# Coach IA Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permanent Coach IA chat button to the client PWA TopBar that opens a bottom sheet with a GPT-4o mini assistant aware of the client's current day (nutrition, workout, check-ins, profile).

**Architecture:** Bottom sheet (`CoachAIChatSheet`) triggered from a button in `ClientTopBar`. Two API routes: `GET /api/client/ai-coach/context` (returns remaining messages count) and `POST /api/client/ai-coach/chat` (builds system prompt server-side, calls OpenAI, returns reply). Rate limit enforced via `ai_coach_daily_usage` Supabase table. No message persistence — session-only state in React.

**Tech Stack:** Next.js App Router, TypeScript strict, Supabase (auth + service role), OpenAI SDK (`openai` npm — already installed for voice-parse), Zod, Framer Motion, Tailwind DS v3.0.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/20260521_ai_coach_daily_usage.sql` | Create | Table + RLS for per-client daily message count |
| `lib/client/ai-coach/buildSystemPrompt.ts` | Create | Pure function: fetch all context data → return system prompt string |
| `app/api/client/ai-coach/context/route.ts` | Create | GET: auth + resolve client_id + return remaining messages |
| `app/api/client/ai-coach/chat/route.ts` | Create | POST: auth + rate limit + build system prompt + call OpenAI + upsert usage |
| `components/client/CoachAIChatSheet.tsx` | Create | Full bottom sheet UI: messages, suggestions, input, typing indicator |
| `components/client/CoachAIButton.tsx` | Create | TopBar button — owns sheet open/close state |
| `components/client/ConditionalClientShell.tsx` | Modify | Add `<CoachAIButton />` fixed top-right on all authenticated pages |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260521_ai_coach_daily_usage.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/20260521_ai_coach_daily_usage.sql

CREATE TABLE IF NOT EXISTS ai_coach_daily_usage (
  client_id uuid NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, date)
);

-- RLS: client can read their own row; no direct writes (service role only)
ALTER TABLE ai_coach_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_read_own_usage"
  ON ai_coach_daily_usage
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM coach_clients WHERE user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply migration via Supabase Dashboard**

Open Supabase Dashboard → SQL Editor → paste and run the migration above.
Verify: table `ai_coach_daily_usage` appears in Table Editor with 3 columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260521_ai_coach_daily_usage.sql
git commit -m "schema: add ai_coach_daily_usage table for per-client daily message rate limiting"
```

---

## Task 2: System Prompt Builder

**Files:**
- Create: `lib/client/ai-coach/buildSystemPrompt.ts`

Pure async function. Fetches all context data and returns the system prompt string. Called server-side only — never exposed to the client browser.

- [ ] **Step 1: Create the file**

```typescript
// lib/client/ai-coach/buildSystemPrompt.ts
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function pct(val: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((val / total) * 100)}%`
}

function fmtDate(date: string): string {
  const [, m, d] = date.split('-')
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export async function buildSystemPrompt(clientId: string): Promise<string> {
  const db = svc()
  const today = computePhysiologicalDate(new Date())
  const dayStart = `${today}T00:00:00Z`
  const dayEnd = `${today}T23:59:59Z`
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const [
    clientRow,
    nutritionProtocol,
    mealsResult,
    waterResult,
    sessionResult,
    activitiesResult,
    restrictionsResult,
  ] = await Promise.allSettled([
    db.from('coach_clients')
      .select('first_name, goal, tdee, fitness_level')
      .eq('id', clientId)
      .single(),
    db.from('nutrition_protocols')
      .select('name, nutrition_protocol_days(calories, protein_g, fat_g, carbs_g)')
      .eq('client_id', clientId)
      .eq('status', 'shared')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('nutrition_meals')
      .select('meal_type, title, logged_at, calories, protein_g, fat_g, carbs_g')
      .eq('client_id', clientId)
      .eq('physiological_date', today)
      .neq('meal_type', 'drinks')
      .order('logged_at', { ascending: true }),
    db.from('client_water_logs')
      .select('amount_ml')
      .eq('client_id', clientId)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd),
    db.from('client_session_logs')
      .select('id, completed_at')
      .eq('client_id', clientId)
      .not('completed_at', 'is', null)
      .gte('completed_at', dayStart)
      .lte('completed_at', dayEnd)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('client_activity_logs')
      .select('activity_type, custom_label, duration_min')
      .eq('client_id', clientId)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd),
    db.from('metric_annotations')
      .select('label, body_part, severity')
      .eq('client_id', clientId)
      .eq('event_type', 'injury')
      .not('body_part', 'is', null),
  ])

  // ── Profile ───────────────────────────────────────────────────────────────
  const profile = clientRow.status === 'fulfilled' ? clientRow.value.data : null
  const firstName = profile?.first_name ?? 'le client'
  const goal = profile?.goal ?? 'non renseigné'
  const tdee = profile?.tdee ?? 0
  const fitnessLevel = profile?.fitness_level ?? 'intermédiaire'

  // ── Macros targets ────────────────────────────────────────────────────────
  const protocol = nutritionProtocol.status === 'fulfilled' ? nutritionProtocol.value.data : null
  const protocolDay = (protocol as any)?.nutrition_protocol_days?.[0]
  const targetKcal: number = protocolDay?.calories ?? tdee
  const targetProtein: number = protocolDay?.protein_g ?? 0
  const targetFat: number = protocolDay?.fat_g ?? 0
  const targetCarbs: number = protocolDay?.carbs_g ?? 0

  // ── Today nutrition ───────────────────────────────────────────────────────
  const meals = mealsResult.status === 'fulfilled' ? (mealsResult.value.data ?? []) : []
  const totalKcal = meals.reduce((s, m) => s + Number(m.calories ?? 0), 0)
  const totalProtein = meals.reduce((s, m) => s + Number(m.protein_g ?? 0), 0)
  const totalFat = meals.reduce((s, m) => s + Number(m.fat_g ?? 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + Number(m.carbs_g ?? 0), 0)

  const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Petit-déjeuner', lunch: 'Déjeuner',
    dinner: 'Dîner', snack: 'Collation',
  }
  const mealsLines = meals.length > 0
    ? meals.map(m => {
        const time = new Date(m.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const label = m.title ?? MEAL_LABELS[m.meal_type as string] ?? 'Repas'
        return `  - ${time} ${label}: ${Math.round(Number(m.calories ?? 0))} kcal`
      }).join('\n')
    : '  - Aucun repas loggé'

  // ── Water ─────────────────────────────────────────────────────────────────
  const water = waterResult.status === 'fulfilled' ? (waterResult.value.data ?? []) : []
  const totalWaterMl = water.reduce((s, w) => s + Number(w.amount_ml ?? 0), 0)
  const targetWaterMl = 2500

  // ── Session ───────────────────────────────────────────────────────────────
  const session = sessionResult.status === 'fulfilled' ? sessionResult.value.data : null
  const sessionLine = session
    ? `Séance complétée à ${new Date(session.completed_at as string).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : "Aucune séance aujourd'hui"

  // ── Activities ────────────────────────────────────────────────────────────
  const activities = activitiesResult.status === 'fulfilled' ? (activitiesResult.value.data ?? []) : []
  const activitiesLine = activities.length > 0
    ? activities.map(a => `  - ${a.custom_label ?? a.activity_type} ${a.duration_min}min`).join('\n')
    : '  Aucune'

  // ── Restrictions ──────────────────────────────────────────────────────────
  const restrictions = restrictionsResult.status === 'fulfilled' ? (restrictionsResult.value.data ?? []) : []
  const restrictionsLine = restrictions.length > 0
    ? restrictions.map(r => `${r.label ?? r.body_part} (${r.severity})`).join(', ')
    : 'aucune'

  return `Tu es le Coach IA de ${firstName}. Tu connais sa journée en détail.
Réponds en 3 à 5 lignes maximum. Uniquement nutrition, récupération, entraînement du jour.
Si la question est hors scope, réponds : "Je suis ton coach du quotidien — pose-moi une question sur ta journée, ta nutrition ou ta récupération."
Langue : français. Ton : direct, bienveillant, factuel. Ne donne jamais de conseils médicaux.

[PROFIL]
Prénom: ${firstName}
Objectif: ${goal} | TDEE: ${tdee} kcal | Cible: ${targetKcal} kcal
Macros cibles: P ${targetProtein}g / L ${targetFat}g / G ${targetCarbs}g
Niveau: ${fitnessLevel}
Restrictions physiques: ${restrictionsLine}

[JOURNÉE DU ${fmtDate(today)}]
Heure actuelle: ${nowTime}

Nutrition: ${Math.round(totalKcal)} kcal / ${targetKcal} cible (${pct(totalKcal, targetKcal)})
  Protéines: ${Math.round(totalProtein)}g / ${targetProtein}g
  Lipides: ${Math.round(totalFat)}g / ${targetFat}g
  Glucides: ${Math.round(totalCarbs)}g / ${targetCarbs}g
Repas:
${mealsLines}

Eau: ${totalWaterMl}ml / ${targetWaterMl}ml (${pct(totalWaterMl, targetWaterMl)})

Séance: ${sessionLine}

Activités libres:
${activitiesLine}`
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/client/ai-coach/buildSystemPrompt.ts
git commit -m "feat(ai-coach): add buildSystemPrompt — fetches client day + profile context server-side only"
```

---

## Task 3: GET /api/client/ai-coach/context

**Files:**
- Create: `app/api/client/ai-coach/context/route.ts`

Returns `{ remainingMessages, clientName, contextReady }`. Does NOT return the system prompt. Called once on sheet open.

- [ ] **Step 1: Create the route**

```typescript
// app/api/client/ai-coach/context/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

const DAILY_LIMIT = 20

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await resolveClientFromUser(
    user.id,
    user.email,
    svc(),
    'id, first_name'
  )
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = computePhysiologicalDate(new Date())
  const { data: usage } = await svc()
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', client.id)
    .eq('date', today)
    .maybeSingle()

  const used = usage?.message_count ?? 0
  const remaining = Math.max(0, DAILY_LIMIT - used)

  return NextResponse.json({
    remainingMessages: remaining,
    clientName: client.first_name ?? 'toi',
    contextReady: true,
  })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/client/ai-coach/context/route.ts
git commit -m "feat(ai-coach): add GET /api/client/ai-coach/context — returns remaining daily messages"
```

---

## Task 4: POST /api/client/ai-coach/chat

**Files:**
- Create: `app/api/client/ai-coach/chat/route.ts`

Core route: auth → rate limit → build system prompt → call OpenAI → upsert usage → return reply.

- [ ] **Step 1: Create the route**

```typescript
// app/api/client/ai-coach/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import OpenAI from 'openai'
import { computePhysiologicalDate } from '@/lib/nutrition/physiological-date'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { buildSystemPrompt } from '@/lib/client/ai-coach/buildSystemPrompt'

const DAILY_LIMIT = 20
const MAX_HISTORY = 20  // 10 exchanges × 2 messages each

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(500),
  })).max(MAX_HISTORY),
})

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await resolveClientFromUser(user.id, user.email, svc(), 'id, first_name')
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Validate body ─────────────────────────────────────────────────────────
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { messages } = parsed.data

  // ── Rate limit ────────────────────────────────────────────────────────────
  const today = computePhysiologicalDate(new Date())
  const { data: usage } = await svc()
    .from('ai_coach_daily_usage')
    .select('message_count')
    .eq('client_id', client.id)
    .eq('date', today)
    .maybeSingle()

  const currentCount = usage?.message_count ?? 0
  if (currentCount >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'limit_reached', remaining: 0 }, { status: 429 })
  }

  // ── Build system prompt (server-side only, never returned to client) ───────
  let systemPrompt: string
  try {
    systemPrompt = await buildSystemPrompt(client.id as string)
  } catch {
    return NextResponse.json({ error: 'Context unavailable' }, { status: 500 })
  }

  // ── Call OpenAI ───────────────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let reply: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    })
    reply = completion.choices[0]?.message?.content ?? "Désolé, je n'ai pas pu générer une réponse."
  } catch {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 })
  }

  // ── Upsert usage ──────────────────────────────────────────────────────────
  await svc()
    .from('ai_coach_daily_usage')
    .upsert(
      { client_id: client.id, date: today, message_count: currentCount + 1 },
      { onConflict: 'client_id,date' }
    )

  const remaining = Math.max(0, DAILY_LIMIT - (currentCount + 1))
  return NextResponse.json({ reply, remaining })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/client/ai-coach/chat/route.ts
git commit -m "feat(ai-coach): add POST /api/client/ai-coach/chat — rate limit + GPT-4o-mini + upsert usage"
```

---

## Task 5: CoachAIChatSheet Component

**Files:**
- Create: `components/client/CoachAIChatSheet.tsx`

Full bottom sheet UI. Receives `open`, `onClose`, `clientName`, `initialRemaining` props. Manages all conversation state internally.

- [ ] **Step 1: Create the component**

```typescript
// components/client/CoachAIChatSheet.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  open: boolean
  onClose: () => void
  clientName: string
  initialRemaining: number
}

const QUICK_SUGGESTIONS = [
  'Il me reste des calories ce soir',
  'Comment récupérer après ma séance ?',
  'Mon eau est insuffisante, que faire ?',
]

export default function CoachAIChatSheet({ open, onClose, clientName, initialRemaining }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset conversation when sheet opens
  useEffect(() => {
    if (open) {
      setMessages([{
        role: 'assistant',
        content: `Salut ${clientName} ! Je connais ta journée d'aujourd'hui. Comment puis-je t'aider ?`,
      }])
      setShowSuggestions(true)
      setInput('')
      setRemaining(initialRemaining)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, clientName, initialRemaining])

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || remaining <= 0) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setShowSuggestions(false)
    setLoading(true)

    // Keep last 10 exchanges (20 messages) for the API call
    const historyForApi = newMessages.slice(-20)

    try {
      const res = await fetch('/api/client/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Tu as atteint tes 20 messages du jour. Reviens demain !',
        }])
        setRemaining(0)
        return
      }

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Réessaie dans quelques instants.',
        }])
        return
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setRemaining(data.remaining)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Pas de connexion. Vérifie ton réseau et réessaie.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isLimitReached = remaining <= 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#161616] rounded-t-2xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ffe01e]" />
                <span className="text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white">
                  Coach IA
                </span>
                <span className="text-[10px] text-white/30 font-barlow ml-1">
                  Contexte du jour chargé
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white/60 hover:bg-white/[0.10] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages scroll area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[14px] font-barlow leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#ffe01e] text-[#0d0d0d] rounded-2xl rounded-tr-lg'
                        : 'bg-white/[0.06] text-white rounded-2xl rounded-tl-lg'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] rounded-2xl rounded-tl-lg px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-white/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick suggestions — visible only before first user message */}
              {showSuggestions && messages.length === 1 && (
                <div className="flex flex-col gap-2 mt-1">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="self-start text-[13px] font-barlow px-3 py-1.5 rounded-xl border border-[#ffe01e]/30 bg-[#ffe01e]/10 text-[#ffe01e] hover:bg-[#ffe01e]/20 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLimitReached || loading}
                  maxLength={500}
                  placeholder={isLimitReached ? 'Limite atteinte — reviens demain' : 'Tape ton message...'}
                  className="flex-1 min-w-0 bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] font-barlow text-white placeholder:text-white/30 outline-none focus:border-white/20 disabled:opacity-40 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || isLimitReached}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffe01e] text-[#0d0d0d] disabled:opacity-30 transition-opacity"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-right text-[10px] text-white/30 mt-1.5 font-barlow">
                {remaining}/20 messages restants
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/client/CoachAIChatSheet.tsx
git commit -m "feat(ai-coach): add CoachAIChatSheet — DS v3.0 bottom sheet, messages, suggestions, typing dots"
```

---

## Task 6: CoachAIButton Component

**Files:**
- Create: `components/client/CoachAIButton.tsx`

Owns open/close state and fetches `remainingMessages` + `clientName` lazily on first open.

- [ ] **Step 1: Create the component**

```typescript
// components/client/CoachAIButton.tsx
'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import CoachAIChatSheet from './CoachAIChatSheet'

export default function CoachAIButton() {
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState('toi')
  const [remaining, setRemaining] = useState(20)
  const [loaded, setLoaded] = useState(false)

  async function handleOpen() {
    if (!loaded) {
      try {
        const res = await fetch('/api/client/ai-coach/context')
        if (res.ok) {
          const data = await res.json()
          setClientName(data.clientName ?? 'toi')
          setRemaining(data.remainingMessages ?? 20)
        }
      } catch {
        // Fallback: open with defaults
      }
      setLoaded(true)
    }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Ouvrir Coach IA"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.10] text-[#0d0d0d] hover:bg-black/[0.18] active:scale-95 transition-all"
      >
        <MessageCircle size={16} />
      </button>

      <CoachAIChatSheet
        open={open}
        onClose={() => setOpen(false)}
        clientName={clientName}
        initialRemaining={remaining}
      />
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/client/CoachAIButton.tsx
git commit -m "feat(ai-coach): add CoachAIButton — lazy context fetch on first open"
```

---

## Task 7: Wire CoachAIButton into Client Shell

**Files:**
- Modify: `components/client/ConditionalClientShell.tsx`

Add `CoachAIButton` as a fixed-position element inside the authenticated shell (non-auth paths only). Positioned `top-3 right-4` to align with the TopBar right slot.

- [ ] **Step 1: Edit ConditionalClientShell**

Open `components/client/ConditionalClientShell.tsx`. Add the import and the fixed button div:

```typescript
// components/client/ConditionalClientShell.tsx
'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import OnboardingTour from './OnboardingTour'
import { TourProvider } from './TourContext'
import CoachAIButton from './CoachAIButton'

const AUTH_PATHS = [
  '/client/login',
  '/client/set-password',
  '/client/auth',
  '/client/access',
  '/client/onboarding',
  '/client/checkin/onboarding',
  '/client/acces-suspendu',
  '/client/programme/session/',
  '/client/nutrition/log',
]

interface Props {
  children: React.ReactNode
}

export default function ConditionalClientShell({ children }: Props) {
  const pathname = usePathname()
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (isAuthPath) {
    return <>{children}</>
  }

  return (
    <TourProvider>
      <div className="pb-24" style={{ paddingBottom: 'max(104px, calc(64px + env(safe-area-inset-bottom) + 16px))' }}>
        {children}
      </div>
      {/* Coach IA button — fixed in TopBar right slot on all authenticated pages */}
      <div className="fixed top-3 right-4 z-[50]">
        <CoachAIButton />
      </div>
      <BottomNav />
      <OnboardingTour />
    </TourProvider>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Visual verification in browser**

Start dev server:
```bash
npm run dev
```

Navigate to `/client` (home). Verify:
1. `MessageCircle` button appears top-right on `/client` home
2. Button present on `/client/nutrition`, `/client/profil`, `/client/bilans`
3. Button absent on `/client/programme/session/[id]` (listed in AUTH_PATHS)
4. Tap button → sheet slides up with welcome message + 3 yellow suggestion chips
5. Tap a suggestion → message sent, chips disappear, typing dots appear, reply shown
6. Counter shows "19/20 messages restants" after first send
7. Close button dismisses sheet correctly

- [ ] **Step 4: Commit**

```bash
git add components/client/ConditionalClientShell.tsx
git commit -m "feat(ai-coach): wire CoachAIButton into ConditionalClientShell — visible on all authenticated client pages"
```

---

## Task 8: CHANGELOG + project-state

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `.claude/rules/project-state.md`

- [ ] **Step 1: Update CHANGELOG.md**

Add at top of today's date section in `CHANGELOG.md`:

```
FEATURE: Add Coach IA chat — GPT-4o mini bottom sheet, day context (nutrition/séance/profil), 20 msg/day limit
SCHEMA: Add ai_coach_daily_usage table — per-client daily message rate limiting
```

- [ ] **Step 2: Update project-state.md**

In the "Modules Core Status" table, add row:
```
| **Coach IA Chat** | ✅ Phase 1 — bottom sheet GPT-4o mini, contexte jour+profil, 20 msg/jour | 2026-05-21 |
```

In "Dernières Avancées", add section:
```markdown
### 2026-05-21 — Coach IA Chat

- `supabase/migrations/20260521_ai_coach_daily_usage.sql` — rate limit table (client_id + date + message_count), RLS client read-only
- `lib/client/ai-coach/buildSystemPrompt.ts` — construit system prompt côté serveur (profil + journée complète, jamais exposé au client)
- `app/api/client/ai-coach/context/route.ts` — GET, retourne remaining + clientName
- `app/api/client/ai-coach/chat/route.ts` — POST, rate limit DB + GPT-4o-mini (max_tokens 300) + upsert usage
- `components/client/CoachAIChatSheet.tsx` — bottom sheet DS v3.0, bulles jaune user / blanc assistant, suggestions rapides, typing dots animés
- `components/client/CoachAIButton.tsx` — bouton `MessageCircle` TopBar, lazy context fetch au 1er open
- `components/client/ConditionalClientShell.tsx` — injection `CoachAIButton` fixed `top-3 right-4 z-[50]`
- Points de vigilance : migration à appliquer manuellement via Supabase Dashboard ; `OPENAI_API_KEY` déjà présente
```

In "Points de Vigilance" table, add:
```
| `20260521_ai_coach_daily_usage` migration non appliquée | Rate limit non fonctionnel (pas de table) | Appliquer via Supabase Dashboard |
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md .claude/rules/project-state.md
git commit -m "docs: update CHANGELOG and project-state for Coach IA chat"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Button `MessageCircle` in TopBar, all `/client` pages | Task 6 + 7 |
| GET `/api/client/ai-coach/context` | Task 3 |
| POST `/api/client/ai-coach/chat` | Task 4 |
| System prompt: profil + journée (server-side only) | Task 2 |
| Rate limit 20 msg/day, `ai_coach_daily_usage` table | Task 1 + 4 |
| Session-only messages (no DB persist) | Task 5 — React state only |
| Quick suggestions disappear after 1st message | Task 5 — `showSuggestions` state |
| Typing indicator (3 dots) | Task 5 — animated `motion.div` |
| Limit-reached: bubble + input disabled | Task 5 — `isLimitReached` |
| DS v3.0 tokens (`#161616`, `#ffe01e`, `rounded-2xl`) | Task 5 — all tokens applied |
| Max 500 chars input | Task 4 (Zod) + Task 5 (`maxLength`) |
| Max 10 exchanges history capped | Task 4 (`MAX_HISTORY=20`) + Task 5 (`slice(-20)`) |
| `OPENAI_API_KEY` reuse, no new env var | Task 4 |
| Physiological date reset at 04:00 | Task 3 + 4 (`computePhysiologicalDate`) |

**Type consistency:**
- `buildSystemPrompt(clientId: string): Promise<string>` defined Task 2, called Task 4 ✅
- `CoachAIChatSheet` props `{ open, onClose, clientName, initialRemaining }` defined Task 5, used Task 6 ✅
- `Message` interface `{ role: 'user' | 'assistant', content: string }` — matches Zod schema in Task 4 ✅
- `ai_coach_daily_usage` PK `(client_id, date)` — upsert `onConflict: 'client_id,date'` matches Task 1 schema ✅

**No placeholders.** ✅
