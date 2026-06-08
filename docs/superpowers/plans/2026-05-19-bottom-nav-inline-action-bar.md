# Bottom Nav Inline Action Bar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken radial floating menu with an inline action bar that swaps nav tabs for action buttons directly inside the BottomNav bar.

**Architecture:** `BottomNav.tsx` absorbs all action logic — logo tap toggles `open` state, nav tabs slide out, 4 yellow action buttons slide in from center. `RadialActionMenu.tsx` is deleted. All motion via Framer Motion `AnimatePresence` + `motion` components.

**Tech Stack:** Next.js App Router, Framer Motion, Phosphor Icons, Tailwind CSS, DS v3.0 tokens

---

## File Map

| Action | File |
|--------|------|
| Modify | `components/client/BottomNav.tsx` |
| Delete | `components/client/smart/RadialActionMenu.tsx` |

---

### Task 1: Delete RadialActionMenu + clean up imports

**Files:**
- Delete: `components/client/smart/RadialActionMenu.tsx`
- Modify: `components/client/BottomNav.tsx`

- [ ] **Step 1: Delete the file**

```bash
rm /Users/user/Desktop/STRYVLAB/components/client/smart/RadialActionMenu.tsx
```

- [ ] **Step 2: Remove RadialActionMenu from BottomNav**

In `components/client/BottomNav.tsx`, remove:
```tsx
import RadialActionMenu from "./smart/RadialActionMenu";
```

And remove the render:
```tsx
<RadialActionMenu
  open={radialOpen}
  onClose={() => setRadialOpen(false)}
  onOpenWater={() => setWaterOpen(true)}
  onOpenActivity={() => setActivityOpen(true)}
/>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep -E "RadialAction|BottomNav"
```

Expected: no errors related to RadialAction or BottomNav.

- [ ] **Step 4: Commit**

```bash
git add components/client/BottomNav.tsx components/client/smart/RadialActionMenu.tsx
git commit -m "chore(nav): remove RadialActionMenu — replaced by inline action bar"
```

---

### Task 2: Add action constants and state to BottomNav

**Files:**
- Modify: `components/client/BottomNav.tsx`

- [ ] **Step 1: Add action definitions above the component**

After the `NAV` array, add:

```tsx
import { ForkKnife, Drop, PersonSimpleRun, ClipboardText } from "@phosphor-icons/react";

type ActionId = 'meal' | 'water' | 'activity' | 'checkin'

const ACTIONS: { id: ActionId; Icon: React.ElementType; labelKey: string }[] = [
  { id: 'meal',     Icon: ForkKnife,       labelKey: 'smart.radial.meal' },
  { id: 'water',    Icon: Drop,            labelKey: 'smart.radial.water' },
  { id: 'activity', Icon: PersonSimpleRun, labelKey: 'smart.radial.activity' },
  { id: 'checkin',  Icon: ClipboardText,   labelKey: 'smart.radial.checkin' },
]
```

Note: `ForkKnife` and `ForkKnife` are already imported in the original file — verify and deduplicate.

- [ ] **Step 2: Add MealLogSheet import**

```tsx
import MealLogSheet from "./smart/MealLogSheet";
```

- [ ] **Step 3: Add `mealOpen` state inside the component**

Inside `BottomNav`, add alongside existing state:

```tsx
const [mealOpen, setMealOpen] = useState(false);
```

- [ ] **Step 4: Add handleAction function inside the component**

```tsx
const router = useRouter(); // add import: import { useRouter } from "next/navigation";

function handleAction(id: ActionId) {
  setRadialOpen(false)
  switch (id) {
    case 'meal':
      setMealOpen(true)
      break
    case 'water':
      setWaterOpen(true)
      break
    case 'activity':
      setActivityOpen(true)
      break
    case 'checkin': {
      const hour = new Date().getHours()
      router.push(`/client/checkin/${hour < 14 ? 'morning' : 'evening'}`)
      break
    }
  }
}
```

- [ ] **Step 5: Add MealLogSheet render** (alongside existing QuickWaterModal and FreeActivitySheet)

```tsx
<MealLogSheet
  open={mealOpen}
  onClose={() => setMealOpen(false)}
  onSuccess={() => { setMealOpen(false); router.refresh() }}
/>
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | grep "BottomNav"
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/client/BottomNav.tsx
git commit -m "feat(nav): add action constants and handlers to BottomNav"
```

---

### Task 3: Build the animated inline action bar

**Files:**
- Modify: `components/client/BottomNav.tsx`

This task rewrites the nav bar JSX to support the open/close swap animation.

- [ ] **Step 1: Add AnimatePresence import**

Ensure top of file has:
```tsx
import { motion, AnimatePresence } from "framer-motion";
```

- [ ] **Step 2: Replace the nav bar inner JSX**

Replace the entire `<div className="flex items-center rounded-xl ...">` block with:

```tsx
<div className="flex items-center rounded-xl border border-white/[0.08] bg-[#0d0d0d] backdrop-blur-md shadow-[0_-12px_40px_rgba(0,0,0,0.7)] px-2 h-[62px] overflow-hidden">

  {/* Left slot — 2 nav tabs OR 2 action buttons */}
  <AnimatePresence mode="wait" initial={false}>
    {!radialOpen ? (
      <motion.div
        key="nav-left"
        className="flex flex-1"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {NAV.slice(0, 2).map(({ href, labelKey, Icon }, idx) => {
          const routeActive = href === "/client" ? pathname === "/client" : pathname.startsWith(href)
          const active = routeActive || highlightedNavIndex === idx
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-[62px] transition-all duration-200 active:scale-[0.92] ${
                active ? "text-[#ffe01e]" : "text-white/35 hover:text-white/60"
              }`}
            >
              {active && (
                <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />
              )}
              <Icon size={24} weight={active ? "fill" : "regular"} className="relative z-10" />
              <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide ${
                active ? "text-[#ffe01e]" : "text-white/30"
              }`}>
                {t(labelKey)}
              </span>
            </Link>
          )
        })}
      </motion.div>
    ) : (
      <motion.div
        key="action-left"
        className="flex flex-1 items-center justify-around"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {ACTIONS.slice(0, 2).map(({ id, Icon, labelKey }, i) => (
          <motion.button
            key={id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 420, damping: 26 }}
            onClick={() => handleAction(id)}
            aria-label={String(t(labelKey as any))}
            className="w-12 h-12 rounded-2xl bg-[#ffe01e] flex items-center justify-center active:scale-[0.92] transition-transform"
          >
            <Icon size={22} weight="fill" className="text-[#0d0d0d]" />
          </motion.button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>

  {/* Center logo button */}
  <div className="flex items-center justify-center px-2 shrink-0">
    <motion.button
      onClick={() => setRadialOpen((v) => !v)}
      aria-label="Logger"
      animate={radialOpen
        ? { rotate: 45, scale: 0.94, boxShadow: "0 0 24px rgba(255,224,30,0.6)" }
        : { rotate: 0, scale: 1, boxShadow: "0 0 14px rgba(255,224,30,0.3)" }
      }
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="h-12 w-12 rounded-2xl bg-[#ffe01e] flex items-center justify-center text-[#0d0d0d]"
    >
      <Image
        src="/logo/Logo STRYVR (grey).svg"
        width={28}
        height={28}
        alt="STRYVR"
        className="relative z-10"
      />
    </motion.button>
  </div>

  {/* Right slot — 2 nav tabs OR 2 action buttons */}
  <AnimatePresence mode="wait" initial={false}>
    {!radialOpen ? (
      <motion.div
        key="nav-right"
        className="flex flex-1"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {NAV.slice(2).map(({ href, labelKey, Icon }, idx) => {
          const realIdx = idx + 2
          const routeActive = pathname.startsWith(href)
          const active = routeActive || highlightedNavIndex === realIdx
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-[4px] flex-1 h-[62px] transition-all duration-200 active:scale-[0.92] ${
                active ? "text-[#ffe01e]" : "text-white/35 hover:text-white/60"
              }`}
            >
              {active && (
                <span className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#ffe01e]/[0.10]" />
              )}
              <Icon size={24} weight={active ? "fill" : "regular"} className="relative z-10" />
              <span className={`relative z-10 text-[10px] font-semibold leading-none tracking-wide ${
                active ? "text-[#ffe01e]" : "text-white/30"
              }`}>
                {t(labelKey)}
              </span>
            </Link>
          )
        })}
      </motion.div>
    ) : (
      <motion.div
        key="action-right"
        className="flex flex-1 items-center justify-around"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {ACTIONS.slice(2).map(({ id, Icon, labelKey }, i) => (
          <motion.button
            key={id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 420, damping: 26 }}
            onClick={() => handleAction(id)}
            aria-label={String(t(labelKey as any))}
            className="w-12 h-12 rounded-2xl bg-[#ffe01e] flex items-center justify-center active:scale-[0.92] transition-transform"
          >
            <Icon size={22} weight="fill" className="text-[#0d0d0d]" />
          </motion.button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>

</div>
```

- [ ] **Step 3: Add backdrop**

Just above the `<nav>` element, add:

```tsx
<AnimatePresence>
  {radialOpen && (
    <motion.div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
      onClick={() => setRadialOpen(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 4: Add Escape key handler**

Inside the component, add:

```tsx
useEffect(() => {
  if (!radialOpen) return
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRadialOpen(false) }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [radialOpen])
```

Add `useEffect` to imports if not already present.

- [ ] **Step 5: Verify TypeScript — zero errors**

```bash
cd /Users/user/Desktop/STRYVLAB && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 new errors.

- [ ] **Step 6: Update CHANGELOG.md**

Add at top of today's section:

```
## 2026-05-19

FEATURE: Replace RadialActionMenu with inline action bar in BottomNav — slide animation, logo rotate 45°
CHORE: Delete RadialActionMenu.tsx
```

- [ ] **Step 7: Commit**

```bash
git add components/client/BottomNav.tsx CHANGELOG.md
git commit -m "feat(nav): inline action bar — slide swap, logo rotates 45deg on open"
```

---

## Self-Review Checklist

- [x] Spec: logo rotates 45° → `animate={{ rotate: 45 }}` ✅
- [x] Spec: nav tabs slide out left/right → `exit={{ x: ±40 }}` ✅
- [x] Spec: action buttons slide from center → `initial={{ x: ±40 }}` reversed ✅
- [x] Spec: action buttons `w-12 h-12 rounded-2xl bg-[#ffe01e]`, no label ✅
- [x] Spec: backdrop `bg-black/40 backdrop-blur-[2px]` ✅
- [x] Spec: Escape closes ✅
- [x] Spec: `RadialActionMenu.tsx` deleted ✅
- [x] DS v3.0: `#0d0d0d` bg, `#ffe01e` accent, `rounded-2xl` buttons ✅
- [x] `handleAction` uses same logic as deleted `RadialActionMenu` ✅
- [x] `MealLogSheet` render added with `router.refresh()` on success ✅
