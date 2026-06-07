import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMocks } from "../mocks/supabase";

const mocks = createSupabaseMocks();

vi.mock("@/utils/supabase/server", () => ({ createClient: () => mocks.serverMock }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks.serviceMock }));

import { POST } from "@/app/api/programs/[programId]/duplicate/route";
import { NextRequest } from "../mocks/next-server";

beforeEach(() => mocks.resetMocks());

function makePost() {
  return new NextRequest("http://localhost:3000/api/programs/program-1/duplicate", {
    method: "POST",
  });
}

async function json(res: Response) {
  return res.json();
}

describe("POST /api/programs/[programId]/duplicate", () => {
  it("returns 401 when not authenticated", async () => {
    mocks.setServerUser(null);
    const res = await POST(makePost() as any, { params: { programId: "program-1" } });
    expect(res.status).toBe(401);
  });

  it("duplicates a full program with sessions and exercises", async () => {
    mocks.setServiceResults([
      {
        data: {
          id: "program-1",
          client_id: "client-1",
          name: "Bulk Pro 001",
          description: "Base block",
          goal: "hypertrophy",
          level: "intermediate",
          frequency: 3,
          weeks: 8,
          muscle_tags: ["Pectoraux"],
          equipment_archetype: "commercial_gym",
          session_mode: "day",
          program_sessions: [
            {
              name: "Push",
              day_of_week: 1,
              days_of_week: [1],
              position: 0,
              notes: "Heavy",
              program_exercises: [
                {
                  name: "Bench Press",
                  sets: 4,
                  reps: "8-10",
                  rest_sec: 120,
                  rir: 2,
                  notes: "",
                  position: 0,
                  image_url: null,
                  movement_pattern: "horizontal_push",
                  equipment_required: ["barbell"],
                  primary_muscles: ["Pectoraux"],
                  secondary_muscles: ["Triceps"],
                  group_id: null,
                  is_compound: true,
                  is_unilateral: false,
                  target_rir: null,
                  weight_increment_kg: 2.5,
                  tempo: null,
                  plane: null,
                  mechanic: null,
                  unilateral: false,
                  primary_muscle: null,
                  primary_activation: null,
                  secondary_muscles_detail: [],
                  secondary_activations: [],
                  stabilizers: [],
                  joint_stress_spine: null,
                  joint_stress_knee: null,
                  joint_stress_shoulder: null,
                  global_instability: null,
                  coordination_demand: null,
                  constraint_profile: null,
                },
              ],
            },
          ],
        },
      },
      { data: { id: "copy-1" } },
      { data: { id: "copy-session-1" } },
      { data: null },
      {
        data: {
          id: "copy-1",
          name: "Bulk Pro 001 copy",
          is_client_visible: false,
          status: "active",
          program_sessions: [
            {
              id: "copy-session-1",
              name: "Push",
              program_exercises: [{ id: "copy-ex-1", name: "Bench Press" }],
            },
          ],
        },
      },
    ]);

    const res = await POST(makePost() as any, { params: { programId: "program-1" } });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.program.name).toBe("Bulk Pro 001 copy");
    expect(body.program.is_client_visible).toBe(false);
    expect(body.program.program_sessions).toHaveLength(1);
    expect(body.program.program_sessions[0].program_exercises).toHaveLength(1);
  });
});
