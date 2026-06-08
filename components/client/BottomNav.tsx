"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircle, Barbell, ForkKnife, ChartLine, Plus } from "@phosphor-icons/react";
import { useClientT } from "./ClientI18nProvider";
import { useTour } from "./TourContext";
import type { ClientDictKey } from "@/lib/i18n/clientTranslations";
import dynamic from "next/dynamic";

const QuickLogSheet = dynamic(() => import("@/components/client/QuickLogSheet"), { ssr: false });

const LEFT_NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client",           labelKey: "nav.chat",      Icon: ChatCircle },
  { href: "/client/programme", labelKey: "nav.programme", Icon: Barbell },
];
const RIGHT_NAV: { href: string; labelKey: ClientDictKey; Icon: React.ElementType }[] = [
  { href: "/client/nutrition", labelKey: "nav.nutrition", Icon: ForkKnife },
  { href: "/client/metrics",   labelKey: "nav.metrics",   Icon: ChartLine },
];

export default function BottomNav() {
  const pathname                = usePathname();
  const { t }                   = useClientT();
  const { highlightedNavIndex } = useTour();
  const [logOpen, setLogOpen]   = useState(false);
  const [chatPendingCheckins, setChatPendingCheckins] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/client/chat/today-strip")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.checkin) return;
        const pending = Number(!data.checkin?.morning) + Number(!data.checkin?.evening);
        setChatPendingCheckins(pending);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  function isActive(href: string, idx: number, offset = 0) {
    const navIdx = offset + idx;
    if (highlightedNavIndex === navIdx) return true;
    if (href === "/client") return pathname === "/client";
    return pathname.startsWith(href);
  }

  const navItem = (
    href: string,
    labelKey: ClientDictKey,
    Icon: React.ElementType,
    active: boolean,
  ) => (
    <Link
      key={href}
      href={href}
      className="flex flex-col items-center justify-center gap-[5px] flex-1 h-full"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Pill active wrapping the icon */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width:        active ? 48 : 36,
          height:       28,
          borderRadius: 14,
          background:   active ? "#f2f2f2" : "transparent",
          transition:   "width 320ms cubic-bezier(0.34,1.56,0.64,1), background 220ms ease",
        }}
      >
        <Icon
          size={active ? 15 : 19}
          weight={active ? "fill" : "regular"}
          style={{
            color:      active ? "#080808" : "#4a4a4a",
            transition: "color 220ms ease",
            display:    "block",
          }}
        />

        {/* Checkin badge */}
        {href === "/client" && chatPendingCheckins > 0 && (
          <span
            className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full text-[8px] leading-[14px] text-center font-bold tabular-nums"
            style={{ background: "#A67C52", color: "#080808" }}
          >
            {chatPendingCheckins}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        className="text-[8.5px] font-barlow-condensed font-bold uppercase tracking-[0.14em] leading-none"
        style={{
          color:      active ? "#c8c8c8" : "#383838",
          transition: "color 220ms ease",
        }}
      >
        {t(labelKey)}
      </span>
    </Link>
  );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pointer-events-auto w-full max-w-[520px] px-4 pb-3">
          <div
            className="flex items-center h-[62px] px-1"
            style={{
              background:            "rgba(12,12,12,0.94)",
              backdropFilter:        "blur(28px) saturate(160%)",
              WebkitBackdropFilter:  "blur(28px) saturate(160%)",
              borderRadius:          22,
              border:                "0.5px solid rgba(255,255,255,0.065)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.04) inset, " +
                "0 12px 40px rgba(0,0,0,0.65), " +
                "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {/* Left tabs */}
            {LEFT_NAV.map(({ href, labelKey, Icon }, i) =>
              navItem(href, labelKey, Icon, isActive(href, i, 0))
            )}

            {/* Central FAB */}
            <div className="flex flex-col items-center justify-center flex-1 h-full">
              <button
                onClick={() => setLogOpen((v) => !v)}
                aria-label="Logger une série"
                style={{
                  width:                  44,
                  height:                 44,
                  borderRadius:           "50%",
                  background:             "#f2f2f2",
                  display:                "flex",
                  alignItems:             "center",
                  justifyContent:         "center",
                  flexShrink:             0,
                  border:                 "0.5px solid rgba(255,255,255,0.10)",
                  boxShadow:
                    "0 2px 14px rgba(0,0,0,0.55), " +
                    "0 1px 0 rgba(255,255,255,0.18) inset",
                  WebkitTapHighlightColor: "transparent",
                  // transition géré inline — voir pointer events
                }}
                onPointerDown={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(0.87)";
                  el.style.boxShadow  = "0 1px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.14) inset";
                }}
                onPointerUp={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(1)";
                  el.style.boxShadow  = "0 2px 14px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.18) inset";
                }}
                onPointerLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform  = "scale(1)";
                  el.style.boxShadow  = "0 2px 14px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.18) inset";
                }}
              >
                <Plus
                  size={17}
                  weight="bold"
                  style={{
                    color:      "#080808",
                    display:    "block",
                    transform:  logOpen ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 320ms cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </button>
            </div>

            {/* Right tabs */}
            {RIGHT_NAV.map(({ href, labelKey, Icon }, i) =>
              navItem(href, labelKey, Icon, isActive(href, i, 2))
            )}
          </div>
        </div>
      </nav>

      <QuickLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
