import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { FeedbackEntityType } from '@/lib/feedback/types'
import { z } from 'zod'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const createSchema = z.object({
  entity_type: z.enum(['session','exercise','set','checkin','morpho','bilan']),
  entity_id: z.string().uuid(),
  entity_label: z.string().optional(),
  body: z.string().min(1).max(1000),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const { clientId } = params

  const { data: client } = await db
    .from('coach_clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entity_type') as FeedbackEntityType | null
  const entityId = searchParams.get('entity_id')

  let query = db
    .from('coach_feedback')
    .select(`*, coach_feedback_reactions(*)`)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    (data ?? []).map((f: any) => ({
      ...f,
      reactions: f.coach_feedback_reactions ?? [],
    }))
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const { clientId } = params

  const { data: client } = await db
    .from('coach_clients')
    .select('id, first_name')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = createSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const { data: feedback, error } = await db
    .from('coach_feedback')
    .insert({
      coach_id: user.id,
      client_id: clientId,
      entity_type: body.data.entity_type,
      entity_id: body.data.entity_id,
      entity_label: body.data.entity_label ?? null,
      body: body.data.body,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('coach_client_notifications').insert({
    client_id: clientId,
    coach_id: user.id,
    type: 'coach_feedback',
    title: 'Message de votre coach',
    body: body.data.body.slice(0, 100),
    payload: {
      feedback_id: (feedback as any).id,
      entity_type: body.data.entity_type,
      entity_id: body.data.entity_id,
      entity_label: body.data.entity_label ?? null,
    },
  })

  return NextResponse.json({ ...(feedback as any), reactions: [] }, { status: 201 })
}
