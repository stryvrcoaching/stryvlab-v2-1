import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { z } from 'zod'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const reactionSchema = z.object({
  emoji: z.enum(['👍','💪','✅','🔥','❓']),
  reply_text: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { entityType: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const client = await resolveClientFromUser(user.id, user.email, db, 'id')
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // entityType param is actually the feedbackId here (segment reuse)
  const feedbackId = params.entityType

  const { data: feedback } = await db
    .from('coach_feedback')
    .select('id, coach_id')
    .eq('id', feedbackId)
    .eq('client_id', client.id)
    .single()
  if (!feedback) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = reactionSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { data: reaction, error } = await db
    .from('coach_feedback_reactions')
    .insert({
      feedback_id: feedbackId,
      author_type: 'client',
      author_id: user.id,
      emoji: body.data.emoji,
      reply_text: body.data.reply_text ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: clientRow } = await db
    .from('coach_clients')
    .select('first_name')
    .eq('id', client.id)
    .single()
  const firstName = (clientRow as any)?.first_name ?? 'Client'

  await db.from('coach_client_notifications').insert({
    client_id: client.id,
    coach_id: (feedback as any).coach_id,
    type: 'client_reaction',
    title: `${firstName} a répondu`,
    body: `${body.data.emoji}${body.data.reply_text ? ` — ${body.data.reply_text.slice(0, 80)}` : ''}`,
    payload: { feedback_id: feedbackId, emoji: body.data.emoji },
  })

  return NextResponse.json(reaction, { status: 201 })
}
