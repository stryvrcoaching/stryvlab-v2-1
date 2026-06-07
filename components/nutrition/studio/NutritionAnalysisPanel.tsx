"use client";

import { NUTRITION_UI_COLORS } from "@/lib/nutrition/ui-colors";
import NutritionRealityMiniDay from "./NutritionRealityMiniDay";
import type { NutritionRealityView } from "./useNutritionReality";

type NutritionAnalysisPanelProps = {
  loading: boolean;
  error: string | null;
  activeWindow: 3 | 7;
  onWindowChange: (window: 3 | 7) => void;
  onOpenHub: () => void;
  view: NutritionRealityView | null;
};

type TrendPoint = {
  date: string;
  consumed: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    hydration_ml: number;
  };
  target: {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    hydration_ml: number | null;
  };
};

type MetricCardProps = {
  label: string;
  value: number | null;
  accent: string;
};

type TrendMiniCardProps = {
  label: string;
  accent: string;
  unit: string;
  targetLabel: string;
  consumedLabel: string;
  points: TrendPoint[];
  metric: keyof TrendPoint["consumed"];
  tall?: boolean;
};

const CHART_W = 260;
const CHART_H = 120;
const CHART_PAD = { top: 10, right: 8, bottom: 18, left: 28 };

function svgPath(points: Array<[number, number]>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  const d = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];

  for (let index = 1; index < points.length; index += 1) {
    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    const cpx = (x0 + x1) / 2;
    d.push(
      `C ${cpx.toFixed(1)} ${y0.toFixed(1)}, ${cpx.toFixed(1)} ${y1.toFixed(
        1,
      )}, ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    );
  }

  return d.join(" ");
}

function formatPercent(value: number | null) {
  return value == null ? "N/A" : `${Math.round(value * 100)}%`;
}

function getMetricTone(value: number | null) {
  if (value == null) return "text-white";
  if (value > 1.05) return "text-[#ff8660]";
  if (value < 0.9) return "text-[#ffd15e]";
  return "text-[#8ef0c7]";
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: accent }}>
        {label}
      </p>
      <p className={`mt-2 text-[22px] font-semibold ${getMetricTone(value)}`}>
        {formatPercent(value)}
      </p>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function buildTrendRows(points: TrendPoint[], metric: keyof TrendPoint["consumed"]) {
  return points.map((point) => ({
    date: formatShortDate(point.date),
    rawDate: point.date,
    consumed: point.consumed[metric] ?? 0,
    target: point.target[metric] ?? 0,
  }));
}

function TrendMiniCard({
  label,
  accent,
  unit,
  targetLabel,
  consumedLabel,
  points,
  metric,
  tall = false,
}: TrendMiniCardProps) {
  const data = buildTrendRows(points, metric);
  const values = data.flatMap((point) => [point.consumed, point.target]);
  const minY = Math.min(...values) - 40;
  const maxY = Math.max(...values) + 40;
  const innerW = CHART_W - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;
  const toX = (index: number) =>
    CHART_PAD.left +
    (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const toY = (value: number) =>
    CHART_PAD.top + innerH - ((value - minY) / (maxY - minY || 1)) * innerH;
  const consumedPts: Array<[number, number]> = data.map((point, index) => [
    toX(index),
    toY(point.consumed),
  ]);
  const targetPts: Array<[number, number]> = data.map((point, index) => [
    toX(index),
    toY(point.target),
  ]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
        Consommé vs réel
      </p>
      <p className="mt-1 text-[18px] font-semibold text-white">{label}</p>
      <div className={tall ? "mt-3" : "mt-3"}>
        <svg
          viewBox={`0 0 ${CHART_W} ${tall ? 152 : CHART_H}`}
          className={tall ? "h-36 w-full" : "h-28 w-full"}
          preserveAspectRatio="none"
        >
          <path
            d={svgPath(targetPts)}
            fill="none"
            stroke="#d9f3e5"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={svgPath(consumedPts)}
            fill="none"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {consumedPts.map(([x, y], index) => (
            <circle
              key={`${label}-${index}`}
              cx={x}
              cy={y}
              r={index === consumedPts.length - 1 ? 3 : 1.8}
              fill={accent}
            />
          ))}
          {data.length >= 2 ? (
            <>
              <text
                x={CHART_PAD.left}
                y={(tall ? 152 : CHART_H) - 2}
                textAnchor="start"
                fontSize="8"
                fill="rgba(255,255,255,0.26)"
              >
                {data[0].date}
              </text>
              <text
                x={CHART_W - CHART_PAD.right}
                y={(tall ? 152 : CHART_H) - 2}
                textAnchor="end"
                fontSize="8"
                fill="rgba(255,255,255,0.26)"
              >
                {data[data.length - 1].date}
              </text>
            </>
          ) : null}
        </svg>
        <div className="mt-2 flex items-center gap-4 text-[9px] text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-5 rounded" style={{ backgroundColor: accent }} />
            <span>{consumedLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-5 rounded bg-[#d9f3e5]" />
            <span>{targetLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NutritionAnalysisPanel({
  loading,
  error,
  activeWindow,
  onWindowChange,
  onOpenHub,
  view,
}: NutritionAnalysisPanelProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 animate-pulse">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="h-3 w-28 rounded bg-white/[0.06]" />
            <div className="mt-4 h-10 w-24 rounded bg-white/[0.06]" />
            <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
            <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="h-3 w-16 rounded bg-white/[0.06]" />
                <div className="mt-3 h-7 w-16 rounded bg-white/[0.06]" />
                <div className="mt-2 h-3 w-full rounded bg-white/[0.05]" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="mt-4 space-y-3">
              <div className="h-16 rounded-xl bg-white/[0.05]" />
              <div className="h-16 rounded-xl bg-white/[0.05]" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="h-3 w-32 rounded bg-white/[0.06]" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-white/[0.04] p-3">
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                  <div className="mt-2 h-5 w-20 rounded bg-white/[0.06]" />
                  <div className="mt-3 h-24 rounded bg-white/[0.05]" />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
              <div className="h-3 w-24 rounded bg-white/[0.06]" />
              <div className="mt-2 h-5 w-20 rounded bg-white/[0.06]" />
              <div className="mt-3 h-36 rounded bg-white/[0.05]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm font-semibold text-white">Analyse indisponible</p>
          <p className="mt-2 text-[11px] leading-relaxed text-red-200/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold text-white">
            Pas encore assez de données nutritionnelles
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-white/50">
            Les journées réelles apparaîtront ici dès que le client loguera repas et
            hydratation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-10">
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                Analyse nutritionnelle
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                Lecture de la réalité observée pendant la construction du protocole.
              </p>
            </div>
            <button
              onClick={onOpenHub}
              className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white/80"
            >
              Ouvrir le hub
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                Score global nutrition
              </p>
              <p className="mt-1 text-[30px] font-semibold text-white">
                {formatPercent(view.summary.nutritionScore)}
              </p>
            </div>
            <div className="flex gap-2">
              {view.availableWindows.map((windowValue) => (
                <button
                  key={windowValue}
                  onClick={() => onWindowChange(windowValue)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    activeWindow === windowValue
                      ? "bg-[#1f8a65] text-white"
                      : "bg-white/[0.04] text-white/55"
                  }`}
                >
                  {windowValue}j
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard
              label="Calories"
              value={view.summary.achievedCalories}
              accent={NUTRITION_UI_COLORS.calories}
            />
            <MetricCard
              label="Protéines"
              value={view.summary.achievedProtein}
              accent={NUTRITION_UI_COLORS.protein}
            />
            <MetricCard
              label="Glucides"
              value={view.summary.achievedCarbs}
              accent={NUTRITION_UI_COLORS.carbs}
            />
            <MetricCard
              label="Lipides"
              value={view.summary.achievedFat}
              accent={NUTRITION_UI_COLORS.fat}
            />
            <div className="col-span-2">
              <MetricCard
                label="Hydratation"
                value={view.summary.achievedHydration}
                accent={NUTRITION_UI_COLORS.water}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Signaux clés
          </p>
          <div className="mt-4 space-y-2">
            {view.topInsights.length > 0 ? (
              view.topInsights.map((insight) => (
                <div key={insight.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-white">{insight.title}</p>
                  <p className="mt-1 text-[10px] text-white/50">{insight.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] font-semibold text-white">
                  Aucun signal prioritaire sur la fenêtre active.
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/50">
                  Les données observées ne montrent pas d’alerte nutritionnelle majeure à
                  ce stade.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Consommé vs réel
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <TrendMiniCard
              label="Calories"
              accent={NUTRITION_UI_COLORS.calories}
              unit=" kcal"
              targetLabel="Cible"
              consumedLabel="Consommé"
              points={view.trendPoints}
              metric="calories"
            />
            <TrendMiniCard
              label="Protéines"
              accent={NUTRITION_UI_COLORS.protein}
              unit=" g"
              targetLabel="Cible"
              consumedLabel="Consommé"
              points={view.trendPoints}
              metric="protein_g"
            />
            <TrendMiniCard
              label="Glucides"
              accent={NUTRITION_UI_COLORS.carbs}
              unit=" g"
              targetLabel="Cible"
              consumedLabel="Consommé"
              points={view.trendPoints}
              metric="carbs_g"
            />
            <TrendMiniCard
              label="Lipides"
              accent={NUTRITION_UI_COLORS.fat}
              unit=" g"
              targetLabel="Cible"
              consumedLabel="Consommé"
              points={view.trendPoints}
              metric="fat_g"
            />
          </div>
          <div className="mt-3">
            <TrendMiniCard
              label="Hydratation"
              accent={NUTRITION_UI_COLORS.water}
              unit=" ml"
              targetLabel="Cible"
              consumedLabel="Consommé"
              points={view.trendPoints}
              metric="hydration_ml"
              tall
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Dernières journées observées
          </p>
          <div className="mt-4 space-y-2">
            {view.recentDays.map((day) => (
              <NutritionRealityMiniDay key={day.date} day={day} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
