import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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
  { params }: { params: { clientId: string; feedbackId: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()

  const { data: feedback } = await db
    .from('coach_feedback')
    .select('id, client_id')
    .eq('id', params.feedbackId)
    .eq('coach_id', user.id)
    .single()
  if (!feedback) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = reactionSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { data: reaction, error } = await db
    .from('coach_feedback_reactions')
    .insert({
      feedback_id: params.feedbackId,
      author_type: 'coach',
      author_id: user.id,
      emoji: body.data.emoji,
      reply_text: body.data.reply_text ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(reaction, { status: 201 })
}
