"use client";

import type { ReactNode } from "react";
import { NUTRITION_UI_COLORS } from "@/lib/nutrition/ui-colors";
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

type TdeePoint = {
  calculated_at: string;
  tdee_adaptive: number;
  tdee_formula: number;
  delta_kcal: number;
  avg_intake_kcal: number;
  weight_delta_kg: number;
  weight_samples: number;
};

type NutritionEnergyAnalyticsProps = {
  points: TrendPoint[];
  energy?: {
    protocolTdee: number | null;
    protocolTdeeAt: string | null;
    tdeeDataSource: string | null;
    tdeeHistory: TdeePoint[];
  } | null;
};

type SmallLegendProps = {
  items: Array<{ label: string; color: string; dashed?: boolean }>;
};

type TdeeAdaptiveCardProps = {
  history: TdeePoint[];
  protocolTdee: number | null;
};

type EnergyLineCardProps = {
  label: string;
  value: string;
  detail: string;
  points: Array<Record<string, number | string>>;
  lineKey: string;
  referenceKey?: string;
  lineColor: string;
  referenceColor?: string;
  footer: Array<{ label: string; value: string; tone?: string }>;
};

const W = 320;
const H = 132;
const PAD = { top: 12, right: 8, bottom: 20, left: 38 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function formatDate(iso: string) {
  const date = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function svgPath(points: [number, number][]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  const d: string[] = [
    `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`,
  ];

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

function buildIntakePoints(points: TrendPoint[]) {
  return points
    .filter((point) => point.consumed.calories > 0)
    .map((point) => ({
      date: point.date,
      consumed: point.consumed.calories,
      target: point.target.calories ?? 0,
    }));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function EnergyCardShell({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[24px] border border-white/[0.05] bg-[#111111] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)] md:p-5">
      <p className="font-barlow-condensed text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
        {eyebrow}
      </p>
      <p className="mt-1 text-[26px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-white/50">{detail}</p>
      {children}
    </article>
  );
}

function SmallLegend({ items }: SmallLegendProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.dashed ? (
            <svg width="20" height="4" aria-hidden="true">
              <line
                x1="0"
                y1="2"
                x2="20"
                y2="2"
                stroke={item.color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
          ) : (
            <div
              className="h-[2px] w-6 rounded"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="text-[9px] text-white/40">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function TdeeAdaptiveCard({ history, protocolTdee }: TdeeAdaptiveCardProps) {
  const latest = history[history.length - 1] ?? null;
  const hasHistory = history.length > 0;
  const fallbackValue = protocolTdee ?? 0;
  const allAdaptive = history.map((point) => point.tdee_adaptive);
  const allFormula = history.map((point) => point.tdee_formula);
  const values = hasHistory ? [...allAdaptive, ...allFormula] : [fallbackValue];
  const minY = Math.min(...values) - 100;
  const maxY = Math.max(...values) + 100;
  const bandMin = hasHistory ? Math.min(...allAdaptive) : fallbackValue;
  const bandMax = hasHistory ? Math.max(...allAdaptive) : fallbackValue;

  const toX = (index: number) =>
    PAD.left +
    (history.length <= 1 ? INNER_W / 2 : (index / (history.length - 1)) * INNER_W);
  const toY = (value: number) =>
    PAD.top + INNER_H - ((value - minY) / (maxY - minY || 1)) * INNER_H;

  const adaptivePts: [number, number][] = history.map((point, index) => [
    toX(index),
    toY(point.tdee_adaptive),
  ]);
  const formulaPts: [number, number][] = history.map((point, index) => [
    toX(index),
    toY(point.tdee_formula),
  ]);
  const bandTopPts: [number, number][] = history.map((_, index) => [
    toX(index),
    toY(bandMax),
  ]);
  const bandBotPts: [number, number][] = history
    .map((_, index) => [toX(index), toY(bandMin)] as [number, number])
    .reverse();
  const bandPath =
    svgPath(bandTopPts) +
    " L " +
    bandBotPts.map((point) => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" L ") +
    " Z";

  return (
    <EnergyCardShell
      eyebrow="Dépense énergétique"
      title="TDEE adaptatif"
      detail="Lecture de la dépense de maintien observée sur la fenêtre active, avec sa plage de flux."
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-black tabular-nums text-white">
          {latest
            ? latest.tdee_adaptive.toLocaleString("fr-FR")
            : protocolTdee?.toLocaleString("fr-FR") ?? "N/A"}
        </span>
        <span className="text-[10px] text-white/40">kcal/jour</span>
      </div>

      {hasHistory ? (
        <>
          <div className="mt-4 overflow-hidden">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-[132px] w-full"
              preserveAspectRatio="none"
            >
              <path d={bandPath} fill="rgba(255,224,30,0.07)" stroke="none" />
              <path
                d={svgPath(formulaPts)}
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <path
                d={svgPath(adaptivePts)}
                fill="none"
                stroke="#f2f2f2"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {adaptivePts.map(([x, y], index) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r={index === adaptivePts.length - 1 ? 3 : 1.8}
                  fill={index === adaptivePts.length - 1 ? "#f2f2f2" : "rgba(255,224,30,0.62)"}
                />
              ))}
            </svg>
          </div>
          <SmallLegend
            items={[
              { label: "Adaptatif", color: "#f2f2f2" },
              { label: "Formule", color: "rgba(255,255,255,0.28)", dashed: true },
              { label: "Plage flux", color: "rgba(255,224,30,0.2)" },
            ]}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                Vs formule
              </p>
              <p className="text-[12px] font-black tabular-nums text-white">
                {latest
                  ? `${latest.tdee_adaptive - latest.tdee_formula >= 0 ? "+" : ""}${Math.round(
                      latest.tdee_adaptive - latest.tdee_formula,
                    )} kcal`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                Flux min
              </p>
              <p className="text-[12px] font-black tabular-nums text-white">
                {Math.round(bandMin)} kcal
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                Flux max
              </p>
              <p className="text-[12px] font-black tabular-nums text-white">
                {Math.round(bandMax)} kcal
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-[12px] leading-relaxed text-white/46">
          TDEE adaptatif disponible dès qu&apos;un historique a été calculé pour ce client.
        </p>
      )}
    </EnergyCardShell>
  );
}

function EnergyLineCard({
  label,
  value,
  detail,
  points,
  lineKey,
  referenceKey,
  lineColor,
  referenceColor,
  footer,
}: EnergyLineCardProps) {
  if (points.length === 0) {
    return (
      <EnergyCardShell eyebrow={label} title={value} detail={detail}>
        <p className="mt-4 text-[12px] leading-relaxed text-white/46">
          Pas encore assez de données sur la fenêtre active pour tracer cette lecture.
        </p>
      </EnergyCardShell>
    );
  }

  const values = points.flatMap((point) => {
    const line = Number(point[lineKey] ?? 0);
    const ref =
      referenceKey && point[referenceKey] != null ? Number(point[referenceKey]) : null;
    return ref == null ? [line] : [line, ref];
  });
  const minY = Math.min(...values) - 80;
  const maxY = Math.max(...values) + 80;
  const toX = (index: number) =>
    PAD.left +
    (points.length <= 1 ? INNER_W / 2 : (index / (points.length - 1)) * INNER_W);
  const toY = (value: number) =>
    PAD.top + INNER_H - ((value - minY) / (maxY - minY || 1)) * INNER_H;

  const linePts: [number, number][] = points.map((point, index) => [
    toX(index),
    toY(Number(point[lineKey] ?? 0)),
  ]);
  const refPts: [number, number][] =
    referenceKey == null
      ? []
      : points.map((point, index) => [
          toX(index),
          toY(Number(point[referenceKey] ?? 0)),
        ]);

  return (
    <EnergyCardShell eyebrow={label} title={value} detail={detail}>
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[132px] w-full"
          preserveAspectRatio="none"
        >
          {referenceKey ? (
            <path
              d={svgPath(refPts)}
              fill="none"
              stroke={referenceColor}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          <path
            d={svgPath(linePts)}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {linePts.map(([x, y], index) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={index === linePts.length - 1 ? 3 : 1.8}
              fill={lineColor}
            />
          ))}
        </svg>
      </div>
      <SmallLegend
        items={[
          { label: "Mesure", color: lineColor },
          ...(referenceKey && referenceColor
            ? [{ label: "Référence", color: referenceColor }]
            : []),
        ]}
      />
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
        {footer.map((item) => (
          <div key={item.label}>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
              {item.label}
            </p>
            <p className={`text-[12px] font-black tabular-nums ${item.tone ?? "text-white"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </EnergyCardShell>
  );
}

export default function NutritionEnergyAnalytics({
  points,
  energy,
}: NutritionEnergyAnalyticsProps) {
  const intakePoints = buildIntakePoints(points);

  const variationPoints = intakePoints
    .map((point, index) => {
      if (index === 0) return null;
      return {
        date: point.date,
        delta: point.consumed - intakePoints[index - 1].consumed,
      };
    })
    .filter((point): point is { date: string; delta: number } => point !== null);

  const tdeeVsIntakePoints =
    energy?.protocolTdee != null
      ? intakePoints.map((point) => {
          const historyMatch = energy.tdeeHistory.find(
            (entry) => entry.calculated_at.slice(0, 10) === point.date,
          );
          const fallbackHistory = [...(energy.tdeeHistory ?? [])]
            .filter((entry) => entry.calculated_at.slice(0, 10) <= point.date)
            .pop();
          const reference =
            historyMatch?.tdee_adaptive ??
            fallbackHistory?.tdee_adaptive ??
            energy.protocolTdee ??
            0;
          return {
            date: point.date,
            intake: point.consumed,
            reference,
            gap: point.consumed - reference,
          };
        })
      : [];

  const targetPoints = intakePoints.map((point) => ({
    date: point.date,
    intake: point.consumed,
    reference: point.target,
    gap: point.consumed - point.target,
  }));

  const meanGapVsTdee =
    tdeeVsIntakePoints.length > 0
      ? Math.round(
          tdeeVsIntakePoints.reduce((sum, point) => sum + point.gap, 0) /
            tdeeVsIntakePoints.length,
        )
      : null;
  const meanGapVsTarget =
    targetPoints.length > 0
      ? Math.round(
          targetPoints.reduce((sum, point) => sum + point.gap, 0) / targetPoints.length,
        )
      : null;
  const averageVariation =
    variationPoints.length > 0
      ? Math.round(
          variationPoints.reduce((sum, point) => sum + Math.abs(point.delta), 0) /
            variationPoints.length,
        )
      : 0;

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <TdeeAdaptiveCard
        history={energy?.tdeeHistory ?? []}
        protocolTdee={energy?.protocolTdee ?? null}
      />

      <EnergyLineCard
        label="Énergie"
        value="Variation kcal/jour"
        detail="Mesure la volatilité quotidienne de l’apport calorique. Un écart élevé signale une exécution instable du protocole."
        points={variationPoints}
        lineKey="delta"
        lineColor={NUTRITION_UI_COLORS.calories}
        footer={[
          { label: "Amplitude moy.", value: `${averageVariation} kcal` },
          {
            label: "Plus haut",
            value:
              variationPoints.length > 0
                ? `${Math.max(...variationPoints.map((point) => point.delta)) >= 0 ? "+" : ""}${Math.max(...variationPoints.map((point) => point.delta))} kcal`
                : "N/A",
          },
          {
            label: "Plus bas",
            value:
              variationPoints.length > 0
                ? `${Math.min(...variationPoints.map((point) => point.delta))} kcal`
                : "N/A",
          },
        ]}
      />

      <EnergyLineCard
        label="Énergie"
        value="TDEE vs apport réel"
        detail="Compare l’apport réel à la dépense de maintien observée pour voir si le client évolue plutôt en déficit, à maintien, ou en surplus."
        points={tdeeVsIntakePoints}
        lineKey="intake"
        referenceKey="reference"
        lineColor="#f2f2f2"
        referenceColor={NUTRITION_UI_COLORS.calories}
        footer={[
          {
            label: "Écart moy.",
            value:
              meanGapVsTdee != null
                ? `${meanGapVsTdee >= 0 ? "+" : ""}${meanGapVsTdee} kcal`
                : "N/A",
            tone:
              meanGapVsTdee != null
                ? meanGapVsTdee > 0
                  ? "text-[#ffd15e]"
                  : "text-[#8ef0c7]"
                : "text-white",
          },
          {
            label: "Jours déficit",
            value: `${tdeeVsIntakePoints.filter((point) => point.gap < -50).length}j`,
          },
          {
            label: "Jours surplus",
            value: `${tdeeVsIntakePoints.filter((point) => point.gap > 50).length}j`,
          },
        ]}
      />

      <EnergyLineCard
        label="Énergie"
        value="Consommé vs cible"
        detail="Version coach du suivi calorique : lecture nette des jours sous cible, conformes, ou au-dessus de la prescription."
        points={targetPoints}
        lineKey="intake"
        referenceKey="reference"
        lineColor="#f2f2f2"
        referenceColor={NUTRITION_UI_COLORS.carbs}
        footer={[
          {
            label: "Écart moy.",
            value:
              meanGapVsTarget != null
                ? `${meanGapVsTarget >= 0 ? "+" : ""}${meanGapVsTarget} kcal`
                : "N/A",
            tone:
              meanGapVsTarget != null
                ? meanGapVsTarget > 0
                  ? "text-[#ffd15e]"
                  : "text-[#8ef0c7]"
                : "text-white",
          },
          {
            label: "Sous cible",
            value: `${targetPoints.filter((point) => point.gap < -50).length}j`,
          },
          {
            label: "Sur cible",
            value: `${targetPoints.filter((point) => point.gap > 50).length}j`,
          },
        ]}
      />
    </section>
  );
}
