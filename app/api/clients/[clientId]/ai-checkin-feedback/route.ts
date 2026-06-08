import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function openai() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

/**
 * POST /api/clients/[clientId]/ai-checkin-feedback
 *
 * Reads:
 *   - Last 7 days of check-in responses (stress, sleep, energy, RIR)
 *   - Last completed session (exercises, set_logs: reps/weight/rir)
 *   - Last 14 days weight trend (assessment_responses)
 *
 * GPT-4o generates a coach draft message (2–4 sentences, French, actionable).
 * Saved as coach_feedback entity_type='checkin'.
 * Coach reads → sends as-is or edits.
 *
 * Returns { feedback_id, body, raw }
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()

  const { data: cc } = await db
    .from('coach_clients')
    .select('id, first_name, last_name, training_goal, gender')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!cc) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const since7d  = new Date(Date.now() - 7  * 86400000).toISOString()
  const since14d = new Date(Date.now() - 14 * 86400000).toISOString()

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [checkinsRes, sessionRes, weightRes] = await Promise.allSettled([
    db.from('daily_checkin_responses')
      .select('moment, responses, responded_at')
      .eq('client_id', clientId)
      .gte('responded_at', since7d)
      .order('responded_at', { ascending: false })
      .limit(14),

    db.from('client_session_logs')
      .select(`id, completed_at, program_session_id,
        client_set_logs(exercise_name, set_number, reps_actual, weight_actual_kg, rir_actual)`)
      .eq('client_id', clientId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db.from('assessment_responses')
      .select('value_number, assessment_submissions!inner(submitted_at)')
      .eq('field_key', 'weight_kg')
      .eq('assessment_submissions.client_id', clientId)
      .gte('assessment_submissions.submitted_at', since14d)
      .order('assessment_submissions(submitted_at)', { ascending: true }),
  ])

  const checkins = checkinsRes.status === 'fulfilled' ? (checkinsRes.value.data ?? []) : []
  const session  = sessionRes.status  === 'fulfilled' ? sessionRes.value.data : null
  const weights  = weightRes.status   === 'fulfilled' ? (weightRes.value.data ?? []) : []

  if (checkins.length === 0) {
    return NextResponse.json({ error: 'Aucun check-in sur les 7 derniers jours.' }, { status: 422 })
  }

  // ── Build context string for GPT ─────────────────────────────────────────
  const firstName = cc.first_name ?? 'Client'
  const goal = cc.training_goal ?? 'non défini'

  // Aggregate check-in metrics
  const fields: Record<string, number[]> = {}
  for (const c of checkins) {
    const r = c.responses as Record<string, number>
    for (const [k, v] of Object.entries(r)) {
      if (typeof v !== 'number') continue
      if (!fields[k]) fields[k] = []
      fields[k].push(v)
    }
  }
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 'N/A'

  const checkinSummary = Object.entries(fields)
    .map(([k, v]) => `${k}: moy ${avg(v)} (${v.length} mesures, min ${Math.min(...v)}, max ${Math.max(...v)})`)
    .join('\n')

  // Last session summary
  let sessionSummary = 'Aucune séance complétée récemment.'
  if (session) {
    const sets = (session as any).client_set_logs ?? []
    const byEx: Record<string, { reps: number[]; weight: number[]; rir: number[] }> = {}
    for (const s of sets) {
      if (!byEx[s.exercise_name]) byEx[s.exercise_name] = { reps: [], weight: [], rir: [] }
      if (s.reps_actual) byEx[s.exercise_name].reps.push(s.reps_actual)
      if (s.weight_actual_kg) byEx[s.exercise_name].weight.push(s.weight_actual_kg)
      if (s.rir_actual != null) byEx[s.exercise_name].rir.push(s.rir_actual)
    }
    const lines = Object.entries(byEx).slice(0, 5).map(([ex, d]) => {
      const avgRir = d.rir.length ? avg(d.rir) : 'N/A'
      const maxW = d.weight.length ? Math.max(...d.weight) : 'N/A'
      return `  - ${ex}: ${d.reps.length} séries, max ${maxW}kg, RIR moy ${avgRir}`
    })
    const date = new Date((session as any).completed_at).toLocaleDateString('fr-FR')
    sessionSummary = `Séance du ${date}:\n${lines.join('\n')}`
  }

  // Weight trend
  let weightSummary = 'Aucune donnée de poids récente.'
  if (weights.length >= 2) {
    const first = (weights[0] as any).value_number
    const last  = (weights[weights.length - 1] as any).value_number
    const delta = (last - first).toFixed(2)
    const sign  = parseFloat(delta) >= 0 ? '+' : ''
    weightSummary = `Évolution poids (14j): ${first}kg → ${last}kg (${sign}${delta}kg, ${weights.length} mesures)`
  }

  const prompt = `Tu es assistant d'un coach sportif professionnel. Tu dois rédiger un message de feedback court (2 à 4 phrases) destiné au client, en français.

CONTEXTE CLIENT:
- Prénom: ${firstName}
- Objectif: ${goal}

CHECK-INS 7 DERNIERS JOURS (stress/sommeil/énergie sur 1-10):
${checkinSummary}

DERNIÈRE SÉANCE:
${sessionSummary}

TENDANCE POIDS:
${weightSummary}

INSTRUCTIONS:
- Message au client (tutoiement), chaleureux mais professionnel
- 2 à 4 phrases maximum
- Identifie le point le plus important (fatigue? récupération? performance? poids?)
- Donne 1 conseil ou encouragement concret et actionnable
- Si données insuffisantes pour un point, ignore-le
- Ne mentionne pas que tu es une IA
- Commence directement par le message (pas de "Voici votre message:", pas de titre)
`

  const completion = await openai().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
  })

  const body = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!body) return NextResponse.json({ error: 'GPT returned empty response.' }, { status: 500 })

  // ── Persist as coach_feedback draft ───────────────────────────────────────
  const latestCheckin = checkins[0]
  const entityId = crypto.randomUUID()

  const { data: feedback, error: fbErr } = await db
    .from('coach_feedback')
    .insert({
      coach_id:     user.id,
      client_id:    clientId,
      entity_type:  'checkin',
      entity_id:    entityId,
      entity_label: `Check-in IA — ${new Date(latestCheckin.responded_at).toLocaleDateString('fr-FR')}`,
      body,
      is_ai_draft:  true,
    })
    .select('id')
    .single()

  if (fbErr) {
    // Fallback: return body even if save failed
    return NextResponse.json({ feedback_id: null, body, saved: false })
  }

  return NextResponse.json({ feedback_id: feedback.id, body, saved: true })
}
