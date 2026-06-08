"use client";

import { useEffect, useState } from "react";

export type NutritionProtocolDay = {
  id: string;
  protocol_id?: string;
  position?: number;
  weekday?: number | null; // 0..6
  day_type?: string | null; // 'training' | 'rest' | 'special' (localized strings possible)
  name?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  hydration_ml?: number | null;
  [k: string]: any;
};

export type TodayContextResponse = {
  days: NutritionProtocolDay[];
  hasSessionToday?: boolean;
  sessionId?: string | null;
};

function normalizeDayType(t?: string | null) {
  if (!t) return null;
  const s = String(t).toLowerCase();
  if (s.includes("entr") || s.includes("train")) return "training";
  if (s.includes("repo")) return "rest";
  if (s.includes("spec") || s.includes("special") || s.includes("jour"))
    return "special";
  return s;
}

export function selectDayForDate(
  days: NutritionProtocolDay[],
  date = new Date(),
  hasSessionToday = false,
): NutritionProtocolDay | null {
  if (!Array.isArray(days) || days.length === 0) return null;
  const weekday = date.getDay(); // 0..6

  // 1) exact weekday match
  const byWeekday = days.filter((d) => d.weekday === weekday);
  if (byWeekday.length > 0) {
    if (hasSessionToday) {
      const pref = byWeekday.find(
        (d) => normalizeDayType(d.day_type) === "training",
      );
      if (pref) return pref;
    }
    return byWeekday[0];
  }

  // 2) if session today, prefer any training day
  if (hasSessionToday) {
    const anyTraining = days.find(
      (d) => normalizeDayType(d.day_type) === "training",
    );
    if (anyTraining) return anyTraining;
  }

  // 3) fallback to a rest day if present
  const rest = days.find((d) => normalizeDayType(d.day_type) === "rest");
  if (rest) return rest;

  // 4) fallback to the first day
  return days[0];
}

export default function useTodayProtocol(clientId: string, protocolId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<TodayContextResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<NutritionProtocolDay | null>(
    null,
  );

  useEffect(() => {
    if (!clientId || !protocolId) return;
    let mounted = true;
    const cacheKey = `todayProtocol:${clientId}:${protocolId}`;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/clients/${clientId}/nutrition-protocols/${protocolId}/today-context`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TodayContextResponse = await res.json();
        if (!mounted) return;
        setContext(json);
        const chosen = selectDayForDate(
          json.days ?? [],
          new Date(),
          !!json.hasSessionToday,
        );
        setSelectedDay(chosen);
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              ts: Date.now(),
              payload: { ...json, selectedDay: chosen },
            }),
          );
        } catch {}
      } catch (err: any) {
        // fallback to cache
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (mounted) {
              setContext(parsed.payload);
              setSelectedDay(
                parsed.payload.selectedDay ??
                  selectDayForDate(
                    parsed.payload.days ?? [],
                    new Date(),
                    !!parsed.payload.hasSessionToday,
                  ),
              );
            }
          } else {
            if (mounted) setError(err?.message ?? "Fetch error");
          }
        } catch (ex) {
          if (mounted) setError(String(ex));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [clientId, protocolId]);

  return { loading, error, context, selectedDay };
}
