import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface BilanMeasures {
  bilanIndex: number;
  date: string;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  chest_cm: number | null;
  neck_cm: number | null;
  shoulder_width_cm: number | null;
  shoulder_circ_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  glutes_cm: number | null;
}

export type CheckinMetricKey =
  | "weight_kg"
  | "sleep_duration_h"
  | "energy_level"
  | "stress_level";

export interface BodyDataResponse {
  weightSeries: { date: string; value: number; bilanIndex: number }[];
  bodyFatSeries: { date: string; value: number; bilanIndex: number }[];
  leanMassSeries: { date: string; value: number; bilanIndex: number }[];
  checkinSeries: Record<CheckinMetricKey, { date: string; value: number }[]>;
  composition: {
    body_fat_pct: number | null;
    lean_mass_kg: number | null;
    muscle_mass_kg: number | null;
  };
  measures: {
    waist_cm: number | null;
    hips_cm: number | null;
    arm_cm: number | null;
    chest_cm: number | null;
    neck_cm: number | null;
    shoulder_width_cm: number | null;
    shoulder_circ_cm: number | null;
    arm_left_cm: number | null;
    arm_right_cm: number | null;
    thigh_left_cm: number | null;
    thigh_right_cm: number | null;
    calf_left_cm: number | null;
    calf_right_cm: number | null;
    glutes_cm: number | null;
  };
  latestWeight: number | null;
  measuresByBilan: BilanMeasures[];
  annotations: { date: string; label: string }[];
}

const NEW_MEASURE_KEYS = [
  "neck_cm",
  "shoulder_width_cm",
  "shoulder_circ_cm",
  "arm_left_cm",
  "arm_right_cm",
  "thigh_left_cm",
  "thigh_right_cm",
  "calf_left_cm",
  "calf_right_cm",
  "glutes_cm",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = svc();

  // Verify coach ownership of this client
  const { data: coachClient, error: ccError } = await service
    .from("coach_clients")
    .select("id")
    .eq("id", params.clientId)
    .eq("coach_id", user.id)
    .maybeSingle();

  if (ccError || !coachClient) {
    return NextResponse.json(
      { error: "Client not found or unauthorized" },
      { status: 404 },
    );
  }

  const clientId = params.clientId;

  const [submissionsRes, annotationsRes, selfMeasuresRes, vitalityRes] =
    await Promise.all([
      service
        .from("assessment_submissions")
        .select(
          "id, bilan_date, submitted_at, assessment_responses(field_key, value_number)",
        )
        .eq("client_id", clientId)
        .eq("status", "completed")
        .order("bilan_date", { ascending: true })
        .limit(20),
      service
        .from("metric_annotations")
        .select("annotation_date, label")
        .eq("client_id", clientId)
        .not("label", "is", null)
        .neq("event_type", "injury")
        .order("annotation_date", { ascending: true }),
      service
        .from("client_measurements")
        .select(
          "measured_at, waist_cm, hips_cm, arm_cm, chest_cm, neck_cm, shoulder_width_cm, shoulder_circ_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm, calf_left_cm, calf_right_cm, glutes_cm",
        )
        .eq("client_id", clientId)
        .order("measured_at", { ascending: true })
        .limit(20),
      service
        .from("client_daily_checkins")
        .select(
          "checkin_date, energy_morning, energy_evening, sleep_hours, sleep_quality, stress_level, soreness, weight_kg",
        )
        .eq("client_id", clientId)
        .order("checkin_date", { ascending: true })
        .limit(30),
    ]);

  const emptyMeasures = {
    waist_cm: null,
    hips_cm: null,
    arm_cm: null,
    chest_cm: null,
    neck_cm: null,
    shoulder_width_cm: null,
    shoulder_circ_cm: null,
    arm_left_cm: null,
    arm_right_cm: null,
    thigh_left_cm: null,
    thigh_right_cm: null,
    calf_left_cm: null,
    calf_right_cm: null,
    glutes_cm: null,
  };

  const empty: BodyDataResponse = {
    weightSeries: [],
    bodyFatSeries: [],
    leanMassSeries: [],
    checkinSeries: {
      weight_kg: [],
      sleep_duration_h: [],
      energy_level: [],
      stress_level: [],
    },
    composition: {
      body_fat_pct: null,
      lean_mass_kg: null,
      muscle_mass_kg: null,
    },
    measures: emptyMeasures,
    latestWeight: null,
    measuresByBilan: [],
    annotations: [],
  };

  // Normalize submissions to an array (may be empty).
  // Do NOT return early here — even if no completed assessments exist
  // we still want to include self-reported measurements and daily checkins.
  const submissions = submissionsRes.data ?? [];

  const weightSeries: { date: string; value: number; bilanIndex: number }[] =
    [];
  const bodyFatSeries: { date: string; value: number; bilanIndex: number }[] =
    [];
  const leanMassSeries: { date: string; value: number; bilanIndex: number }[] =
    [];
  const checkinSeries: Record<
    CheckinMetricKey,
    { date: string; value: number }[]
  > = {
    weight_kg: [],
    sleep_duration_h: [],
    energy_level: [],
    stress_level: [],
  };
  const measuresByBilan: BilanMeasures[] = [];
  const latestValues: Record<string, number> = {};

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i] as any;
    const bilanIndex = i + 1;
    const date = sub.bilan_date ?? sub.submitted_at?.split("T")[0] ?? "";
    const responses = sub.assessment_responses as {
      field_key: string;
      value_number: number | null;
    }[];
    if (!responses) continue;

    const bilanValues: Record<string, number> = {};
    for (const r of responses) {
      if (r.value_number == null) continue;
      bilanValues[r.field_key] = r.value_number;
      latestValues[r.field_key] = r.value_number;
    }

    if (bilanValues["weight_kg"] != null)
      weightSeries.push({ date, value: bilanValues["weight_kg"], bilanIndex });
    if (bilanValues["body_fat_pct"] != null)
      bodyFatSeries.push({
        date,
        value: bilanValues["body_fat_pct"],
        bilanIndex,
      });
    if (bilanValues["lean_mass_kg"] != null)
      leanMassSeries.push({
        date,
        value: bilanValues["lean_mass_kg"],
        bilanIndex,
      });

    measuresByBilan.push({
      bilanIndex,
      date,
      waist_cm: bilanValues["waist_cm"] ?? null,
      hips_cm: bilanValues["hips_cm"] ?? null,
      arm_cm: bilanValues["arm_cm"] ?? null,
      chest_cm: bilanValues["chest_cm"] ?? null,
      neck_cm: bilanValues["neck_cm"] ?? null,
      shoulder_width_cm: bilanValues["shoulder_width_cm"] ?? null,
      shoulder_circ_cm: bilanValues["shoulder_circ_cm"] ?? null,
      arm_left_cm: bilanValues["arm_left_cm"] ?? null,
      arm_right_cm: bilanValues["arm_right_cm"] ?? null,
      thigh_left_cm: bilanValues["thigh_left_cm"] ?? null,
      thigh_right_cm: bilanValues["thigh_right_cm"] ?? null,
      calf_left_cm: bilanValues["calf_left_cm"] ?? null,
      calf_right_cm: bilanValues["calf_right_cm"] ?? null,
      glutes_cm: bilanValues["glutes_cm"] ?? null,
    });
  }

  // Merge self-reported measurements (from client app)
  const selfMeasures = selfMeasuresRes.data ?? [];
  for (const m of selfMeasures as any[]) {
    const date = m.measured_at as string;
    const bilanIndex = measuresByBilan.length + 1;
    if (m.waist_cm != null) latestValues["waist_cm"] = m.waist_cm;
    if (m.hips_cm != null) latestValues["hips_cm"] = m.hips_cm;
    if (m.arm_cm != null) latestValues["arm_cm"] = m.arm_cm;
    if (m.chest_cm != null) latestValues["chest_cm"] = m.chest_cm;
    for (const k of NEW_MEASURE_KEYS) {
      if (m[k] != null) latestValues[k] = m[k];
    }
    measuresByBilan.push({
      bilanIndex,
      date,
      waist_cm: m.waist_cm ?? null,
      hips_cm: m.hips_cm ?? null,
      arm_cm: m.arm_cm ?? null,
      chest_cm: m.chest_cm ?? null,
      neck_cm: m.neck_cm ?? null,
      shoulder_width_cm: m.shoulder_width_cm ?? null,
      shoulder_circ_cm: m.shoulder_circ_cm ?? null,
      arm_left_cm: m.arm_left_cm ?? null,
      arm_right_cm: m.arm_right_cm ?? null,
      thigh_left_cm: m.thigh_left_cm ?? null,
      thigh_right_cm: m.thigh_right_cm ?? null,
      calf_left_cm: m.calf_left_cm ?? null,
      calf_right_cm: m.calf_right_cm ?? null,
      glutes_cm: m.glutes_cm ?? null,
    });
  }

  // Merge weight from daily check-ins (if more recent than bilan)
  const checkins = vitalityRes.data ?? [];
  for (const c of checkins as any[]) {
    const date = c.checkin_date as string;
    if (c.weight_kg != null) {
      latestValues["weight_kg"] = c.weight_kg;
      const existing = weightSeries.find((w) => w.date === date);
      if (!existing) {
        weightSeries.push({ date, value: c.weight_kg, bilanIndex: 0 });
      }
      checkinSeries.weight_kg.push({ date, value: c.weight_kg });
    }

    const energyLevel =
      c.energy_morning != null && c.energy_evening != null
        ? Math.round((c.energy_morning + c.energy_evening) / 2)
        : (c.energy_morning ?? c.energy_evening ?? null);

    if (energyLevel != null) {
      checkinSeries.energy_level.push({ date, value: energyLevel });
    }

    if (c.sleep_hours != null) {
      checkinSeries.sleep_duration_h.push({ date, value: c.sleep_hours });
    }

    if (c.stress_level != null) {
      checkinSeries.stress_level.push({ date, value: c.stress_level });
    }
  }

  measuresByBilan.sort((a, b) => a.date.localeCompare(b.date));
  measuresByBilan.forEach((b, i) => {
    b.bilanIndex = i + 1;
  });

  const annotations = (annotationsRes.data ?? []).map((a: any) => ({
    date: a.annotation_date,
    label: a.label,
  }));

  return NextResponse.json({
    weightSeries,
    bodyFatSeries,
    leanMassSeries,
    composition: {
      body_fat_pct: latestValues["body_fat_pct"] ?? null,
      lean_mass_kg: latestValues["lean_mass_kg"] ?? null,
      muscle_mass_kg: latestValues["muscle_mass_kg"] ?? null,
    },
    measures: {
      waist_cm: latestValues["waist_cm"] ?? null,
      hips_cm: latestValues["hips_cm"] ?? null,
      arm_cm: latestValues["arm_cm"] ?? null,
      chest_cm: latestValues["chest_cm"] ?? null,
      neck_cm: latestValues["neck_cm"] ?? null,
      shoulder_width_cm: latestValues["shoulder_width_cm"] ?? null,
      shoulder_circ_cm: latestValues["shoulder_circ_cm"] ?? null,
      arm_left_cm: latestValues["arm_left_cm"] ?? null,
      arm_right_cm: latestValues["arm_right_cm"] ?? null,
      thigh_left_cm: latestValues["thigh_left_cm"] ?? null,
      thigh_right_cm: latestValues["thigh_right_cm"] ?? null,
      calf_left_cm: latestValues["calf_left_cm"] ?? null,
      calf_right_cm: latestValues["calf_right_cm"] ?? null,
      glutes_cm: latestValues["glutes_cm"] ?? null,
    },
    checkinSeries,
    latestWeight:
      weightSeries.length > 0
        ? weightSeries[weightSeries.length - 1].value
        : null,
    measuresByBilan,
    annotations,
  } satisfies BodyDataResponse);
}
