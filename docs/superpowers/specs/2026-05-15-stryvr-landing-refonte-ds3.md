# STRYVR Landing — Refonte DS v3.0

**Date :** 2026-05-15
**Scope :** `/app/stryvr/` — landing page bêta complète

---

## Positionnement

STRYVR n'est pas une app fitness. C'est un **système de transformation physique** (perte de poids, prise de masse, débutant → athlète) qui connaît l'utilisateur mieux qu'un coach humain. Science-backed, temps réel, anticipatif. Un double digital.

**Ton :** Humain dans le wording, premium/épuré/data dans le visuel.

---

## Design System

DS v3.0 strict :
- Light mode : `#F3F3F3` fond, `#FFFFFF` cards, `#000000` texte primaire, `#FF6116` accent
- Dark mode sections : `#0A0A0A` fond, `#FFFFFF` texte
- Typographie : Urbanist, tabular-nums sur valeurs numériques
- Zéro shadow portée, zéro bordure épaisse, zéro gradient ornemental
- Borders : `0.5px solid rgba(0,0,0,0.06)` light / `0.5px solid rgba(255,255,255,0.06)` dark

---

## Structure (A+B mix — Scrollytelling + Data Wall)

### 1. Navbar
- Sticky, backdrop-blur, `rgba(243,243,243,0.90)`
- Logo STRYVR + badge Bêta orange
- CTA "Rejoindre la bêta" → scroll to form

### 2. Hero (Section A+B)
- Layout plein écran `#F3F3F3`
- **Gauche** : copy + BetaForm
  - Badge géo + places limitées
  - H1 : "95% abandonnent. Pas toi."
  - Sous-titre : positionnement "double digital"
  - Form inline
- **Droite** : stack de 3 iPhones en perspective 3D décalés
  - iPhone 1 (devant, centre) : AgendaScreen
  - iPhone 2 (derrière droite) : SessionLoggerScreen
  - iPhone 3 (derrière gauche) : StatsScreen
  - Data annotations flottantes : pills `#FF6116` avec vraies valeurs
  - Parallax léger au scroll

### 3. Section "Ta journée, pilotée" (Scrollytelling)
- Fond `#F3F3F3`
- iPhone Agenda agrandi au centre (~320px)
- Callouts animés pointant zones précises de l'écran :
  - "07:30 → Check-in adapté à ton sommeil de cette nuit."
  - "17:30 → Séance push générée selon ta récup."
  - "Nutrition → Macros recalculées en temps réel."
- Transition fond vers `#0A0A0A` en bas de section

### 4. Section "En séance, tu ne penses plus" (Dark)
- Fond `#0A0A0A`
- iPhone SessionLogger light mode — contraste fort sur dark
- Callouts blancs :
  - "RIR capturé → programme recalculé."
  - "Repos chrono → relance auto."
  - "Set coché → coach notifié."
- Animation : sets qui se cochent en boucle subtile

### 5. Section "Ton double te connaît" (Light)
- Fond `#F3F3F3`
- Deux colonnes de faits bruts (pas tableau comparatif générique) :
  - Gauche : Ce qu'un coach humain ne peut pas faire
  - Droite : Ce que STRYVR fait à la place
- Wording direct, sans marqueting creux

### 6. Stats Bar
- Fond `#EBEBEB`
- 4 métriques animées au scroll (countUp) :
  - `−2.3kg` moy. / 8 semaines
  - `94%` séances complétées
  - `5 min` /jour
  - `0` décision à prendre
- 64px Urbanist, tabular-nums, `#000000`

### 7. CTA Final (Dark)
- Fond `#0A0A0A` plein largeur
- Copy : "Commence à te transformer. Ton programme t'attend."
- BetaForm dark
- Footer

---

## Composants

### `AppMockup.tsx` — refonte
- Props : `screen: 'agenda' | 'session' | 'stats'`
- iPhone frame identique (260px wide, perspective)
- 3 screens distincts : AgendaScreen (existant), SessionLoggerScreen (nouveau), StatsScreen (nouveau)

### `SessionLoggerScreen`
- Fond `#F3F3F3`
- Exercice actif : nom + sets grid
- Set row : rep/poids/RIR + coche verte
- Timer repos : arc orange
- DS v3.0 light strict

### `StatsScreen`
- Fond `#F3F3F3`
- Métriques grandes : poids courbe, volume semaine, force progression
- Arcs DS v3.0 orange

### `DataAnnotation`
- Pill flottante, `bg-[#FF6116]`, texte blanc 10px bold
- Line connectrice SVG vers zone écran
- Framer Motion entrée (opacity + x/y)

### `HeroPhoneStack`
- 3 `AppMockup` positionnés en absolute
- Perspective CSS 3D : `rotateY` + `rotateX` distincts par phone
- `useScroll` + `useTransform` : phones s'écartent légèrement au scroll

---

## Animations

- Hero phones : parallax `y: [16, -16]` (existant) + spread au scroll
- Callouts : `whileInView` opacity + x/y, stagger 0.15s
- Stats : countUp via `useMotionValue` + `animate`
- Sets SessionLogger : loop toutes les 3s, `keyframes` opacity
- Transitions inter-sections : `whileInView` standard fadeUp

---

## Contraintes

- Zéro dépendance nouvelle (Framer Motion déjà présent)
- `npx tsc --noEmit` 0 erreurs
- Mobile : stack phones → single phone hero, callouts sous l'écran
- Pas de video/lottie — SVG inline + CSS animation uniquement
