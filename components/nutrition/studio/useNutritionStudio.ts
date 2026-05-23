"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  calculateMacros,
  type MacroGoal,
  type MacroGender,
  type MacroResult,
} from "@/lib/formulas/macros";
import {
  calculateCarbCycling,
  type CarbCyclingResult,
  type CarbCycleProtocol,
  type CarbCycleGoal,
  type CarbCycleIntensity,
  type CarbCyclePhase,
  type CarbCycleInsulin,
} from "@/lib/formulas/carbCycling";
import {
  calculateHydration,
  type HydrationClimate,
} from "@/lib/formulas/hydration";
import {
  type DayDraft,
  type NutritionProtocol,
  type NutritionClientData,
  emptyDayDraft,
  dayDraftFromDb,
} from "@/lib/nutrition/types";
import type { BMRSource } from "@/lib/nutrition/calculators";
import type { TrainingWeekSchedule } from "@/lib/nutrition/training-week-schedule";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export interface TrainingConfig {
  weeklyFrequency: number;
  sessionDurationMin: number;
  cardioFrequency: number;
  cardioDurationMin: number;
  dailySteps: number;
  trainingCaloriesWeekly: number | null;
}

export interface LifestyleConfig {
  stressLevel: number | null;
  sleepDurationH: number | null;
  sleepQuality: number | null;
  caffeineDailyMg: number | null;
  alcoholWeekly: number | null;
  workHoursPerWeek: number | null;
}

export interface BiometricsConfig {
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  muscle_mass_kg: number | null;
  visceral_fat_level: number | null;
  bmr_kcal_measured: number | null;
  bmr_source: BMRSource;
}

export interface CarbCyclingConfig {
  enabled: boolean;
  protocol: CarbCycleProtocol;
  goal: CarbCycleGoal;
  phase: CarbCyclePhase;
  intensity: CarbCycleIntensity;
  insulin: CarbCycleInsulin;
}

const ACTIVITY_STEPS: Record<ActivityLevel, number> = {
  sedentary: 2000,
  light: 4000,
  moderate: 7000,
  active: 11000,
  veryActive: 15000,
};

const HYDRATION_ACTIVITY_MAP: Record<
  ActivityLevel,
  "sedentary" | "light" | "moderate" | "intense" | "athlete"
> = {
  sedentary: "sedentary",
  light: "light",
  moderate: "moderate",
  active: "intense",
  veryActive: "athlete",
};

const CLIENT_GOAL_MAP: Record<string, MacroGoal> = {
  fat_loss: "deficit",
  weight_loss: "deficit",
  sèche: "deficit",
  cut: "deficit",
  muscle_gain: "surplus",
  hypertrophy: "surplus",
  prise_de_masse: "surplus",
  bulk: "surplus",
  maintenance: "maintenance",
  recomposition: "maintenance",
};

const MACRO_TO_CC_GOAL: Record<MacroGoal, CarbCycleGoal> = {
  deficit: "moderate",
  maintenance: "recomp",
  surplus: "bulk",
};

function getActivityLevel(clientData: NutritionClientData): ActivityLevel {
  const freq = clientData.weekly_frequency ?? 0;
  if (freq === 0) return "sedentary";
  if (freq <= 2) return "light";
  if (freq <= 3) return "moderate";
  if (freq <= 5) return "active";
  return "veryActive";
}

export interface TdeeHistoryEntry {
  id: string
  calculated_at: string
  tdee_formula: number
  tdee_adaptive: number
  delta_kcal: number
  weight_samples: number
  calories_source: 'logs' | 'protocol'
  avg_intake_kcal: number
  weight_delta_kg: number
  protocol_updated: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNutritionStudio(
  clientId: string,
  existingProtocol?: NutritionProtocol,
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clientData, setClientData] = useState<NutritionClientData | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(true);
  const [protocolName, setProtocolName] = useState(
    existingProtocol?.name ?? "Nouveau protocole",
  );
  const [goal, setGoal] = useState<MacroGoal>("surplus");
  const [calorieAdjustPct, setCalorieAdjustPct] = useState(0);
  const [proteinOverride, setProteinOverride] = useState<number | null>(null);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    weeklyFrequency: 3,
    sessionDurationMin: 60,
    cardioFrequency: 0,
    cardioDurationMin: 0,
    dailySteps: 0,
    trainingCaloriesWeekly: null,
  });
  const [lifestyleConfig, setLifestyleConfig] = useState<LifestyleConfig>({
    stressLevel: null,
    sleepDurationH: null,
    sleepQuality: null,
    caffeineDailyMg: null,
    alcoholWeekly: null,
    workHoursPerWeek: null,
  });
  const [biometricsConfig, setBiometricsConfig] = useState<BiometricsConfig>({
    weight_kg: null,
    height_cm: null,
    body_fat_pct: null,
    lean_mass_kg: null,
    muscle_mass_kg: null,
    visceral_fat_level: null,
    bmr_kcal_measured: null,
    bmr_source: "estimated",
  });
  const [carbCycling, setCarbCycling] = useState<CarbCyclingConfig>({
    enabled: false,
    protocol: "3/1",
    goal: "bulk",
    phase: "hypertrophie",
    intensity: "moderee",
    insulin: "normale",
  });
  const [hydrationClimate, setHydrationClimate] =
    useState<HydrationClimate>("temperate");
  const [hydrationPhase, setHydrationPhase] = useState(100); // 0–200, 100 = baseline
  // Separate ref for the base hydration (before phase factor) — updated by debounced recalc
  const baseHydrationLitersRef = useRef<number | null>(null);
  const [days, setDays] = useState<DayDraft[]>([
    emptyDayDraft("Jour entraînement"),
    emptyDayDraft("Jour repos"),
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [macroResult, setMacroResult] = useState<MacroResult | null>(null);
  // Calories after goal factor but before calorieAdjustPct — used by the adjustment slider display
  const [goalCalories, setGoalCalories] = useState<number | null>(null);
  const [ccResult, setCcResult] = useState<CarbCyclingResult | null>(null);
  const [hydrationLiters, setHydrationLiters] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedProtocolId, setSavedProtocolId] = useState<string | null>(
    existingProtocol?.id ?? null,
  );
  const [tdeeAdaptive, setTdeeAdaptive] = useState<number | null>(null);
  const [tdeeAdaptiveAt, setTdeeAdaptiveAt] = useState<Date | null>(null);
  const [tdeeDataSource, setTdeeDataSource] = useState<'weight_delta' | 'formula_proxy' | null>(null);
  const [tdeeHistory, setTdeeHistory] = useState<TdeeHistoryEntry[]>([]);
  const [applyingAdaptive, setApplyingAdaptive] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [allSubmissions, setAllSubmissions] = useState<
    Array<{ id: string; date: string; status: string; submitted_at: string }>
  >([]);
  const [dataSource, setDataSource] = useState<
    Record<string, "selected" | "fallback">
  >({});
  const [trainingWeekSchedule, setTrainingWeekSchedule] =
    useState<TrainingWeekSchedule | null>(null);
  const [selectedScheduleDow, setSelectedScheduleDow] = useState<number | null>(
    null,
  );

  // ── Fetch client data ──────────────────────────────────────────────────────
  useEffect(() => {
    setClientLoading(true);
    const url = new URL(
      `/api/clients/${clientId}/nutrition-data`,
      typeof window !== "undefined" ? window.location.origin : "",
    );
    if (selectedSubmissionId) {
      url.searchParams.set("submissionId", selectedSubmissionId);
    }
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => {
        const cd: NutritionClientData = d.client;
        setClientData(cd);
        if (d.allSubmissions) {
          setAllSubmissions(d.allSubmissions);
        }
        if (d.selectedSubmissionId) {
          setSelectedSubmissionId(d.selectedSubmissionId);
        }
        if (d.dataSource) {
          setDataSource(d.dataSource);
        }
        if (d.tdeeAdaptive != null) setTdeeAdaptive(d.tdeeAdaptive);
        if (d.tdeeAdaptiveAt) setTdeeAdaptiveAt(new Date(d.tdeeAdaptiveAt));
        if (d.tdeeDataSource) setTdeeDataSource(d.tdeeDataSource);
        if (d.trainingWeekSchedule) {
          setTrainingWeekSchedule(d.trainingWeekSchedule);
        } else {
          setTrainingWeekSchedule(null);
        }
        if (cd.training_goal) {
          const mapped =
            CLIENT_GOAL_MAP[cd.training_goal.toLowerCase()] ?? "maintenance";
          setGoal(mapped);
          setCarbCycling((prev) => ({
            ...prev,
            goal: MACRO_TO_CC_GOAL[mapped],
          }));
        }
        setTrainingConfig({
          weeklyFrequency: cd.weekly_frequency ?? 3,
          sessionDurationMin: cd.session_duration_min ?? 60,
          cardioFrequency: cd.cardio_frequency ?? 0,
          cardioDurationMin: cd.cardio_duration_min ?? 0,
          dailySteps: cd.daily_steps ?? 0,
          trainingCaloriesWeekly: cd.training_calories_weekly,
        });
        setLifestyleConfig({
          stressLevel: cd.stress_level,
          sleepDurationH: cd.sleep_duration_h,
          sleepQuality: cd.sleep_quality,
          caffeineDailyMg: cd.caffeine_daily_mg,
          alcoholWeekly: cd.alcohol_weekly,
          workHoursPerWeek: cd.work_hours_per_week,
        });
        setBiometricsConfig({
          weight_kg: cd.weight_kg,
          height_cm: cd.height_cm,
          body_fat_pct: cd.body_fat_pct,
          lean_mass_kg: cd.lean_mass_kg,
          muscle_mass_kg: cd.muscle_mass_kg,
          visceral_fat_level: cd.visceral_fat_level,
          bmr_kcal_measured: cd.bmr_kcal_measured,
          bmr_source: cd.bmr_kcal_measured ? "measured" : "estimated",
        });
      })
      .then(() => {
        // Load TDEE history for current client
        fetch(`/api/clients/${clientId}/nutrition-tdee-history`)
          .then(r => r.ok ? r.json() : [])
          .then(setTdeeHistory)
          .catch(() => {})
      })
      .catch(() => {})
      .finally(() => setClientLoading(false));
  }, [clientId, selectedSubmissionId]);

  // ── Load existing protocol days ────────────────────────────────────────────
  useEffect(() => {
    if (existingProtocol?.days?.length) {
      setDays(existingProtocol.days.map(dayDraftFromDb));
      setProtocolName(existingProtocol.name);
    }
  }, [existingProtocol]);

  // ── Debounced recalculation ────────────────────────────────────────────────
  useEffect(() => {
    if (
      !clientData ||
      !clientData.weight_kg ||
      !clientData.height_cm ||
      !clientData.age
    )
      return;

    const cd = clientData;
    const weight = cd.weight_kg;
    const height = cd.height_cm;
    const age = cd.age;
    if (weight == null || height == null || age == null) return;

    const gender: MacroGender = cd.gender === "female" ? "female" : "male";

    const recalculate = () => {
      const input = {
        weight,
        height,
        age,
        gender,
        goal,
        bodyFat: cd.body_fat_pct ?? undefined,
        muscleMassKg: cd.muscle_mass_kg ?? undefined,
        bmrKcalMeasured: cd.bmr_kcal_measured ?? undefined,
        visceralFatLevel: cd.visceral_fat_level ?? undefined,
        steps: trainingConfig.dailySteps || undefined,
        occupationMultiplier: cd.occupation_multiplier ?? undefined,
        workHoursPerWeek: lifestyleConfig.workHoursPerWeek ?? undefined,
        workouts: trainingConfig.weeklyFrequency,
        sessionDurationMin: trainingConfig.sessionDurationMin,
        trainingCaloriesWeekly:
          trainingConfig.trainingCaloriesWeekly ?? undefined,
        cardioFrequency: trainingConfig.cardioFrequency || undefined,
        cardioDurationMin: trainingConfig.cardioDurationMin || undefined,
        stressLevel: lifestyleConfig.stressLevel ?? undefined,
        sleepDurationH: lifestyleConfig.sleepDurationH ?? undefined,
        sleepQuality: lifestyleConfig.sleepQuality ?? undefined,
        caffeineDaily: lifestyleConfig.caffeineDailyMg ?? undefined,
        alcoholWeekly: lifestyleConfig.alcoholWeekly ?? undefined,
      };

      const result = calculateMacros(input);
      // Store calories after goal factor, before manual adjustment — used by slider display
      const caloriesAfterGoal = result.calories;
      setGoalCalories(caloriesAfterGoal);
      if (calorieAdjustPct !== 0) {
        const factor = 1 + calorieAdjustPct / 100;
        result.calories = Math.round(result.calories * factor);
        const pKcal =
          proteinOverride != null
            ? Math.round(proteinOverride * result.leanMass) * 4
            : result.macros.p * 4;
        const fKcal = result.macros.f * 9;
        result.macros.c = Math.max(
          0,
          Math.round((result.calories - pKcal - fKcal) / 4),
        );
      }
      if (proteinOverride != null) {
        result.macros.p = Math.round(proteinOverride * result.leanMass);
        const remaining =
          result.calories - result.macros.p * 4 - result.macros.f * 9;
        result.macros.c = Math.max(0, Math.round(remaining / 4));
      }
      setMacroResult(result);

      if (carbCycling.enabled) {
        const ccInput = {
          gender: gender as "male" | "female",
          age,
          weight,
          height,
          bodyFat: cd.body_fat_pct ?? undefined,
          occupation: "sedentaire" as const,
          sessionsPerWeek: trainingConfig.weeklyFrequency,
          sessionDuration: trainingConfig.sessionDurationMin,
          intensity: carbCycling.intensity,
          goal: carbCycling.goal,
          phase: carbCycling.phase,
          protocol: carbCycling.protocol,
          insulin: carbCycling.insulin,
        };
        setCcResult(calculateCarbCycling(ccInput));
      } else {
        setCcResult(null);
      }

      const actLevel = getActivityLevel(cd);
      const hydInput = {
        weight,
        gender: gender as "male" | "female",
        activity: HYDRATION_ACTIVITY_MAP[actLevel],
        climate: hydrationClimate,
      };
      const hydResult = calculateHydration(hydInput);
      // Store base liters (without phase factor) so phase slider updates are instant
      baseHydrationLitersRef.current = hydResult.liters;
      const phaseFactor = hydrationPhase / 100;
      setHydrationLiters(Math.round(hydResult.liters * phaseFactor * 10) / 10);
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(recalculate, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    clientData,
    goal,
    calorieAdjustPct,
    proteinOverride,
    trainingConfig,
    lifestyleConfig,
    carbCycling,
    hydrationClimate,
  ]);

  // Instant update when only hydrationPhase changes — no debounce needed (pure multiplication)
  useEffect(() => {
    if (baseHydrationLitersRef.current === null) return;
    const phaseFactor = hydrationPhase / 100;
    setHydrationLiters(
      Math.round(baseHydrationLitersRef.current * phaseFactor * 10) / 10,
    );
  }, [hydrationPhase]);

  // ── Coherence Score ────────────────────────────────────────────────────────
  const coherenceScore = useMemo((): {
    score: number;
    checks: { label: string; ok: boolean; warning?: string }[];
  } => {
    if (!macroResult) return { score: 0, checks: [] };
    const checks: { label: string; ok: boolean; warning?: string }[] = [];
    const { macros, leanMass, calories } = macroResult;

    const protPerKg = leanMass > 0 ? macros.p / leanMass : 0;
    checks.push({
      label: "Protéines",
      ok: protPerKg >= 1.8,
      warning:
        protPerKg < 1.8
          ? `${protPerKg.toFixed(1)}g/kg LBM (min 1.8)`
          : undefined,
    });

    const fatPerKg = clientData ? macros.f / (clientData.weight_kg ?? 1) : 0;
    checks.push({
      label: "Lipides",
      ok: fatPerKg >= 0.6,
      warning: fatPerKg < 0.6 ? "Risque hormonal" : undefined,
    });

    const floor = clientData?.gender === "female" ? 1200 : 1500;
    checks.push({
      label: "Calories min.",
      ok: calories >= floor,
      warning:
        calories < floor ? `${calories} kcal sous le minimum` : undefined,
    });

    const carbsPerKg = clientData ? macros.c / (clientData.weight_kg ?? 1) : 0;
    const carbWarning = carbsPerKg > 8;
    checks.push({
      label: "Glucides",
      ok: !carbWarning,
      warning: carbWarning
        ? `${macros.c}g = ${carbsPerKg.toFixed(0)}g/kg — répartir 4-5 repas`
        : undefined,
    });

    checks.push({ label: "Hydratation", ok: hydrationLiters !== null });

    const passCount = checks.filter((c) => c.ok).length;
    const score = Math.round((passCount / checks.length) * 100);
    return { score, checks };
  }, [macroResult, hydrationLiters, clientData]);

  // ── Missing Data Alerts ────────────────────────────────────────────────────
  interface MissingAlert {
    field: string;
    category: "biometric" | "training" | "lifestyle";
    severity: "warning" | "critical";
    label: string;
  }

  const missingDataAlerts = useMemo((): MissingAlert[] => {
    if (!clientData) return [];
    const alerts: MissingAlert[] = [];

    // Critical biometric fields
    if (!clientData.bmr_kcal_measured) {
      alerts.push({
        field: "bmr",
        category: "biometric",
        severity: "critical",
        label: "[CRITICAL] BMR absent du bilan",
      });
    }
    if (!clientData.weight_kg) {
      alerts.push({
        field: "weight_kg",
        category: "biometric",
        severity: "critical",
        label: "[CRITICAL] Poids non renseigné",
      });
    }
    if (!clientData.body_fat_pct) {
      alerts.push({
        field: "body_fat_pct",
        category: "biometric",
        severity: "critical",
        label: "[CRITICAL] % Graisse corporelle absent",
      });
    }
    if (!clientData.height_cm) {
      alerts.push({
        field: "height_cm",
        category: "biometric",
        severity: "critical",
        label: "[CRITICAL] Taille non renseignée",
      });
    }

    // Warning training fields
    if (!clientData.weekly_frequency) {
      alerts.push({
        field: "weekly_frequency",
        category: "training",
        severity: "warning",
        label: "[WARNING] Fréquence d'entraînement non indiquée",
      });
    }
    if (!clientData.daily_steps) {
      alerts.push({
        field: "daily_steps",
        category: "training",
        severity: "warning",
        label: "[WARNING] Nombre de pas inconnu",
      });
    }

    return alerts;
  }, [clientData]);
  const updateDay = useCallback((index: number, patch: Partial<DayDraft>) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }, []);

  const addDay = useCallback(
    (name?: string) => {
      setDays((prev) => [
        ...prev,
        emptyDayDraft(name ?? `Jour ${prev.length + 1}`),
      ]);
      setActiveDayIndex(days.length);
    },
    [days.length],
  );

  const removeDay = useCallback((index: number) => {
    setDays((prev) => prev.filter((_, i) => i !== index));
    setActiveDayIndex((prev) => Math.max(0, prev >= index ? prev - 1 : prev));
  }, []);

  // ── Injection actions ──────────────────────────────────────────────────────
  const injectMacrosToDay = useCallback(
    (dayIndex: number) => {
      if (!macroResult) return;
      updateDay(dayIndex, {
        calories: String(macroResult.calories),
        protein_g: String(macroResult.macros.p),
        carbs_g: String(macroResult.macros.c),
        fat_g: String(macroResult.macros.f),
      });
    },
    [macroResult, updateDay],
  );

  const injectCCHighToDay = useCallback(
    (dayIndex: number) => {
      if (!ccResult) return;
      updateDay(dayIndex, {
        calories: String(ccResult.high.kcal),
        protein_g: String(ccResult.high.p),
        carbs_g: String(ccResult.high.c),
        fat_g: String(ccResult.high.f),
        carb_cycle_type: "high",
      });
    },
    [ccResult, updateDay],
  );

  const injectCCLowToDay = useCallback(
    (dayIndex: number) => {
      if (!ccResult) return;
      updateDay(dayIndex, {
        calories: String(ccResult.low.kcal),
        protein_g: String(ccResult.low.p),
        carbs_g: String(ccResult.low.c),
        fat_g: String(ccResult.low.f),
        carb_cycle_type: "low",
      });
    },
    [ccResult, updateDay],
  );

  const injectHydrationToDay = useCallback(
    (dayIndex: number) => {
      if (!hydrationLiters) return;
      updateDay(dayIndex, {
        hydration_ml: String(Math.round(hydrationLiters * 1000)),
      });
    },
    [hydrationLiters, updateDay],
  );

  const injectAllToDay = useCallback(
    (dayIndex: number) => {
      injectMacrosToDay(dayIndex);
      injectHydrationToDay(dayIndex);
    },
    [injectMacrosToDay, injectHydrationToDay],
  );

  // ── Save / Share ───────────────────────────────────────────────────────────
  const buildPayload = useCallback(
    () => ({
      name: protocolName,
      days: days.map((d, i) => ({
        name: d.name,
        position: i,
        calories: d.calories ? Number(d.calories) : null,
        protein_g: d.protein_g ? Number(d.protein_g) : null,
        carbs_g: d.carbs_g ? Number(d.carbs_g) : null,
        fat_g: d.fat_g ? Number(d.fat_g) : null,
        hydration_ml: d.hydration_ml ? Number(d.hydration_ml) : null,
        carb_cycle_type: d.carb_cycle_type || null,
        cycle_sync_phase: d.cycle_sync_phase || null,
        recommendations: d.recommendations || null,
      })),
    }),
    [protocolName, days],
  );

  const save = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const currentId = savedProtocolId ?? existingProtocol?.id;
      if (currentId) {
        await fetch(
          `/api/clients/${clientId}/nutrition-protocols/${currentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        return currentId;
      } else {
        const r = await fetch(`/api/clients/${clientId}/nutrition-protocols`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        const newId = d.protocol?.id ?? null;
        if (newId) setSavedProtocolId(newId);
        return newId;
      }
    } finally {
      setSaving(false);
    }
  }, [buildPayload, clientId, existingProtocol, savedProtocolId]);

  const share = useCallback(async () => {
    setSharing(true);
    try {
      const id = await save();
      if (!id) return;
      await fetch(`/api/clients/${clientId}/nutrition-protocols/${id}/share`, {
        method: "POST",
      });
    } finally {
      setSharing(false);
    }
  }, [save, clientId]);

  const applyAdaptiveTdee = useCallback(async () => {
    const currentId = savedProtocolId ?? existingProtocol?.id;
    if (!currentId) return;
    setApplyingAdaptive(true);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/nutrition-protocols/${currentId}/apply-adaptive-tdee`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTdeeAdaptive(data.tdeeAdaptive);
      setTdeeAdaptiveAt(new Date());
      fetch(`/api/clients/${clientId}/nutrition-tdee-history`)
        .then(r => r.ok ? r.json() : [])
        .then(setTdeeHistory)
        .catch(() => {});
    } finally {
      setApplyingAdaptive(false);
    }
  }, [clientId, savedProtocolId, existingProtocol]);

  return {
    clientData,
    clientLoading,
    protocolName,
    setProtocolName,
    goal,
    setGoal,
    calorieAdjustPct,
    setCalorieAdjustPct,
    proteinOverride,
    setProteinOverride,
    trainingConfig,
    setTrainingConfig,
    lifestyleConfig,
    setLifestyleConfig,
    biometricsConfig,
    setBiometricsConfig,
    carbCycling,
    setCarbCycling,
    hydrationClimate,
    setHydrationClimate,
    hydrationPhase,
    setHydrationPhase,
    days,
    activeDayIndex,
    setActiveDayIndex,
    macroResult,
    goalCalories,
    ccResult,
    hydrationLiters,
    coherenceScore,
    updateDay,
    addDay,
    removeDay,
    injectMacrosToDay,
    injectCCHighToDay,
    injectCCLowToDay,
    injectHydrationToDay,
    injectAllToDay,
    saving,
    sharing,
    showPreview,
    setShowPreview,
    save,
    share,
    selectedSubmissionId,
    setSelectedSubmissionId,
    allSubmissions,
    missingDataAlerts,
    dataSource,
    tdeeAdaptive,
    tdeeAdaptiveAt,
    tdeeDataSource,
    tdeeHistory,
    applyAdaptiveTdee,
    applyingAdaptive,
    trainingWeekSchedule,
    selectedScheduleDow,
    setSelectedScheduleDow,
  };
}
