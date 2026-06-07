import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const SELECT = `
  id, client_id, name, description, goal, level, frequency, weeks, muscle_tags,
  equipment_archetype, session_mode, status, is_client_visible, created_at,
  program_sessions (
    id, name, day_of_week, days_of_week, position, notes,
    program_exercises (
      id, name, sets, reps, rest_sec, rir, notes, position, image_url,
      movement_pattern, equipment_required, primary_muscles, secondary_muscles,
      group_id, is_compound, is_unilateral, target_rir, weight_increment_kg, tempo,
      plane, mechanic, unilateral, primary_muscle, primary_activation,
      secondary_muscles_detail, secondary_activations, stabilizers,
      joint_stress_spine, joint_stress_knee, joint_stress_shoulder,
      global_instability, coordination_demand, constraint_profile
    )
  )
`;

type Params = { params: { programId: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = service();

  const { data: source, error: sourceError } = await db
    .from("programs")
    .select(SELECT)
    .eq("id", params.programId)
    .eq("coach_id", user.id)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });
  }

  const { data: copy, error: copyError } = await db
    .from("programs")
    .insert({
      coach_id: user.id,
      client_id: (source as any).client_id,
      name: `${source.name} copy`,
      description: source.description,
      goal: source.goal,
      level: source.level,
      frequency: source.frequency,
      weeks: source.weeks,
      muscle_tags: source.muscle_tags,
      equipment_archetype: source.equipment_archetype ?? null,
      session_mode: source.session_mode ?? "day",
      status: "active",
      is_client_visible: false,
    })
    .select("id")
    .single();

  if (copyError || !copy) {
    return NextResponse.json({ error: copyError?.message ?? "Erreur duplication" }, { status: 500 });
  }

  for (const session of source.program_sessions ?? []) {
    const { data: newSession, error: sessionError } = await db
      .from("program_sessions")
      .insert({
        program_id: copy.id,
        name: session.name,
        days_of_week: (session as any).days_of_week ?? [],
        day_of_week: session.day_of_week,
        position: session.position,
        notes: session.notes,
      })
      .select("id")
      .single();

    if (sessionError || !newSession) {
      return NextResponse.json({ error: sessionError?.message ?? "Erreur duplication séance" }, { status: 500 });
    }

    const exercises = session.program_exercises ?? [];
    if (exercises.length === 0) continue;

    const payload = exercises.map((exercise: any) => ({
      session_id: newSession.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_sec: exercise.rest_sec,
      rir: exercise.rir,
      notes: exercise.notes,
      position: exercise.position,
      image_url: exercise.image_url ?? null,
      movement_pattern: exercise.movement_pattern ?? null,
      equipment_required: exercise.equipment_required ?? [],
      primary_muscles: exercise.primary_muscles ?? [],
      secondary_muscles: exercise.secondary_muscles ?? [],
      group_id: exercise.group_id ?? null,
      is_compound: exercise.is_compound ?? null,
      is_unilateral: exercise.is_unilateral ?? false,
      target_rir: exercise.target_rir ?? null,
      weight_increment_kg: exercise.weight_increment_kg ?? null,
      tempo: exercise.tempo ?? null,
      plane: exercise.plane ?? null,
      mechanic: exercise.mechanic ?? null,
      unilateral: exercise.unilateral ?? false,
      primary_muscle: exercise.primary_muscle ?? null,
      primary_activation: exercise.primary_activation != null ? Number(exercise.primary_activation) : null,
      secondary_muscles_detail: exercise.secondary_muscles_detail ?? [],
      secondary_activations: (exercise.secondary_activations ?? []).map(Number),
      stabilizers: exercise.stabilizers ?? [],
      joint_stress_spine: exercise.joint_stress_spine != null ? Number(exercise.joint_stress_spine) : null,
      joint_stress_knee: exercise.joint_stress_knee != null ? Number(exercise.joint_stress_knee) : null,
      joint_stress_shoulder: exercise.joint_stress_shoulder != null ? Number(exercise.joint_stress_shoulder) : null,
      global_instability: exercise.global_instability != null ? Number(exercise.global_instability) : null,
      coordination_demand: exercise.coordination_demand != null ? Number(exercise.coordination_demand) : null,
      constraint_profile: exercise.constraint_profile ?? null,
    }));

    const { error: exercisesError } = await db.from("program_exercises").insert(payload);
    if (exercisesError) {
      return NextResponse.json({ error: exercisesError.message }, { status: 500 });
    }
  }

  const { data: full, error: fullError } = await db
    .from("programs")
    .select(SELECT)
    .eq("id", copy.id)
    .eq("coach_id", user.id)
    .single();

  if (fullError || !full) {
    return NextResponse.json({ error: fullError?.message ?? "Copie introuvable" }, { status: 500 });
  }

  return NextResponse.json({ program: full }, { status: 201 });
}
