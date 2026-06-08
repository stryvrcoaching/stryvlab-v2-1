import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = svc()
  const client = await resolveClientFromUser(user.id, user.email, db, 'id')
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await db
    .from('coach_feedback')
    .select(`*, coach_feedback_reactions(*)`)
    .eq('client_id', client.id)
    .eq('entity_type', params.entityType)
    .eq('entity_id', params.entityId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    (data ?? []).map((f: any) => ({
      ...f,
      reactions: f.coach_feedback_reactions ?? [],
    }))
  )
}
