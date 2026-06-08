import { NutritionProtocol, NutritionProtocolDay } from "./types";
import { computePhysiologicalDate } from "./physiological-date";

function asDateYMD(ymd: string): Date {
  // ymd expected 'YYYY-MM-DD'
  return new Date(ymd + "T00:00:00");
}

function getProtocolDays(
  protocol: Partial<NutritionProtocol> | null | undefined,
): NutritionProtocolDay[] {
  const days: NutritionProtocolDay[] =
    (protocol as any).nutrition_protocol_days ??
    (protocol as any).days ??
    (protocol as any).nutritionProtocolDays ??
    [];
  if (!Array.isArray(days)) return [];

  return [...days].sort(
    (a, b) => Number(a.position ?? 0) - Number(b.position ?? 0),
  );
}

export function selectProtocolDayForDate(
  protocol: Partial<NutritionProtocol> | null | undefined,
  dateInput?: Date | string,
): NutritionProtocolDay | null {
  if (!protocol) return null;

  const dateYmd = dateInput
    ? computePhysiologicalDate(dateInput)
    : computePhysiologicalDate(new Date());

  const sorted = getProtocolDays(protocol);
  if (sorted.length === 0) return null;

  // Try to find an explicit anchor date on the protocol (common field names)
  const anchorCandidates = [
    "start_date",
    "startAt",
    "assigned_at",
    "starts_at",
    "shared_at",
    "created_at",
    "viewed_by_client_at",
  ];

  let anchor: string | undefined;
  for (const k of anchorCandidates) {
    const v = (protocol as any)[k];
    if (v) {
      anchor = String(v);
      break;
    }
  }

  if (anchor) {
    try {
      const anchorYmd = computePhysiologicalDate(anchor);
      const a = asDateYMD(anchorYmd);
      const d = asDateYMD(dateYmd);
      const dayDiff = Math.floor(
        (d.getTime() - a.getTime()) / (24 * 60 * 60 * 1000),
      );
      const idx = ((dayDiff % sorted.length) + sorted.length) % sorted.length;
      return sorted[idx] ?? sorted[0];
    } catch (e) {
      // fallthrough to next strategy
    }
  }

  // Fallback: map by weekday to have deterministic behaviour when no anchor exists.
  // This uses the local weekday (0=Sun..6=Sat) and maps into the day list.
  try {
    const d = asDateYMD(dateYmd);
    const weekday = d.getDay();
    const idx = weekday % sorted.length;
    return sorted[idx] ?? sorted[0];
  } catch (e) {
    return sorted[0];
  }
}

export function selectProtocolDayForTraining(
  protocol: Partial<NutritionProtocol> | null | undefined,
  dateInput?: Date | string,
  isTrainingDay = false,
): NutritionProtocolDay | null {
  const day = selectProtocolDayForDate(protocol, dateInput);
  if (!isTrainingDay || !protocol) return day;
  const highDay = getProtocolDays(protocol).find(
    (d) => d.carb_cycle_type === "high",
  );
  return highDay ?? day;
}

export function getProtocolTargetsForDate(
  protocol: Partial<NutritionProtocol> | null | undefined,
  dateInput?: Date | string,
) {
  const day = selectProtocolDayForDate(protocol, dateInput);
  return {
    kcal: Number(day?.calories ?? 0),
    protein_g: Number(day?.protein_g ?? 0),
    carbs_g: Number(day?.carbs_g ?? 0),
    fat_g: Number(day?.fat_g ?? 0),
    water_ml: Number(day?.hydration_ml ?? 2500),
    day,
  };
}

export default selectProtocolDayForDate;
