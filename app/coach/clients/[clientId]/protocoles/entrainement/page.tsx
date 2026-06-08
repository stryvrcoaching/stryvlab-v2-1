"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Library, Plus } from "lucide-react";
import { useClient } from "@/lib/client-context";
import { useClientTopBar } from "@/components/clients/useClientTopBar";
import ClientTopBarLeft from "@/components/clients/ClientTopBarLeft";
import ClientProgramsList from "@/components/programs/ClientProgramsList";
import ProgramTemplateBuilder from "@/components/programs/ProgramTemplateBuilder";
import AssignTemplateModal from "@/components/programs/AssignTemplateModal";
import { type ClientProfile } from "@/lib/matching/template-matcher";

interface Program {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  status: "active" | "archived";
  is_client_visible: boolean;
  created_at: string;
  goal?: string;
  level?: string;
  frequency?: number;
  muscle_tags?: string[];
  equipment_archetype?: string;
  session_mode?: string;
  program_sessions?: any[];
}

export default function EntrainementPage() {
  const { client, clientId } = useClient();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Bloquer le scroll de la page quand le builder est ouvert
  useEffect(() => {
    if (selectedProgram) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [selectedProgram])

  const clientProfile: ClientProfile = useMemo(() => ({
    equipment_category: (client as any)?.equipment_category ?? null,
    fitness_level: (client as any)?.fitness_level ?? null,
    training_goal: (client as any)?.training_goal ?? null,
    weekly_frequency: (client as any)?.weekly_frequency ?? null,
  }), [client]);

  const clientName = client
    ? `${(client as any).first_name ?? ""} ${(client as any).last_name ?? ""}`.trim()
    : "";

  const handleAssigned = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const listTopBarRight = useMemo(() => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowAssignModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] text-white/60 text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-white/[0.08] hover:text-white/80 transition-all active:scale-[0.98]"
      >
        <Library size={12} />
        Assigner un template
      </button>
      <button
        onClick={async () => {
          const res = await fetch("/api/programs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: clientId, name: "Nouveau programme", weeks: 4 }),
          });
          const d = await res.json();
          if (res.ok && d.program) {
            setSelectedProgram({ ...d.program, is_client_visible: d.program.is_client_visible ?? false });
          }
        }}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1f8a65] text-white text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-[#217356] transition-all active:scale-[0.98]"
      >
        <Plus size={12} />
        Nouveau programme
      </button>
    </div>
  ), [clientId]);

  // Builder left node — stable, only changes when client data changes
  const builderTopBarLeft = useMemo(
    () => <ClientTopBarLeft pageLabel="Entraînement" client={client} />,
    [client]
  );

  // Show list TopBar when no program selected; Builder owns TopBar when editing
  useClientTopBar(selectedProgram ? "" : "Entraînement", selectedProgram ? undefined : listTopBarRight);

  return (
    <main className={selectedProgram ? "h-[calc(100vh-88px)] overflow-hidden bg-[#121212] flex flex-col" : "min-h-screen bg-[#121212]"}>
      <div className={selectedProgram ? "flex-1 min-h-0 h-full" : "px-6 pb-24"}>
        {selectedProgram ? (
          <ProgramTemplateBuilder
            initial={selectedProgram}
            programId={selectedProgram.id}
            clientId={clientId}
            topBarLeft={builderTopBarLeft}
            noFullscreen
            onSaved={(saved) => {
              setSelectedProgram((prev) =>
                prev ? { ...prev, name: saved?.name ?? prev.name } : prev
              );
            }}
            onCancel={() => setSelectedProgram(null)}
          />
        ) : (
          <>
            <div className="pt-5 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                Programmes d&apos;entraînement
              </p>
            </div>
            <ClientProgramsList
              key={refreshKey}
              clientId={clientId}
              onSelectProgram={(p) => setSelectedProgram(p as Program)}
            />
          </>
        )}
      </div>

      {showAssignModal && (
        <AssignTemplateModal
          clientId={clientId}
          clientProfile={clientProfile}
          clientName={clientName}
          onClose={() => setShowAssignModal(false)}
          onAssigned={handleAssigned}
        />
      )}
    </main>
  );
}
