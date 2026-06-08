import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthCoach(clientId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await service()
    .from("coach_clients")
    .select("id")
    .eq("id", clientId)
    .eq("coach_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return user;
}

const paramsSchema = z.object({
  clientId: z.string().uuid(),
  protocolId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string; protocolId: string } },
) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const coach = await getAuthCoach(parsed.data.clientId);
  if (!coach)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = service();
  try {
    // Fetch protocol days
    const { data: days, error: daysError } = await svc
      .from("nutrition_protocol_days")
      .select("*")
      .eq("protocol_id", parsed.data.protocolId)
      .order("position", { ascending: true });

    if (daysError) throw daysError;

    // Determine if a session is scheduled today for this client.
    // Strategy: find active programs for client, then check program_sessions.days_of_week contains weekday
    const today = new Date();
    const weekday = today.getDay(); // 0..6

    // 1) find active program(s) assigned to client
    const { data: programs } = await svc
      .from("programs")
      .select("id")
      .eq("client_id", parsed.data.clientId)
      .eq("status", "active");

    let hasSessionToday = false;
    if (programs && programs.length > 0) {
      const programIds = programs.map((p: any) => p.id);
      // program_sessions may store days_of_week as int[]
      const { data: sessions, error: sessionsError } = await svc
        .from("program_sessions")
        .select("id, program_id, days_of_week")
        .in("program_id", programIds)
        .contains("days_of_week", [weekday])
        .limit(1);

      if (!sessionsError && sessions && sessions.length > 0)
        hasSessionToday = true;
    }

    // Fallback: check if there's a client_session_logs planned for today (scheduled session)
    if (!hasSessionToday) {
      const isoToday = today.toISOString().slice(0, 10); // YYYY-MM-DD
      const { data: logs, error: logsError } = await svc
        .from("client_session_logs")
        .select("id")
        .eq("client_id", parsed.data.clientId)
        .gte("scheduled_at", isoToday + "T00:00:00Z")
        .lte("scheduled_at", isoToday + "T23:59:59Z")
        .limit(1);

      if (!logsError && logs && logs.length > 0) hasSessionToday = true;
    }

    return NextResponse.json({ days: days ?? [], hasSessionToday });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
