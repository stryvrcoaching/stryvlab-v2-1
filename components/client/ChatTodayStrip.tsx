"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Barbell, ForkKnife, Drop, CheckCircle, Circle } from "@phosphor-icons/react"
import dynamic from "next/dynamic"

const QuickWaterModal = dynamic(() => import("@/components/client/QuickWaterModal"), { ssr: false })

interface TodayStrip {
  sessions: { id: string; name: string }[]
  calories: { logged: number; target: number }
  water: { logged: number; target: number }
  checkin: { morning: boolean; evening: boolean }
}

interface ChatTodayStripProps {
  onCheckinClick?: () => void
}

export default function ChatTodayStrip({ onCheckinClick }: ChatTodayStripProps) {
  const router = useRouter()
  const [data, setData] = useState<TodayStrip | null>(null)
  const [waterOpen, setWaterOpen] = useState(false)

  function refresh() {
    fetch("/api/client/chat/today-strip")
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res && !res.error && res.checkin) {
          setData(res)
        } else {
          setData(null)
        }
      })
      .catch(() => setData(null))
  }

  useEffect(() => { refresh() }, [])

  if (!data || !data.checkin) {
    return (
      <div className="shrink-0 h-[44px] bg-[#080808] flex items-center px-4 gap-2">
        {[80, 120, 100].map(w => (
          <div key={w} className="h-[26px] bg-[#111111] rounded-xl animate-pulse" style={{ width: w }} />
        ))}
      </div>
    )
  }

  const morningDone = data.checkin?.morning ?? false
  const eveningDone = data.checkin?.evening ?? false
  const checkinDone = morningDone && eveningDone
  const pendingCount = Number(!morningDone) + Number(!eveningDone)
  const calPct = data.calories?.target > 0 ? Math.min((data.calories?.logged ?? 0) / data.calories.target, 1) : 0
  const waterPct = data.water?.target > 0 ? Math.min((data.water?.logged ?? 0) / data.water.target, 1) : 0

  return (
    <>
      <div className="shrink-0 bg-[#080808]">
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">

          {/* Check-in */}
          <button
            onClick={onCheckinClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0 active:opacity-70 transition-all ${
              checkinDone ? "bg-[#222222]" : "bg-[#1a1a1a]"
            }`}
          >
            {checkinDone
              ? <CheckCircle size={13} weight="fill" className="text-[#f2f2f2]" />
              : <Circle size={13} className="text-[#808080]" />
            }
            <span className={`text-[11px] font-barlow font-semibold whitespace-nowrap ${checkinDone ? "text-[#f2f2f2]" : "text-[#808080]"}`}>
              {checkinDone ? "Check-ins ✓" : pendingCount === 2 ? "Check-ins (2)" : "Check-in (1)"}
            </span>
          </button>

          {/* Sessions du jour */}
          {data.sessions.map(s => (
            <button
              key={s.id}
              onClick={() => router.push("/client/programme")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111111] shrink-0 active:opacity-70"
            >
              <Barbell size={13} className="text-[#5a5a5a]" />
              <span className="text-[11px] font-barlow font-medium text-[#808080] whitespace-nowrap max-w-[100px] truncate">
                {s.name}
              </span>
            </button>
          ))}

          {/* Calories */}
          <button
            onClick={() => router.push("/client/nutrition")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111111] shrink-0 active:opacity-70"
          >
            <ForkKnife size={13} className="text-[#5a5a5a]" />
            <span className="text-[11px] font-barlow font-medium text-[#808080] whitespace-nowrap">
              {data.calories.logged} <span className="text-[#5a5a5a]">/ {data.calories.target}</span>
            </span>
            <div className="w-10 h-1 bg-[#2e2e2e] rounded-full overflow-hidden">
              <div className="h-full bg-[#b0b0b0] rounded-full transition-all" style={{ width: `${calPct * 100}%` }} />
            </div>
          </button>

          {/* Eau */}
          <button
            onClick={() => setWaterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111111] shrink-0 active:opacity-70"
          >
            <Drop size={13} className="text-[#5a5a5a]" />
            <span className="text-[11px] font-barlow font-medium text-[#808080] whitespace-nowrap">
              {(data.water.logged / 1000).toFixed(1)}<span className="text-[#5a5a5a]">L / {data.water.target / 1000}L</span>
            </span>
            <div className="w-8 h-1 bg-[#2e2e2e] rounded-full overflow-hidden">
              <div className="h-full bg-[#b0b0b0] rounded-full transition-all" style={{ width: `${waterPct * 100}%` }} />
            </div>
          </button>

        </div>
      </div>

      <QuickWaterModal
        open={waterOpen}
        onClose={() => { setWaterOpen(false); refresh() }}
      />
    </>
  )
}
