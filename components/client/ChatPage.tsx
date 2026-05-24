"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatTodayStrip from "./ChatTodayStrip";
import ChatConversation from "./ChatConversation";
import ChatInputBar from "./ChatInputBar";
import { type ChatMessage, type InteractiveMetadata } from "./ChatBubble";
import {
  ActiveCheckinFlow,
  type CheckinFlowHandle,
} from "./checkin/CheckinFlow";
import {
  MORNING_FLOW,
  EVENING_FLOW,
  type CheckinData,
} from "@/lib/client/checkin/flows";
import { determineFlow } from "@/lib/client/checkin/checkinEngine";
import { computePhysiologicalDate } from "@/lib/nutrition/physiological-date";

const QUICK_SUGGESTIONS = [
  "Comment je récupère après ma séance ?",
  "Aide-moi avec ma nutrition",
  "Programme pour aujourd'hui",
];

interface ChatPageProps {
  coachAvatarUrl?: string | null;
  coachInitial?: string | null;
  clientFirstName?: string | null;
}

type TodayData = {
  sessions: { id: string; name: string }[];
  checkin: { morning: boolean; evening: boolean };
  calories: { logged: number; target: number };
  water: { logged: number; target: number };
};

export default function ChatPage({
  coachAvatarUrl,
  coachInitial,
  clientFirstName,
}: ChatPageProps) {
  // Debug: remove once avatar issue resolved
  if (typeof window !== "undefined") {
    console.log(
      "[ChatPage] coachAvatarUrl:",
      coachAvatarUrl,
      "| coachInitial:",
      coachInitial,
    );
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState(20);
  const [initialized, setInitialized] = useState(false);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [activeFlow, setActiveFlow] = useState<"morning" | "evening" | null>(
    null,
  );
  const [flowKey, setFlowKey] = useState(0);
  const [flowHandle, setFlowHandle] = useState<CheckinFlowHandle | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback(
    (id: string, metaPatch: Partial<InteractiveMetadata>) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          return {
            ...m,
            metadata: {
              ...(m.metadata ?? {}),
              ...metaPatch,
            } as InteractiveMetadata,
          };
        }),
      );
    },
    [],
  );

  const handleFlowComplete = useCallback(
    async (
      data: CheckinData,
      summary: string,
      flowType: "morning" | "evening",
    ) => {
      setActiveFlow(null);
      setIsLoading(true);

      const today = computePhysiologicalDate(new Date());
      try {
        const res = await fetch("/api/client/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow_type: flowType,
            date: today,
            data,
            summary,
          }),
        });
        const json = await res.json();
        if (json.botMessage) {
          setMessages((prev) => [...prev, json.botMessage]);
        }
        if (json.remaining !== undefined) setRemaining(json.remaining);
        // Refresh today strip to update check-in status
        fetch("/api/client/chat/today-strip")
          .then((r) => r.json())
          .then((todayRaw) => {
            if (todayRaw && !todayRaw.error && todayRaw.checkin) {
              setTodayData(todayRaw);
            } else {
              setTodayData(null);
            }
          })
          .catch(() => {});
      } catch {
        // Silent fail — check-in was saved
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Load messages + today data on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/client/chat/messages").then((r) => r.json()),
      fetch("/api/client/chat/today-strip").then((r) => r.json()),
    ])
      .then(([msgData, todayRaw]) => {
        setMessages(msgData.messages ?? []);
        if (todayRaw && !todayRaw.error && todayRaw.checkin) {
          setTodayData(todayRaw);
        } else {
          setTodayData(null);
        }
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  const handleCheckinClick = useCallback(() => {
    if (!todayData || !todayData.checkin) return;
    const currentHour = new Date().getHours();
    const chatSessions = [
      {
        flow_type: "morning",
        completed_at: todayData.checkin.morning ? "done" : null,
      },
      {
        flow_type: "evening",
        completed_at: todayData.checkin.evening ? "done" : null,
      },
    ];
    const flow = determineFlow(currentHour, chatSessions);

    if (!flow) {
      setMessages((prev) => [
        ...prev,
        {
          id: `done-${Date.now()}`,
          role: "assistant",
          content: "Check-ins du jour terminés ✓ Reviens demain !",
          message_type: "text",
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    setActiveFlow(flow);
    setFlowKey((k) => k + 1);
  }, [todayData]);

  const hasSessionToday = Boolean(todayData?.sessions?.length);

  const handleInteract = useCallback(
    (messageId: string, key: string, value: number) => {
      if (key === "trigger_checkin") {
        updateMessage(messageId, { answered: true });
        handleCheckinClick();
        return;
      }
      flowHandle?.handleInteract(messageId, key, value);
    },
    [flowHandle, handleCheckinClick, updateMessage],
  );

  const handleSkip = useCallback(
    (messageId: string, key: string) => {
      flowHandle?.handleSkip(messageId, key);
    },
    [flowHandle],
  );

  const handleSend = useCallback(
    async (content: string, type = "text") => {
      if (isLoading || remaining <= 0) return;

      const tempId = `tmp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: "user",
          content,
          message_type: type,
          created_at: new Date().toISOString(),
        },
      ]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/client/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, message_type: type }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempId),
            data.userMessage,
            data.botMessage,
          ]);
          setRemaining(data.remaining ?? 0);
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, remaining],
  );

  const isEmpty = initialized && messages.length === 0;

  return (
    <div
      className="fixed inset-x-0 top-0 flex min-h-0 flex-col bg-[#080808] overflow-hidden"
      style={{
        bottom: "calc(80px + max(env(safe-area-inset-bottom, 0px), 16px))",
      }}
    >
      {/* Active flow — renders null, manages flow state */}
      {activeFlow && (
        <ActiveCheckinFlow
          key={flowKey}
          flow={activeFlow === "morning" ? MORNING_FLOW : EVENING_FLOW}
          hasSessionToday={hasSessionToday}
          clientFirstName={clientFirstName}
          onAddMessage={addMessage}
          onUpdateMessage={updateMessage}
          onComplete={handleFlowComplete}
          onHandle={setFlowHandle}
        />
      )}

      <ChatTodayStrip onCheckinClick={handleCheckinClick} />

      {isEmpty ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 gap-5 overflow-hidden">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-[72px] h-[72px] rounded-full bg-[#111111] flex items-center justify-center"
          >
            {coachAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coachAvatarUrl}
                alt="Coach"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-[26px] font-barlow-condensed font-bold text-[#b0b0b0]">
                {coachInitial ?? "C"}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <p className="text-[17px] font-barlow font-semibold text-white leading-snug">
              {clientFirstName ? `Bonjour ${clientFirstName} 👋` : "Bonjour 👋"}
            </p>
            <p className="text-[13px] text-[#5a5a5a] font-barlow mt-1">
              Pose-moi une question ou fais ton check-in.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="flex flex-wrap gap-2 justify-center w-full max-w-[320px]"
          >
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-2 bg-[#1a1a1a] rounded-xl text-[12px] font-barlow text-[#808080] active:bg-[#222222] active:text-[#e0e0e0] transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        </div>
      ) : (
        <ChatConversation
          messages={messages}
          coachAvatarUrl={coachAvatarUrl}
          coachInitial={coachInitial}
          isLoading={isLoading}
          onInteract={handleInteract}
          onSkip={handleSkip}
        />
      )}

      <AnimatePresence>
        {remaining <= 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="px-4 py-2 text-center text-[11px] text-[#5a5a5a] font-barlow bg-[#111111]">
              Limite journalière atteinte · Reviens demain
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInputBar
        onSend={handleSend}
        disabled={isLoading || remaining <= 0 || activeFlow !== null}
      />
    </div>
  );
}
