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

async function getCoach(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function ownsClient(coachId: string, clientId: string) {
  const { data } = await service()
    .from("coach_clients")
    .select("id")
    .eq("id", clientId)
    .eq("coach_id", coachId)
    .single();
  return !!data;
}

const paramsSchema = z.object({
  clientId: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const supabase = createClient();
  const coach = await getCoach(supabase);
  if (!coach) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await ownsClient(coach.id, parsed.data.clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const svc = service();

    // Find active programs for this client
    const { data: programs, error: programsError } = await svc
      .from("programs")
      .select("id")
      .eq("client_id", parsed.data.clientId)
      .eq("status", "active");

    if (programsError) throw programsError;

    if (!programs || programs.length === 0) {
      // No active programs
      return NextResponse.json({ trainingDays: [] });
    }

    const programIds = programs.map((p) => p.id);

    // Fetch all sessions with their days_of_week
    const { data: sessions, error: sessionsError } = await svc
      .from("program_sessions")
      .select("id, days_of_week")
      .in("program_id", programIds);

    if (sessionsError) throw sessionsError;

    // Flatten days_of_week arrays and get unique set of training days
    const trainingDays = new Set<number>();
    if (sessions && sessions.length > 0) {
      sessions.forEach((session: any) => {
        if (Array.isArray(session.days_of_week)) {
          session.days_of_week.forEach((day: number) => {
            trainingDays.add(day);
          });
        }
      });
    }

    return NextResponse.json({
      trainingDays: Array.from(trainingDays).sort(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
