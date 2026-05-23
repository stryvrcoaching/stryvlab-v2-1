"use client";

import { useRef, useMemo } from "react";
import { Eye, Save, Send, Loader2 } from "lucide-react";
import { useNutritionStudio } from "./useNutritionStudio";
import ClientIntelligencePanel from "./ClientIntelligencePanel";
import CalculationEngine from "./CalculationEngine";
import ProtocolCanvas from "./ProtocolCanvas";
import ClientPreviewModal from "./ClientPreviewModal";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import type { NutritionProtocol } from "@/lib/nutrition/types";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  existingProtocol?: NutritionProtocol;
}

export default function NutritionStudio({ clientId, existingProtocol }: Props) {
  const router = useRouter();
  const studio = useNutritionStudio(clientId, existingProtocol);

  const clientName = studio.clientData?.name ?? "Client";
  const leanMass =
    studio.clientData?.lean_mass_kg ?? studio.macroResult?.leanMass ?? null;
  const clientIntelligenceMacroResult = studio.macroResult
    ? {
        leanMass: studio.macroResult.leanMass,
        estimatedBF: studio.macroResult.estimatedBF,
        breakdown: {
          bmr: studio.macroResult.breakdown.bmr,
          tdee: studio.macroResult.tdee,
        },
      }
    : null;

  // Refs so TopBar closures always call the latest save/share even after memoization
  const saveRef = useRef(studio.save);
  const shareRef = useRef(studio.share);
  const showPreviewRef = useRef(studio.setShowPreview);
  saveRef.current = studio.save;
  shareRef.current = studio.share;
  showPreviewRef.current = studio.setShowPreview;

  const rightContent = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => showPreviewRef.current(true)}
          className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all flex items-center gap-1.5"
        >
          <Eye size={14} />
          Aperçu
        </button>
        <button
          onClick={() => saveRef.current()}
          className="h-8 px-3 rounded-lg bg-white/[0.04] border-[0.3px] border-white/[0.06] text-[12px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all flex items-center gap-1.5"
        >
          <Save size={14} />
          Brouillon
        </button>
        <button
          onClick={async () => {
            await shareRef.current();
            router.push(`/coach/clients/${clientId}/protocoles/nutrition`);
          }}
          className="h-8 px-4 rounded-lg bg-[#1f8a65] text-[12px] font-bold text-white hover:bg-[#217356] active:scale-[0.98] transition-all flex items-center gap-1.5"
        >
          <Send size={14} />
          Partager
        </button>
      </div>
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ),
    [],
  );

  useClientTopBar("Nutrition Studio", rightContent);

  return (
    <main className="h-screen bg-[#121212] flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0">
        {/* Col 1 — Client Intelligence (300px fixed) */}
        <div className="w-[300px] shrink-0 border-r border-white/[0.04] overflow-hidden">
          <ClientIntelligencePanel
            clientId={clientId}
            clientData={studio.clientData}
            loading={studio.clientLoading}
            trainingConfig={studio.trainingConfig}
            lifestyleConfig={studio.lifestyleConfig}
            biometricsConfig={studio.biometricsConfig}
            onTrainingChange={(patch) =>
              studio.setTrainingConfig((prev) => ({ ...prev, ...patch }))
            }
            onLifestyleChange={(patch) =>
              studio.setLifestyleConfig((prev) => ({ ...prev, ...patch }))
            }
            onBiometricsChange={(patch) =>
              studio.setBiometricsConfig((prev) => ({ ...prev, ...patch }))
            }
            macroResult={clientIntelligenceMacroResult}
            submissions={studio.allSubmissions}
            selectedSubmissionId={studio.selectedSubmissionId}
            onSubmissionChange={studio.setSelectedSubmissionId}
            dataSource={studio.dataSource}
          />
        </div>

        {/* Col 2 — Calculation Engine (flex) */}
        <div className="flex-1 border-r border-white/[0.04] overflow-hidden min-w-0">
          <CalculationEngine
            goal={studio.goal}
            onGoalChange={studio.setGoal}
            calorieAdjustPct={studio.calorieAdjustPct}
            onCalorieAdjustChange={studio.setCalorieAdjustPct}
            proteinOverride={studio.proteinOverride}
            onProteinOverrideChange={studio.setProteinOverride}
            macroResult={studio.macroResult}
            goalCalories={studio.goalCalories}
            carbCycling={studio.carbCycling}
            onCarbCyclingChange={(patch) =>
              studio.setCarbCycling((prev) => ({ ...prev, ...patch }))
            }
            ccResult={studio.ccResult}
            hydrationClimate={studio.hydrationClimate}
            onHydrationClimateChange={studio.setHydrationClimate}
            hydrationPhase={studio.hydrationPhase}
            onHydrationPhaseChange={studio.setHydrationPhase}
            hydrationLiters={studio.hydrationLiters}
            leanMass={leanMass}
            tdeeAdaptive={studio.tdeeAdaptive}
            tdeeAdaptiveAt={studio.tdeeAdaptiveAt}
            tdeeDataSource={studio.tdeeDataSource}
            tdeeHistory={studio.tdeeHistory}
            applyAdaptiveTdee={studio.applyAdaptiveTdee}
            applyingAdaptive={studio.applyingAdaptive}
          />
        </div>

        {/* Col 3 — Protocol Canvas (480px fixed — expanded from 380px) */}
        <div className="w-[480px] shrink-0 overflow-hidden">
          <ProtocolCanvas
            loading={studio.clientLoading}
            protocolName={studio.protocolName}
            onProtocolNameChange={studio.setProtocolName}
            days={studio.days}
            activeDayIndex={studio.activeDayIndex}
            onActiveDayChange={studio.setActiveDayIndex}
            onUpdateDay={studio.updateDay}
            onAddDay={studio.addDay}
            onRemoveDay={studio.removeDay}
            onInjectMacros={studio.injectMacrosToDay}
            onInjectCCHigh={studio.injectCCHighToDay}
            onInjectCCLow={studio.injectCCLowToDay}
            onInjectHydration={studio.injectHydrationToDay}
            onInjectAll={studio.injectAllToDay}
            hasMacroResult={studio.macroResult !== null}
            hasCcResult={studio.ccResult !== null}
            ccResult={studio.ccResult}
            hasHydration={studio.hydrationLiters !== null}
            coherenceScore={studio.coherenceScore}
            trainingWeekSchedule={studio.trainingWeekSchedule}
            selectedScheduleDow={studio.selectedScheduleDow}
            onSelectScheduleDow={studio.setSelectedScheduleDow}
          />
        </div>
      </div>

      {/* Client preview modal */}
      {studio.showPreview && (
        <ClientPreviewModal
          clientName={clientName}
          protocolName={studio.protocolName}
          days={studio.days}
          onClose={() => studio.setShowPreview(false)}
        />
      )}
    </main>
  );
}
