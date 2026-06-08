# STRYVR — État Vivant du Projet

> **Source de vérité tactique.** Lire au début de chaque session.
> **Historique détaillé** → `project-state-archive.md` (sessions antérieures à 2026-04-27)
> **Dernière mise à jour : 2026-05-21**

---

## 🎯 État Stratégique Global

| Métrique        | Statut                                            |
| --------------- | ------------------------------------------------- |
| Phase           | MVP Phase 1 ✅ Complet → Phase 2 Prêt             |
| Architecture    | Solide (Supabase RLS, Inngest, TypeScript strict) |
| Performance     | Excellent (< 300ms API, real-time scoring)        |
| Adherence focus | ✅ 5-min client app target atteint                |
| Roadmap         | Phase 2 Q3 2026 : wearables, export, IA coach     |
| Landing STRYVR  | ✅ Refonte DA Technogym — `/stryvr` live          |

---

## 📦 Modules Core Status

| Module                          | Statut                                                                                                                                                                       | Update     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Program Intelligence Engine** | ✅ Phase 2 Biomechanics complet                                                                                                                                              | 2026-04-26 |
| **Client App**                  | ✅ Chat SP3-A — proactive AI coach (Inngest crons 06:30/21:30), system prompt v2 (coach identity, full bilan history, active program, tone rules), daily brief post-check-in | 2026-05-21 |
| **Nutrition Composer**          | ✅ food_items DB, Composer 4 couches, journal éditable, journée physiologique                                                                                                | 2026-05-16 |
| **Nutrition Protocols**         | ✅ Macros, carb cycling, cycle sync                                                                                                                                          | 2026-04-26 |
| **MorphoPro Bridge**            | ✅ Phase 1 complet (galerie + canvas + analyse IA structurée)                                                                                                                | 2026-04-28 |
| **Design System v2.0**          | ✅ Dark flat minimal DS-compliant (coach web)                                                                                                                                | 2026-04-27 |
| **Design System v4.0**          | ✅ Dark gray minimal — zéro accent, zéro border, gray scale #080808→#f2f2f2                                                                                                  | 2026-05-21 |
| **Landing STRYVR**              | ✅ `/stryvr` — DA Technogym, waitlist Supabase                                                                                                                               | 2026-05-16 |
| **Coach Dashboard**             | ✅ MRR, alerts, client segmentation                                                                                                                                          | 2026-04-13 |
| **Client Onboarding**           | ✅ 5-screen tour + guided tooltip tour                                                                                                                                       | 2026-04-27 |
| **Daily Check-ins**             | 📋 Spec documentée, Phase 2                                                                                                                                                  | —          |

---

## 🚀 Dernières Avancées

### 2026-05-21 — Chat SP3-A — Proactive AI Coach + System Prompt v2

- `lib/client/ai-coach/buildSystemPrompt.ts` — refonte complète : coach identity (`user_profiles.first_name/last_name`), bilan history limit 10 ascending (PROGRESSION TOTALE), programme actif (`programs.frequency/weeks/program_sessions`), hydration depuis `nutrition_protocol_days.hydration_ml`, ton coach strict (2-3 phrases max, pas de conseils génériques, référence au programme du coach)
- `lib/client/ai-coach/buildDailyBrief.ts` — nouveau : structured daily brief post-check-in (séance prévue, macros cibles, eau, 1 phrase LLM coaching max_tokens:40)
- `app/api/client/checkin/route.ts` — insère `daily_brief` message après le closing LLM, best-effort non-bloquant
- `lib/inngest/functions/chat-morning-brief.ts` — cron 06:30 UTC : fan-out tous clients actifs, insère `morning_init` message avec chip `trigger_checkin`, double dedup (checkin already done + message already sent)
- `lib/inngest/functions/chat-evening-brief.ts` — cron 21:30 UTC : même mécanique, `evening_init`
- `app/api/inngest/route.ts` — enregistre les 2 nouvelles fonctions
- `components/client/ChatPage.tsx` — `handleInteract` intercepte `key === 'trigger_checkin'` → marque chip answered + active `handleCheckinClick()`
- Points de vigilance : les messages `morning_init`/`evening_init` sont archivés après 3j par `chat-archive` — normal car check-in doit être fait dans les 3j ; cron UTC (06:30 = 08:30 CEST été) ; `programs.status === 'active'` requis pour la séance prévue

### 2026-05-22 — Nutrition Protocols: weekday & day_type migration

- `supabase/migrations/20260522_add_daytype_weekday.sql` — Add `weekday` (0=Sunday..6=Saturday) and `day_type` (`training`|`rest`|`special`) to `nutrition_protocol_days`. Indexes added on `weekday` and `day_type`. Apply via Supabase SQL Editor or CI migration runner.
- `app/api/clients/[clientId]/nutrition-protocols/[protocolId]/today-context/route.ts` — new server endpoint returning `{ days, hasSessionToday }` to provide authoritative per-day selection for the client app.
- `components/nutrition/studio/ProtocolCanvas.tsx` — coach editor: added selects for `Jour de la semaine` and `Type de journée` (Entraînement / Repos / Spécial) wired to `onUpdateDay`.
- `lib/nutrition/useTodayProtocol.tsx` — client hook to call the `/today-context` endpoint, compute `selectedDay` (fallback via `selectDayForDate`) and cache result in `localStorage` for offline fallback.

Points de vigilance:

- RLS: `nutrition_protocol_days` policies already exist — ensure the migration preserves RLS policies and re-apply partial policies if migration is applied via Supabase SQL Editor.
- Prisma: this repository doesn't have a `prisma/schema.prisma` file present; if you use Prisma, add fields to the `NutritionProtocolDay` model and run `npx prisma migrate dev --name add_weekday_daytype` followed by `npx prisma generate`.

Next steps:

- Apply SQL migration to Supabase (manual or CI). If you want, I can prepare a Prisma schema patch if you maintain Prisma locally.
- Update `CHANGELOG.md` (done) and this `project-state.md` entry (done).

### 2026-05-21 — Metrics Tab Navigation — 3-tab client PWA

- `app/api/client/body-data/route.ts` — extended: `bodyFatSeries`, `leanMassSeries`, `measuresByBilan[]`, `annotations[]` (from `metric_annotations` non-injury)
- `app/api/client/vitality/route.ts` — new: score agrégé check-ins 0-100, trend 30j (energy/sleep/stress/soreness merged morning+evening)
- `components/client/metrics/MetricCard.tsx` — generic card: value + sparkline + expand-inline SVG chart + bilan markers + coach annotations
- `components/client/metrics/MetricExpandedChart.tsx` — full SVG chart, MIN/MOY/MAX stats, annotation vertical lines
- `components/client/metrics/BodyDataTab.tsx` — 3 cards: poids, masse grasse, masse maigre
- `components/client/metrics/BodySilhouette.tsx` — SVG front view (viewBox 280×460) + bilan pills navigator + dashed annotation lines (chest/waist/hips/arm) + deltas vs previous bilan
- `components/client/metrics/MesurationsTab.tsx` — silhouette + 4 measurement cards
- `components/client/metrics/VitalityScoreHero.tsx` — score bar 0-100 + label (Excellent/Bonne forme/Attention/À surveiller)
- `components/client/metrics/VitalityTab.tsx` — hero + 4 vitality cards with 7j avg vs previous 7j delta
- `components/client/MetricsClientPage.tsx` — full refactor: tab bar (Corps/Mensurations/Vitalité) + Promise.all fetch + tab routing
- Score formula: `(energy_norm×1.5 + sleep_norm×1.5 + stress_inv×1 + soreness_inv×0.5) / 4.5 × 100`
- Points de vigilance: BodySilhouette bezier control points are approximate — can be visually tuned; annotations from `metric_annotations` require `event_type != 'injury'` AND `label IS NOT NULL`

### 2026-05-20 — Chat-First Client App — Sub-projet #1

- `supabase/migrations/20260520_chat_messages.sql` — tables `chat_messages` + `chat_sessions` + RLS
- `app/api/client/chat/messages/route.ts` — GET actifs + POST (LLM GPT-4o mini, rate limit ai_coach_daily_usage)
- `app/api/client/chat/archives/route.ts` — GET messages archivés par date
- `app/api/client/chat/today-strip/route.ts` — GET sessions/calories/eau/checkin du jour
- `components/client/ChatBubble.tsx` — bulle bot (avatar coach/logo) + user (jaune)
- `components/client/ChatConversation.tsx` — liste scrollable avec séparateurs date + typing indicator
- `components/client/ChatTodayStrip.tsx` — pills compactes : séances, calories, eau, check-in
- `components/client/ChatInputBar.tsx` — texte + mic (VoiceLogSheet.onTranscriptOnly)
- `components/client/ChatPage.tsx` — orchestrateur, optimistic messages, rate limit UI
- `app/client/page.tsx` — remplace Smart Agenda par ChatPage
- `app/client/metrics/page.tsx` + `components/client/MetricsPage.tsx` — remplace /client/profil
- `components/client/BottomNav.tsx` — 4 tabs : Chat/Programme/Nutrition/Métriques, FAB supprimé
- `lib/inngest/functions/chat-archive.ts` — cron 03:00 UTC archive messages > 3 jours
- `components/client/smart/VoiceLogSheet.tsx` — ajout prop `onTranscriptOnly`
- Supprimés : `CoachAIButton.tsx`, `CoachAIChatSheet.tsx`
- Points de vigilance : migration `20260520_chat_messages` à appliquer manuellement via Supabase Dashboard ; sous-projets suivants : SP3 (push notifications), SP4 (metrics avancées)

### 2026-05-21 — Chat SP2 — Scripted Flow Engine + Interactive Messages

- `supabase/migrations/20260521_daily_checkins.sql` — table `client_daily_checkins` (sleep, energy, stress, weight, hunger, soreness) + RLS — **à appliquer manuellement**
- `lib/client/checkin/flows.ts` — définitions flows morning (4 steps) + evening (4 steps)
- `lib/client/checkin/checkinEngine.ts` — `determineFlow(hour, sessions)` — 10 tests Vitest PASS
- `app/api/client/checkin/route.ts` — POST save check-in → DB + `chat_sessions.completed_at` + LLM closing message
- `lib/client/ai-coach/buildSystemPrompt.ts` — fix colonnes `nutrition_meals` (`total_calories`/`total_protein_g`/`total_fat_g`/`total_carbs_g`) + source `meal_logs` legacy + bloc tendances 3j + bloc check-ins du jour
- `components/client/ChatBubble.tsx` — types `InteractiveMetadata` + `metadata` sur `ChatMessage` + render composants chips/slider/number
- `components/client/checkin/CheckinFlow.tsx` — `ActiveCheckinFlow` (null-render) orchestre steps, expose `CheckinFlowHandle`
- `components/client/ChatPage.tsx` — bouton Check-in → `determineFlow` → `ActiveCheckinFlow` monté dynamiquement, input désactivé pendant flow
- `components/client/ChatConversation.tsx` — forward `onInteract`/`onSkip` vers `ChatBubble`
- Points de vigilance : migration `20260521_daily_checkins` à appliquer manuellement ; `muscle_soreness` conditionnel (`__has_session_today`) ; flow messages ephémères (seul le closing message LLM est persisté en DB)

### 2026-05-21 — Design System v4.0 — Dark Gray Minimal Client PWA

- `app/globals.css` — tokens `--c-*` (gray scale #080808→#f2f2f2) + `--data-copper/gold/petrol` (charts)
- `tailwind.config.ts` — gray scale + data color Tailwind tokens
- `components/client/ClientTopBar.tsx` — fond `#080808`, texte `#e0e0e0` (plus de jaune)
- `components/client/BottomNav.tsx` — actif `#f2f2f2`, inactif `#5a5a5a`, pas de border-t
- 60+ composants `/client` et `app/client` — suppression totale `#ffe01e`, borders, surfaces gray scale
- Data colors `--data-copper/gold/petrol` — uniquement dans charts/SVG
- Boutons primary : `bg-[#f2f2f2] text-[#080808]`
- Chat : user bubbles `bg-[#f2f2f2] text-[#080808]`, bot `bg-[#111111]`
- TempoGuideModal : phases → neutral gray, accent `#FFB800` → `#e0e0e0`
- AdherenceScoreCard : thèmes recalibrés gray scale
- Points de vigilance : charts Recharts utilisent `var(--data-*)` via `style={{ stroke }}` — pas via className ; BodyMap primary muscle = `#e0e0e0` (was green `#1f8a65`)

### 2026-05-21 — i18n ES/EN App Client — Couverture Complète

- `lib/i18n/clientTranslations.ts` — +~150 nouvelles clés (tempo, settype, activity, nutrition widget, ai chat, restrictions, water, checkin, logger, smart, programme tabs, portion, access pages)
- `components/client/TempoGuideModal.tsx` — phases CON/ISO/ECC/PAUSE, tap-resume, PRÊT/READY/LISTO
- `app/client/programme/session/[sessionId]/SessionLogger.tsx` — coaching cues, PR flash, erreurs réseau, compteur séries, UI repos
- `app/client/programme/ProgrammeClientPage.tsx` — tabs, streak, périodes heatmap, KPIs
- `components/client/CoachAIChatSheet.tsx` — greeting, suggestions, erreurs, placeholder, compteur
- `components/client/smart/SmartWorkoutWidget.tsx` — session/repos/démarrer
- `components/client/smart/SetTypeSelector.tsx` — types séries (échauffement/principale/retour/dégressive)
- `components/client/smart/SetRow.tsx` — répétitions, valider la série
- `components/client/smart/ExerciseBlock.tsx` — résumé sets·reps·RIR
- `components/client/NutritionWidget.tsx` — toggle Consommé/Restant, Cible
- `components/client/smart/SmartNutritionWidget.tsx` — macros labels, régularité protéines
- `components/client/smart/FreeActivitySheet.tsx` — titre, précise, quand, durée, intensité
- `components/client/smart/DayChecklist.tsx` — items check-in matin/soir, séance, nutrition, hydratation
- `components/client/QuickWaterModal.tsx` — titre, loguer, erreur réseau
- `components/client/ClientRestrictionsSection.tsx` — zones anatomiques, sévérités (FR/EN/ES), form
- `components/client/smart/SmartAlertsFeed.tsx` — voir plus, réduire
- `components/client/smart/DeloadAlertBanner.tsx` — signaux supplémentaires
- `components/client/smart/AdherenceScoreCard.tsx` — labels Élite/En forme/Bon rythme/À améliorer
- `components/client/profile/PortionScalingForm.tsx` — description + instructions mesure main
- `app/client/acces-suspendu/page.tsx` — converti en Client Component (useClientT)
- `app/client/access/expired/page.tsx` — converti en Client Component (useClientT)
- `app/client/access/invalid/page.tsx` — converti en Client Component (useClientT)
- Points de vigilance : `getCoachingCue` reçoit `t as (k: string) => string` (cast nécessaire pour TS strict) ; `BODY_PART_KEYS` remplace `BODY_PART_LABELS` statique dans ClientRestrictionsSection ; pages accès ne sont plus Server Components (pas de données server-side needed)

### 2026-05-20 — Coach IA Chat

- `supabase/migrations/20260520_ai_coach_daily_usage.sql` — table rate limit (client_id, date, message_count PK) + RLS client SELECT
- `lib/client/ai-coach/buildSystemPrompt.ts` — construit system prompt depuis profil + journée (repas, eau, séance, activités, restrictions) — server-side uniquement, crée son propre svc()
- `app/api/client/ai-coach/context/route.ts` — GET, vérifie auth + retourne remainingMessages + clientName
- `app/api/client/ai-coach/chat/route.ts` — POST, rate limit DB → buildSystemPrompt → GPT-4o mini (max_tokens 300, content max 500) → upsert usage → réponse
- `components/client/CoachAIChatSheet.tsx` — bottom sheet DS v3.0 z-[70], greeting fixe, suggestions rapides jaunes, typing indicator animé, compteur 20 msg, bubble user jaune
- `components/client/CoachAIButton.tsx` — bouton MessageCircle fixe `top-3 right-4 z-50` sur toutes pages shell
- `components/client/ConditionalClientShell.tsx` — CoachAIButton injecté dans le shell (hors AUTH_PATHS)
- Points de vigilance : migration `20260520_ai_coach_daily_usage` à appliquer manuellement via Supabase Dashboard ; `OPENAI_API_KEY` déjà présente ; system prompt jamais retourné au client browser ; reset compteur = date physiologique 04:00 ; bouton fixe `top-3 right-4` peut entrer en conflit visuel avec des éléments TopBar right sur certaines pages (vérifier page par page)

### 2026-05-20 — Voice Nutrition Logger

- `lib/nutrition/voice.ts` — `cleanTranscript()` (filler words FR/EN/ES, numbers, units), types `VoiceItem` + `VoiceParseResult`
- `app/api/client/nutrition/voice-parse/route.ts` — POST, GPT-4o mini JSON strict, top-20 food_items hint, food_item_id ILIKE matching, rate limit 10/min in-memory
- `components/client/smart/VoiceLogSheet.tsx` — 3-layer sheet DS v3.0 : recording (SpeechRecognition + waveform AnalyserNode), processing (spinner), review (items éditables, quantité avec recalcul macro proportionnel, swipe delete, log)
- `components/client/smart/VoiceEntryFab.tsx` — FAB micro fixe `bottom-[88px] right-4` sur `/client/nutrition`
- `supabase/migrations/20260520_voice_input_mode.sql` — `'voice'` ajouté à l'enum `input_mode` sur `nutrition_entries`, confidence_score 0.70
- Bouton micro dans `MealLogSheet` header et `NutritionLogContent` (embedded, layers category + sub-header)
- Points de vigilance : migration à appliquer manuellement via Supabase Dashboard, `OPENAI_API_KEY` requis, SpeechRecognition non supporté iOS Safari < 16.4 (fallback message affiché)

### 2026-05-19 — Smart Workout Redesign (Motra-style)

- `supabase/migrations/20260519_set_type.sql` — colonne `set_type` sur `client_set_logs` (warmup/working/cooldown/dropset) — **appliquer manuellement**
- `components/client/smart/SetRow.tsx` — row inline-editable, swipe droite=valider, swipe gauche=supprimer, type pill EC/RC/↘
- `components/client/smart/SetTypeSelector.tsx` — bottom sheet type de série
- `components/client/smart/ExerciseBlock.tsx` — card exercice avec sets inline, Add Set, context menu •••
- `components/client/smart/ExerciseContextMenu.tsx` — échange, repos, note, tempo, supprimer exercice
- `components/client/smart/SupersetContextMenu.tsx` — dissocier, repos, supprimer superset
- `app/client/programme/session/[sessionId]/SessionLogger.tsx` — refonte totale vers liste scrollable (−1050 lignes remplacées)
- `components/client/smart/SmartWorkoutHero.tsx` — titre 22px, sans navigation date, muscle pills
- Supprimés : `SetSwipeCard.tsx`, `SetEditSheet.tsx`
- Conservé : live save, PR detection, SetRecommendation, RestTimer, tempo guide, hydration, long press terminer

### 2026-05-19 — Client Profil Accordion Redesign

- `app/api/client/body-data/route.ts` — agrège bilans (poids série, composition, mensurations)
- `components/client/profile/AccordionSection.tsx` — section collapsible Framer Motion
- `components/client/profile/BodyDataSection.tsx` — sparkline SVG + composition + mensurations
- `components/client/profile/ProfilAccordion.tsx` — orchestrateur 8 sections (une ouverte à la fois)
- `app/client/profil/page.tsx` — Server Component pur (−254 lignes)
- Hero compact : avatar 56px + nom + email + badge statut + streak pill jaune
- Données depuis `assessment_submissions + assessment_responses` (field_keys: weight_kg, body_fat_pct, lean_mass_kg, waist_cm, hips_cm, arm_cm, chest_cm)
- Photos morpho : non affichées côté client (RLS morpho_photos = coach uniquement)

### 2026-05-18 — Elite Client App Sprint

- PR detection temps réel (Epley + historique), flash "⚡ Nouveau record", badge PR jaune
- `getCoachingCue()` — messages contextuels par RIR
- `client_meal_favorites` table + API GET/POST/DELETE/use — repas récents 1 tap
- `ExerciseProgressionChart.tsx` — SVG pur, bezier, sélecteur exercice pills
- `lib/client/smart/recoveryAlerts.ts` — 10 tests Vitest, alertes sleep/stress/energy
- `lib/training/oneRepMax.ts` + `lib/training/deloadDetection.ts` — 21 tests Vitest
- FAB redesign : arc 120°, spring premium, logo 80px
- Bugs résolus : eau 0ml, router.refresh() eau, home grid 2 colonnes

### 2026-05-18 — Smart Trio Refonte App Client

- Smart Agenda (home), Smart Nutrition, Smart Workout, BottomNav 5 slots + RadialActionMenu
- 16 nouveaux composants dans `components/client/smart/`
- 4 libs pures testées Vitest dans `lib/client/smart/`
- 11 API routes, 19 tests Vitest PASS, i18n 48 clés `smart.*`
- Routes supprimées : `/client/agenda` + `/client/progress` → redirect 301 → `/client`

### 2026-05-17 — Tempo Guide Modal v2 + Set Recommendation Engine v2

- TempoGuideModal : circuit triangle fermé, codes couleurs par phase, anticipation isométrique, reps bonus, landscape responsive
- SetRecommendation : Path B corrigé, modulation RIR Path A, formatWeight() locale-independent

### 2026-05-16 — Landing STRYVR + Nutrition Composer + Tempo Phase 1

- Landing DA Technogym : fond `#0a0a0a`, accent `#F5D800`, Urbanist, grille industrielle
- Nutrition Composer 4 couches : `food_items` + `nutrition_meals` + `nutrition_entries`, journée physiologique 04:00
- Tempo Phase 1 : `lib/training/tempo.ts`, badge auto/coach, TempoGuideModal Phase 1
- BodyMap : LEGACY_TO_CANONICAL 40+ slugs, fallback primary_muscle singulier

### 2026-04-28 — MorphoPro Phase 1 + 5 Bugs SessionLogger

- `morpho_photos` + `morpho_annotations` + RLS, GPT-4o structuré, Fabric.js v6 canvas
- SessionLogger : parseFloat("0") fix, home séances du jour, muscleDetection slugs, rest timer 8s, superset UX

---

## 🔑 Points de Vigilance (Actuels)

| Problème               | Impact                   | Mitigation                                    |
| ---------------------- | ------------------------ | --------------------------------------------- |
| Supabase Redirect URLs | Onboarding brisé         | Whitelist `/client/onboarding`                |
| `three@0.170` requis   | Build error si downgrade | Ne pas downgrader — `three-mesh-bvh` peer dep |

> ✅ **Migrations vérifiées le 2026-05-21** via `scripts/verify-migrations.sql` — toutes appliquées.
> Script de vérification réutilisable : `scripts/verify-migrations.sql` → Supabase SQL Editor.

---

## 📅 Next Steps — Phase 2

- [x] Toutes migrations appliquées (vérifié 2026-05-21)
- [x] Chat SP2 : Scripted Flow Engine — flows morning/evening, chips/sliders interactifs, données réelles system prompt
- [x] Chat SP3-A : Proactive AI Coach — system prompt v2, Inngest crons, daily brief
- [ ] Chat SP3-B : Push Notifications + VAPID, cron par client
- [ ] Chat SP4 : Metrics / Body Evolution avancée — graphiques poids, composition, historique bilans
- [ ] E2E test : invite → onboarding → 5 écrans → dashboard
- [ ] Gamification : points check-ins / séances / bilans
- [ ] Mobile : TopBar buttons responsive, SessionLogger < 480px
- [ ] Wearables : Apple Health, Oura (~6 weeks)
- [ ] Export : PDF/CSV/JSON programme (~4 weeks)
- [ ] IA Coach : bulk protocol generation (~8 weeks)

---

## 🗂️ Architecture Clés

**Database** : Supabase PostgreSQL + Prisma — RLS multi-tenant, migrations, seeds idempotent
**Async Jobs** : Inngest — `morpho/analyze.requested` (OpenAI Vision, retry x3, 5min timeout)
**DS v2.0** (coach) : `#121212` fond, `#1f8a65` accent vert
**DS v3.0** (STRYVR native/landing) : `#0a0a0a` fond, `#F5D800` accent jaune, Urbanist uppercase

## ⚙️ Config Production

| Variable            | Statut                      |
| ------------------- | --------------------------- |
| INNGEST_SIGNING_KEY | ✅ Injected (Vercel)        |
| INNGEST_EVENT_KEY   | ✅ Injected (Vercel)        |
| CRON_SECRET         | ✅ Configured               |
| Supabase RLS        | ✅ Enabled                  |
| PWA Manifest        | ✅ Updated (#121212)        |
| Service Worker      | ✅ v2 (network-first pages) |

## 🎯 Règles Non-Négociables

1. **Data Model First** — schéma avant UI
2. **Zero TypeScript Errors** — `npx tsc --noEmit` obligatoire
3. **CHANGELOG After Every Change** — MANDATORY
4. **DS v2.0 Strict** — `#121212` bg, `#1f8a65` accent (coach web)
5. **DS v3.0 Strict** — `#0d0d0d` bg, `#ffe01e` accent, Barlow (client app)
6. **RLS + Ownership Checks** — API routes sécurisées
7. **Inngest Only** — zéro `setImmediate`, tous jobs async via Inngest
