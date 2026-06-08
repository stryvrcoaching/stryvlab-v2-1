import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SELECT = `
  id, name, description, goal, level, frequency, weeks, muscle_tags, notes, is_public, equipment_archetype, created_at,
  coach_program_template_sessions (
    id, name, day_of_week, days_of_week, position, notes,
    coach_program_template_exercises (
      id, name, sets, reps, rest_sec, rir, weight_increment_kg, notes, position, image_url, movement_pattern, equipment_required, primary_muscles, secondary_muscles, group_id,
      plane, mechanic, unilateral, primary_muscle, primary_activation,
      secondary_muscles_detail, secondary_activations, stabilizers,
      joint_stress_spine, joint_stress_knee, joint_stress_shoulder,
      global_instability, coordination_demand, constraint_profile
    )
  )
`

type Params = { params: { templateId: string } }

// GET /api/program-templates/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await service()
    .from('coach_program_templates')
    .select(SELECT)
    .eq('id', params.templateId)
    .or(`coach_id.eq.${user.id},is_system.eq.true`)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ template: data })
}

// PATCH /api/program-templates/[id] — mise à jour meta uniquement
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { name, description, goal, level, frequency, weeks, muscle_tags, notes, equipment_archetype, session_mode } = body

  const db = service()

  // Rebuild sessions preserving exercise UUIDs (dbId) so alternatives survive
  if (body.sessions) {
    // Collect all existing exercise IDs for this template so we can delete orphans
    const { data: existingSessions } = await db
      .from('coach_program_template_sessions')
      .select('id')
      .eq('template_id', params.templateId)

    const existingSessionIds = (existingSessions ?? []).map((s: any) => s.id)

    // Collect all existing exercise IDs to detect which ones to keep vs delete
    let existingExerciseIds: string[] = []
    if (existingSessionIds.length) {
      const { data: existingExs } = await db
        .from('coach_program_template_exercises')
        .select('id')
        .in('session_id', existingSessionIds)
      existingExerciseIds = (existingExs ?? []).map((e: any) => e.id)
    }

    // Collect the dbIds that will be reused in the new save
    const incomingDbIds = new Set<string>()
    for (const s of body.sessions) {
      for (const e of (s.exercises ?? [])) {
        if (e.dbId) incomingDbIds.add(e.dbId)
      }
    }

    // Delete sessions that are no longer present (cascade deletes their exercises + alternatives)
    if (existingSessionIds.length) {
      await db.from('coach_program_template_sessions').delete().eq('template_id', params.templateId)
    }

    for (let si = 0; si < body.sessions.length; si++) {
      const s = body.sessions[si]
      const { data: session } = await db
        .from('coach_program_template_sessions')
        .insert({ template_id: params.templateId, name: s.name, days_of_week: s.days_of_week ?? [], day_of_week: (s.days_of_week ?? [])[0] ?? s.day_of_week ?? null, position: si, notes: s.notes ?? null })
        .select('id')
        .single()

      if (session && s.exercises?.length) {
        for (let ei = 0; ei < s.exercises.length; ei++) {
          const e = s.exercises[ei]
          const exRow = {
            session_id: session.id,
            name: e.name,
            sets: e.sets ?? 3,
            reps: e.reps ?? '8-12',
            rest_sec: e.rest_sec ?? null,
            rir: e.rir ?? null,
            notes: e.notes ?? null,
            position: ei,
            image_url: e.image_url ?? null,
            movement_pattern: e.movement_pattern ?? null,
            equipment_required: e.equipment_required ?? [],
            primary_muscles: e.primary_muscles ?? [],
            secondary_muscles: e.secondary_muscles ?? [],
            group_id: e.group_id ?? null,
            weight_increment_kg: e.weight_increment_kg != null ? Number(e.weight_increment_kg) : null,
            // Biomech fields
            plane: e.plane ?? null,
            mechanic: e.mechanic ?? null,
            unilateral: e.unilateral ?? false,
            primary_muscle: e.primary_muscle ?? null,
            primary_activation: e.primary_activation != null ? Number(e.primary_activation) : null,
            secondary_muscles_detail: e.secondary_muscles_detail ?? [],
            secondary_activations: (e.secondary_activations ?? []).map(Number),
            stabilizers: e.stabilizers ?? [],
            joint_stress_spine: e.joint_stress_spine != null ? Number(e.joint_stress_spine) : null,
            joint_stress_knee: e.joint_stress_knee != null ? Number(e.joint_stress_knee) : null,
            joint_stress_shoulder: e.joint_stress_shoulder != null ? Number(e.joint_stress_shoulder) : null,
            global_instability: e.global_instability != null ? Number(e.global_instability) : null,
            coordination_demand: e.coordination_demand != null ? Number(e.coordination_demand) : null,
            constraint_profile: e.constraint_profile ?? null,
          }

          if (e.dbId && existingExerciseIds.includes(e.dbId)) {
            // Reuse existing UUID — alternatives stay linked
            await db
              .from('coach_program_template_exercises')
              .update(exRow)
              .eq('id', e.dbId)
            // Re-link to new session
            await db
              .from('coach_program_template_exercises')
              .update({ session_id: session.id, position: ei })
              .eq('id', e.dbId)
          } else {
            await db.from('coach_program_template_exercises').insert(exRow)
          }
        }
      }
    }
  }

  const effectiveFrequency = body.sessions?.length ?? frequency

  const { data, error } = await db
    .from('coach_program_templates')
    .update({ name, description, goal, level, frequency: effectiveFrequency, weeks, muscle_tags, notes, equipment_archetype: equipment_archetype || null, session_mode: session_mode ?? 'day' })
    .eq('id', params.templateId)
    .eq('coach_id', user.id)
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE /api/program-templates/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await service()
    .from('coach_program_templates')
    .delete()
    .eq('id', params.templateId)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST /api/program-templates/[id] — dupliquer
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const db = service()
  const { data: source } = await db.from('coach_program_templates').select(SELECT).eq('id', params.templateId).or(`coach_id.eq.${user.id},is_system.eq.true`).single()
  if (!source) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { data: copy } = await db
    .from('coach_program_templates')
    .insert({ coach_id: user.id, name: `${source.name} (copie)`, description: source.description, goal: source.goal, level: source.level, frequency: source.frequency, weeks: source.weeks, muscle_tags: source.muscle_tags, notes: source.notes, equipment_archetype: (source as any).equipment_archetype ?? null })
    .select('id')
    .single()

  if (!copy) return NextResponse.json({ error: 'Erreur duplication' }, { status: 500 })

  for (const s of (source.coach_program_template_sessions ?? [])) {
    const { data: ns } = await db
      .from('coach_program_template_sessions')
      .insert({ template_id: copy.id, name: s.name, days_of_week: (s as any).days_of_week ?? [], day_of_week: s.day_of_week, position: s.position, notes: s.notes })
      .select('id')
      .single()
    if (ns && s.coach_program_template_exercises?.length) {
      await db.from('coach_program_template_exercises').insert(
        s.coach_program_template_exercises.map((e: any) => ({
          session_id: ns.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest_sec: e.rest_sec,
          rir: e.rir,
          notes: e.notes,
          position: e.position,
          image_url: e.image_url ?? null,
          movement_pattern: e.movement_pattern ?? null,
          equipment_required: e.equipment_required ?? [],
          primary_muscles: e.primary_muscles ?? [],
          secondary_muscles: e.secondary_muscles ?? [],
          group_id: e.group_id ?? null,
          weight_increment_kg: e.weight_increment_kg != null ? Number(e.weight_increment_kg) : null,
          // Biomech fields
          plane: e.plane ?? null,
          mechanic: e.mechanic ?? null,
          unilateral: e.unilateral ?? false,
          primary_muscle: e.primary_muscle ?? null,
          primary_activation: e.primary_activation != null ? Number(e.primary_activation) : null,
          secondary_muscles_detail: e.secondary_muscles_detail ?? [],
          secondary_activations: (e.secondary_activations ?? []).map(Number),
          stabilizers: e.stabilizers ?? [],
          joint_stress_spine: e.joint_stress_spine != null ? Number(e.joint_stress_spine) : null,
          joint_stress_knee: e.joint_stress_knee != null ? Number(e.joint_stress_knee) : null,
          joint_stress_shoulder: e.joint_stress_shoulder != null ? Number(e.joint_stress_shoulder) : null,
          global_instability: e.global_instability != null ? Number(e.global_instability) : null,
          coordination_demand: e.coordination_demand != null ? Number(e.coordination_demand) : null,
          constraint_profile: e.constraint_profile ?? null,
        }))
      )
    }
  }

  const { data: full } = await db.from('coach_program_templates').select(SELECT).eq('id', copy.id).single()
  return NextResponse.json({ template: full }, { status: 201 })
}
