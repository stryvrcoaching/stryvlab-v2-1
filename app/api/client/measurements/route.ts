import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const schema = z.object({
  waist_cm:           z.number().min(40).max(200).nullable().optional(),
  hips_cm:            z.number().min(40).max(200).nullable().optional(),
  arm_cm:             z.number().min(15).max(80).nullable().optional(),
  chest_cm:           z.number().min(40).max(200).nullable().optional(),
  neck_cm:            z.number().min(20).max(70).nullable().optional(),
  shoulder_width_cm:  z.number().min(30).max(80).nullable().optional(),
  shoulder_circ_cm:   z.number().min(60).max(180).nullable().optional(),
  arm_left_cm:        z.number().min(15).max(80).nullable().optional(),
  arm_right_cm:       z.number().min(15).max(80).nullable().optional(),
  thigh_left_cm:      z.number().min(30).max(100).nullable().optional(),
  thigh_right_cm:     z.number().min(30).max(100).nullable().optional(),
  calf_left_cm:       z.number().min(20).max(60).nullable().optional(),
  calf_right_cm:      z.number().min(20).max(60).nullable().optional(),
  glutes_cm:          z.number().min(60).max(180).nullable().optional(),
  measured_at:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })

  const {
    waist_cm, hips_cm, arm_cm, chest_cm,
    neck_cm, shoulder_width_cm, shoulder_circ_cm,
    arm_left_cm, arm_right_cm,
    thigh_left_cm, thigh_right_cm,
    calf_left_cm, calf_right_cm,
    glutes_cm,
    measured_at,
  } = body.data

  const allNull = [
    waist_cm, hips_cm, arm_cm, chest_cm,
    neck_cm, shoulder_width_cm, shoulder_circ_cm,
    arm_left_cm, arm_right_cm,
    thigh_left_cm, thigh_right_cm,
    calf_left_cm, calf_right_cm,
    glutes_cm,
  ].every(v => v == null)

  if (allNull) {
    return NextResponse.json({ error: 'At least one measurement required' }, { status: 400 })
  }

  const service = svc()
  const client = await resolveClientFromUser(user.id, user.email, service, 'id')
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { data, error } = await service
    .from('client_measurements')
    .insert({
      client_id:          (client as any).id,
      measured_at:        measured_at ?? new Date().toISOString().split('T')[0],
      waist_cm:           waist_cm           ?? null,
      hips_cm:            hips_cm            ?? null,
      arm_cm:             arm_cm             ?? null,
      chest_cm:           chest_cm           ?? null,
      neck_cm:            neck_cm            ?? null,
      shoulder_width_cm:  shoulder_width_cm  ?? null,
      shoulder_circ_cm:   shoulder_circ_cm   ?? null,
      arm_left_cm:        arm_left_cm        ?? null,
      arm_right_cm:       arm_right_cm       ?? null,
      thigh_left_cm:      thigh_left_cm      ?? null,
      thigh_right_cm:     thigh_right_cm     ?? null,
      calf_left_cm:       calf_left_cm       ?? null,
      calf_right_cm:      calf_right_cm      ?? null,
      glutes_cm:          glutes_cm          ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
