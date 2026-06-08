# Spec — BottomNav v2 + ClientTopBar v2 (Technogym-inspired)

**Date:** 2026-05-19  
**Scope:** `/components/client/BottomNav.tsx` + `/components/client/ClientTopBar.tsx`  
**DS:** v3.0 — `#0d0d0d` bg, `#ffe01e` accent, Barlow Condensed

---

## Inspiration

Technogym.com footer section: radical noir/jaune contrast, flat geometry, uppercase condensed type, industrial grid. No gradients, no colored shadows, no rounded softness on structural elements.

---

## BottomNav v2

### Structure
- Full-width, flat, zero border-radius on the bar itself (`rounded-none`)
- Collée au bas de l'écran — `bottom-0 left-0 right-0`
- Fond `bg-[#0d0d0d]`
- Bordure top: `border-t border-white/[0.06]`
- Height: `h-[62px]` (inchangé)
- Safe area: `padding-bottom: max(0px, env(safe-area-inset-bottom))`
- Max-width supprimé — full edge-to-edge

### Onglet actif
- Bande top `4px` jaune: `absolute top-0 left-0 right-0 h-[4px] bg-[#ffe01e]`
- Fond: `bg-[#ffe01e]/[0.07]` couvrant tout l'onglet
- Icône: `#ffe01e`, weight `fill`
- Label: `#ffe01e`, `font-barlow-condensed font-bold uppercase tracking-[0.14em] text-[9px]`

### Onglet inactif
- Icône + label: `text-white/30`
- Label: même typo (`font-barlow-condensed font-bold uppercase tracking-[0.14em] text-[9px]`)
- Hover: `text-white/50`

### Bouton central STRYVR
- Conservé: `rounded-2xl h-12 w-12 bg-[#ffe01e]` — seule rondeur dans barre plate = tension visuelle intentionnelle
- Logo gris inchangé
- Animations rotate/scale/shadow: inchangées

### Action buttons (radial open)
- Border: `border border-[#ffe01e]/40`
- Fond: `bg-[#1c1a00]`
- Radius: `rounded-none` (flat, cohérent avec la barre) → changé de `rounded-xl`
- Icône: `text-[#ffe01e]`

### Supprimé
- `max-w-[480px] px-4` wrapper — barre full-width sans padding horizontal
- `rounded-xl` sur le conteneur principal
- `shadow-[0_-12px_40px_rgba(0,0,0,0.7)]` — plus de shadow colorée

---

## ClientTopBar v2

### Structure
- `fixed top-0 left-0 right-0 z-40 h-14`
- Fond: `bg-[#0d0d0d]` — inchangé
- Bordure bottom: `border-b border-white/[0.06]` + subtle jaune via `box-shadow: 0 1px 0 rgba(255,224,30,0.12)`
- Padding left: `pl-6` (espace pour la bande accent)

### Bande accent gauche
- `absolute left-0 top-3 bottom-3 w-[3px] bg-[#ffe01e] rounded-full`
- Marqueur industriel — présent sur TOUTES les pages (pas contextuel)

### Typographie
- Section: `text-[9px] font-barlow-condensed font-bold uppercase tracking-[0.22em] text-white/30`
- Titre: `text-[15px] font-barlow-condensed font-bold uppercase tracking-[0.12em] text-white leading-tight` (up de 13px → 15px)

### Bouton back
- Conservé: `h-8 w-8 rounded-xl bg-white/[0.06]` — seule rondeur dans un header flat
- Position: avant le bloc section/titre, après la bande accent

### Right slot
- Inchangé — `shrink-0` container

---

## Invariants DS v3.0 respectés
- `rounded-[2px]` INTERDIT — aucune occurrence
- Aucune shadow colorée
- Aucun gradient coloré
- Borders: `border-white/[0.06]` ou plus faible
- Texte sur jaune: `#0d0d0d` (bouton central logo)
- Police: `font-barlow-condensed` sur tous les labels nav
