# Bottom Nav — Inline Action Bar Design

**Date:** 2026-05-19  
**Scope:** Replace `RadialActionMenu` floating buttons with inline action bar inside `BottomNav`  
**Replaces:** `components/client/smart/RadialActionMenu.tsx` (deleted)  
**Modifies:** `components/client/BottomNav.tsx`

---

## Problem

Current radial menu spawns 4 buttons positioned via CSS `cos/sin` math anchored to FAB center. Alignment breaks across devices due to `safe-area-inset-bottom` variance. Visual style (large yellow circles) not appreciated.

---

## Design

### Normal state (unchanged)

```
[🏠 Accueil] [🏋 Programme]  [LOGO]  [🍴 Nutrition] [👤 Profil]
```

Nav bar: `bg-[#0d0d0d]`, `rounded-xl`, `h-[62px]`, 4 onglets + logo `#ffe01e rounded-2xl`.

---

### Open state (logo tapped)

```
[🍴] [💧]  [✕-logo]  [🏃] [✅]
```

- Logo rotates 45° → visually becomes ✕ (Framer Motion `rotate: 45`)
- Left 2 nav items slide out left (`x: -40px, opacity: 0`)
- Right 2 nav items slide out right (`x: +40px, opacity: 0`)
- 4 action buttons slide in from center (`x: 0 → final position`, spring)
- Backdrop: `bg-black/40 backdrop-blur-[2px]` covers page content above nav

### Action buttons style

- Size: `w-12 h-12 rounded-2xl`
- Background: `bg-[#ffe01e]`
- Icon: Phosphor, 22px, `weight="fill"`, `text-[#0d0d0d]`
- **No label text** (distinct from nav tabs)
- Tap feedback: `active:scale-[0.92]`

### Action button layout

Slot positions identical to nav tabs — 2 left of logo, 2 right:

| Slot | Action | Icon |
|------|--------|------|
| Left-1 | Repas (MealLogSheet) | `ForkKnife` |
| Left-2 | Eau (QuickWaterModal) | `Drop` |
| Right-1 | Sport (FreeActivitySheet) | `PersonSimpleRun` |
| Right-2 | Check-in | `ClipboardText` |

---

## Animation spec

### Logo button

```
rotate: 0 → 45deg (open)
rotate: 45 → 0deg (close)
transition: spring, stiffness 400, damping 28
```

### Nav tabs exit (open)

```
Left tabs:  x: 0 → -40, opacity: 1 → 0, duration 180ms ease-out
Right tabs: x: 0 → +40, opacity: 1 → 0, duration 180ms ease-out
```

### Action buttons enter (open)

```
x: 0 → final slot position, opacity: 0 → 1
transition: spring, stiffness 420, damping 26, mass 0.8
stagger: 30ms between buttons (outer first → inner last)
```

### Close: all animations reversed.

---

## Component architecture

### `BottomNav.tsx` changes

- Remove `<RadialActionMenu>` import and render
- Add `open` state (boolean)
- Use `AnimatePresence` + `motion.div` for tab/action swap
- Inline all action logic (same handlers as current RadialActionMenu)
- Keep `<QuickWaterModal>`, `<FreeActivitySheet>`, `<MealLogSheet>` renders

### `RadialActionMenu.tsx`

- **Delete** — fully replaced by inline logic in BottomNav

---

## Backdrop behavior

- Tap backdrop → close (same as today)
- `Escape` key → close
- Tapping an action button → execute action + close

---

## DS v3.0 compliance

- Background: `#0d0d0d` ✅
- Surface buttons: `#ffe01e` ✅  
- Text on yellow: `#0d0d0d` ✅
- Radius: `rounded-2xl` (action buttons), `rounded-xl` (nav bar) ✅
- No colored shadows (`shadow-*`) ✅
- No `rounded-[2px]` ✅
