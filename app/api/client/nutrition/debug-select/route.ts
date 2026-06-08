/**
 * Diagnostic endpoint — PROTECTED (client auth only)
 * Returns the selected protocol day for today, tomorrow, and the day after
 * to debug the inversion issue.
 */

import { createClient } from "@/utils/supabase/server";
import { resolveClientFromUser } from "@/lib/client/resolve-client";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";
import selectProtocolDayForDate from "@/lib/nutrition/selectProtocolDayForDate";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await resolveClientFromUser(user.id, user.email, svc(), "id");
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Fetch active protocol
  const { data: proto } = await svc()
    .from("nutrition_protocols")
    .select(
      "id, created_at, shared_at, assigned_at, start_date, starts_at, viewed_by_client_at, nutrition_protocol_days(id, name, position, calories, protein_g, carbs_g, fat_g, hydration_ml, carb_cycle_type)"
    )
    .eq("client_id", client.id)
    .eq("status", "shared")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!proto) {
    return NextResponse.json({ error: "No active protocol" }, { status: 404 });
  }

  // Select for today, tomorrow, day after tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const todayYmd = computePhysiologicalDate(today);
  const tomorrowYmd = computePhysiologicalDate(tomorrow);
  const dayAfterYmd = computePhysiologicalDate(dayAfter);

  // Fetch training sessions for these dates
  const { data: trainingSessions } = await svc()
    .from("training_sessions")
    .select("id, date")
    .eq("user_id", user.id)
    .in("date", [todayYmd, tomorrowYmd, dayAfterYmd]);

  const trainingDates = new Set((trainingSessions ?? []).map((s) => s.date as string));

  return NextResponse.json({
    protocol: {
      id: proto.id,
      created_at: proto.created_at,
      shared_at: proto.shared_at,
      assigned_at: proto.assigned_at,
      start_date: proto.start_date,
      starts_at: proto.starts_at,
      viewed_by_client_at: proto.viewed_by_client_at,
      days: (proto as any).nutrition_protocol_days ?? [],
    },
    selection: {
      today: {
        date: todayYmd,
        hasTraining: trainingDates.has(todayYmd),
        selected: selectProtocolDayForDate(proto, today),
      },
      tomorrow: {
        date: tomorrowYmd,
        hasTraining: trainingDates.has(tomorrowYmd),
        selected: selectProtocolDayForDate(proto, tomorrow),
      },
      dayAfter: {
        date: dayAfterYmd,
        hasTraining: trainingDates.has(dayAfterYmd),
        selected: selectProtocolDayForDate(proto, dayAfter),
      },
    },
    debug: {
      todayJS_getDay: new Date(todayYmd + "T00:00:00").getDay(),
      tomorrowJS_getDay: new Date(tomorrowYmd + "T00:00:00").getDay(),
      dayAfterJS_getDay: new Date(dayAfterYmd + "T00:00:00").getDay(),
    },
  });
}
