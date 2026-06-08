# CHANGELOG — STRYVR

> **Format court** — entrées de 1 ligne par changement.
> **Archivé** → voir `CHANGELOG.archive.md` pour l'historique complet (< 2026-04)

## 2026-05-05

FEATURE: Meal templates coach — migration `20260505_coach_meal_templates.sql`, API coach CRUD `/api/clients/[clientId]/meal-templates`, API client GET `/api/client/meal-templates`
REFACTOR: `checkin/meals/page.tsx` — refonte complète : bottom sheet non tronquée (flex+overflow-y-auto), min-w-0 sur tous inputs grid, nom par défaut "Repas N", bibliothèque repas types coach, bilan macros journalier, DS v2.0
REFACTOR: `nutrition/page.tsx` — alignement DS v2.0 : MacroBar linéaire, CTA journal toujours visible, structure TopBar + sections propres
CHORE: `.claude/rules/ui-design-system.md` — règles anti-régression mobile : bottom sheet, inputs grid, sliders natifs
FIX: Sliders check-in client — remplace Radix `<Slider>` (bug touch iOS) par `<input type="range">` natif dans `checkin/[moment]/page.tsx` et `checkin/meals/page.tsx`
FIX: Valeurs check-in initialisées au min à chaque chargement de fields — élimine NaN au premier rendu
CHORE: CSS global `input[type="range"]` thumb DS v2.0 dans `globals.css`

## 2026-05-05

FIX(entrainement): ProgramTemplateBuilder noFullscreen sur page client — évite conflit useSetFullscreenPage vs h-screen de la page parente ; builder ouvre correctement sans rebond
FIX(program-builder): colonnes scrollables — h-full propagé via wrappers flex+minHeight:0 ; pages new/edit passent h-full ; PageContent fullscreen ajoute flex-1 min-h-0
FEATURE(assign): inferWeightIncrement — palier auto à l'assignation selon équipement (machine→5kg, haltères→2kg, barre→2.5kg, bodyweight→0) ; valeur coach conservée si déjà configurée
FEATURE(program-builder): champ weight_increment_kg par exercice — palier arrondi configurable coach (ExerciseCard UI + interface Exercise + payload save + route API template PATCH/POST/SELECT)
FEATURE: setRecommendation — double progression complète (Path A) : charge stable + reps+1 vers rep_max, puis charge+increment + retour rep_min au trigger overload ; Path B (intra-session) conservé si pas d'historique
FIX: setRecommendation — match historique par set_number exact (plus de confusion set 1 vs set 3)
FIX: setRecommendation — arrondi roundToIncrement(weight_increment_kg) au lieu de roundToHalf (élimine charges impossibles sur machine/barre)
FIX: SessionLogger — weight_increment_kg, rep_min, rep_max, target_rir passés à recommendNextSet ; weight_increment_kg ajouté à l'interface Exercise
FIX: lastPerformance — set_number exposé dans fetch page.tsx et type LastPerf
FIX(bodymap): couverture 100% slugs catalogue — extensor/flexor_digitorum ajoutés ; audit complet confirme 0 primaryMuscle non résolu sur 465 exercices
FIX(bodymap): MIN_RATIO 0.06→0.04 — deltoïdes et muscles faibles apparaissent ; fuzzyFindInCatalog seuil configurable (0.30 dans computeMuscleIntensity) pour meilleur match singulier/pluriel
FIX(bodymap): computeMuscleIntensity fallback catalogue complet — si primary_muscle null en DB, lookup fuzzy catalogue pour récupérer secondaryMuscles+Activations réels ; triceps_brachii_lateral/long/medial ajoutés CATALOG_SLUG_MAP
FIX: SessionLogger — DeltaBadge déplacé sous la ligne ↩ lastPerf (colonne PRÉVU) au lieu de sous l'input kg
FIX: setRecommendation — blend live/historique 50/50 si reps > 8 (était 70/30, causait régressions aberrantes sur sets légers)
FIX: setRecommendation — guard prev_set_weight_kg : reco jamais inférieure au poids du set précédent dans la séance

## 2026-05-05

FEATURE(bodymap): intensité musculaire continue par volume pondéré — computeMuscleIntensity() calcule sets×activation par groupe, normalise 0–1, BodyMap interpole opacity 10%→100% selon ratio ; fallback primary/secondary si pas de données biomech ; query program_exercises enrichie (primary_muscle, primary_activation, secondary_activations)
REFACTOR(bodymap): 4 niveaux d'activation musculaire — primaire (vert plein), secondaire (0.42), stabilisateur (0.14), inactif — BodyMap prop stabilizerGroups ajouté, detectMuscleGroups retourne stabilizers Set, CatalogEntry.stabilizers supporté
FEATURE(muscles): groupe avant-bras complet — MuscleGroup type + CATALOG_SLUG_MAP (brachioradialis/wrist_flexors/extensors/pronator/supinator) + BodyMap SVG activé (vue frontale + dorsale) + ExercisePicker FIBERS_BY_GROUP + FIBER_LABELS + SEARCH_ALIASES + catalog muscleGroup mis à jour pour 2 exercices
FIX(program-builder): colonnes scrollables indépendamment — wrappers colonnes passent à display:flex + flexDirection:column + minHeight:0 pour propager h-full aux enfants sans débordement
FIX(program-builder): double scroll supprimé — useSetFullscreenPage(true) dans ProgramTemplateBuilder active h-screen overflow-hidden sur CoachShell ; NavDock masquée en fullscreen ; builder passe h-full au lieu de h-[calc(100vh-96px)]
FIX(entrainement): page parente passe en h-screen overflow-hidden quand le builder est actif — supprime le double scroll page+colonnes
FIX(program-builder): toggleSuperset logique intuitive — ex dans groupe + suivant hors groupe = étendre ; ex dans groupe + suivant dans même groupe = retirer ; tooltip contextuel "Étendre" vs "Retirer"
FEATURE(program-builder): triset + série géante — toggleSuperset étend un groupe existant vers l'exercice suivant (N exercices, pas limité à 2) ; badge dynamique SUPERSET/TRISET/SÉRIE GÉANTE selon taille du groupe ; prop groupSize passée à ExerciseCard
FIX(session-logger): BottomNav masquée pendant séance — /client/programme/session/ ajouté aux AUTH_PATHS dans ConditionalClientShell
FIX(session-logger): bouton Terminer flottant sans rectangle bg-[#121212] — bottom-6, fond transparent
FIX(session-logger): header colonnes (Réalisé/Kg/RIR/✓) ajouté dans les tours superset — aligné avec le rendu solo
FIX(session-logger): header glassmorphism supprimé — bg-[#121212] pur, plus de backdrop-blur ni shadow (DS v2.0)
FIX(session-logger): superset — image fullwidth collapsible identique pour tous les exercices (A1, A2...) via hiddenImages Set par exercice ; suppression header "TOUR N" — hiérarchie visuelle seule (bordure couleur si complété)
REFACTOR(session-logger): superset — codes A1/A2 standard musculation (lettre=groupe, chiffre=position) ; fond coloré commun sur tout le bloc superset ; suppression label "Superset · N exercices" ; "Tour" supprimé — hiérarchie visuelle seule
FIX(session-logger): superset — image/GIF exercice visible dans header (premier ex fullwidth collapsible, suivants inline) ; noms non tronqués (leading-snug) ; "Round" → "Tour"
FEATURE(session-logger): superset round-based UX — affichage par round (Set N de chaque exercice dans l'ordre) au lieu de par exercice ; timer déclenché par exercice selon rest_sec coach ; header exercices + rounds numérotés avec indicateur complété
FIX(bilan): sync equipment_preference → coach_clients.equipment[] on submit — intelligence profile now receives equipment from bilan; 'Mixte' maps to full gym set (barre/halteres/machine/poulie/cables/kettlebell/smith/trx/elastiques/bodyweight)
FIX(program-builder): EQUIPMENT_MISMATCH false positives — poulie/cables aliases kept in sync on toggle; bodyweight always considered available in scoring engine (never stored in profile — everyone has it)
FIX(bilan): sync training_frequency → coach_clients.weekly_frequency on submit (clamped 1–7)
FIX(bilan): sync primary_goal → coach_clients.training_goal on submit (both coach + public routes)
FIX(bilan): sync experience_level → coach_clients.fitness_level on submit
FIX(bilan): sync injuries_active/injuries_history → metric_annotations (event_type=injury) on submit — programme intelligence now sees bilan injuries automatically
REFACTOR(bilan): extract syncProfileFromResponses helper (lib/assessments/sync-profile.ts) — single source of truth for all bilan→profile field mappings

FIX(performance): inferMuscleGroup FR — ajout développé/tirage/élévation/marteau/drag curl, normalize NFD, ordre priorité Jambes avant Pectoraux
REFACTOR(session-history): sets affichés sans fond coloré — lignes séparées par border-white/[0.04], typographie tabular-nums, RPE discret

FIX(performance): regex t.bar non-échappé mappait "triceps à la barre" → Dos — corrigé t[\s-]bar + push[\s-]up + pull[\s-]up
FIX(session-history): comptage sets — dénominateur = sets effectifs (completed || actual_reps != null), plus sets prescrits totaux
FIX(session-history): sets non complétés masqués dans le détail — seuls les sets réalisés affichés
REFACTOR(session-history): couleurs DS v2.0 — bg-[#1f8a65]/[0.08] au lieu de bg-green-50/40, bordures border-white/[0.06]
FEATURE(performance): delta poids max dans header "Progression par exercice" — first → last kg avec couleur vert/rouge
REFACTOR(performance): KPI grid 2×3 → strip horizontal compact 1 ligne
REFACTOR(performance): diagnostics nutrition masqués si hasNutritionData=false — supprime le bruit "X kcal Y g"
REFACTOR(performance): radar masqué si < 3 groupes musculaires — empty state informatif
REFACTOR(performance): charts timeline/progression masqués si < 2 points — empty states avec messages contextuels

REFACTOR(dashboard): layout simplifié — OrgSummary toujours visible, boutons Kanban/Agenda en toggle sous le résumé, Row 2 "Organisation du jour" placeholder supprimée du SummaryPanel
FIX(dashboard): OrgSummary câblé dans vue Résumé — affiche événements/Kanban/rappels réels au lieu du placeholder statique
FIX(dashboard): état vide conditionnel — "Tout est sous contrôle" seulement si 0 alertes critiques
FIX(dashboard): error state + bouton Réessayer si fetch API échoue
FIX(dashboard): WelcomeHeader step 1 CTA → /coach/clients/new (pas /coach/clients)
FIX(dashboard): Business nav Organisation → /dashboard (plus de lien vers /coach/organisation)
FIX(dashboard): DockLeft match() supprime /coach/organisation (dead code)
FIX(dashboard): DashboardAgenda bg-[#181818] → bg-white/[0.02] (DS v2.0 — #181818 réservé modals)
REFACTOR(OrgSummary): self-contained — fetch boards en interne, plus de prop boards requise

FIX(session-logs): exercise_id forced null in set inserts — FK constraint client_set_logs_exercise_id_fkey was blocking all upserts silently; exercise_name is the business key
FIX(session-logger): block Terminer button until draftReady — prevents race condition submitting before draft log ID is established

FEATURE: Dashboard home — WelcomeHeader onboarding 3 étapes progressif, SummaryPanel collapsible, sub-nav Résumé/Kanban/Agenda
REFACTOR: /coach/organisation redirige → /dashboard, nav Accueil unifiée sur toutes les surfaces
FIX: nav Accueil pointait vers /coach/organisation au lieu de /dashboard (NavRowB + useNavConfig)
CHORE: suppression log debug signup

FIX(session-logs): sets now upsert correctly — route POST uses upsert+onConflict instead of silent insert, adds primary/secondary muscles columns, side defaults to 'bilateral'
FIX(session-logs): patchSets logs 42P10 constraint errors to console instead of silencing them
SCHEMA: apply UNIQUE constraint on client_set_logs(session_log_id, exercise_name, set_number, side) + side NOT NULL + primary/secondary_muscles columns via Supabase Dashboard

FEATURE(catalog): add 6 exercises — curl biceps assis câble supination (stim 0.70), extensions/flexions poignets x4 (barre+poulie), extensions triceps poulie horizontale unilatérale (465 total)
FEATURE(catalog): add Curl biceps assis avec câble — cable isolation, biceps_brachii primaryActivation 0.85, stim_coeff 0.62, constant_tension, 459 total exercises

## 2026-05-04

CHORE: Migrate all email transports to Resend SDK — mailer.ts + stripe/webhook (nodemailer fully removed)
FIX: DELETE /api/clients/[clientId] — guard anti-suicide: skip auth.admin.deleteUser if client user_id or email matches the coach's own account

## 2026-04-30

FEATURE: Daily Check-ins Phase 2 — blocs 1-8 complets (DB, service layer, API routes, Inngest jobs, tests, UI coach + client)
SCHEMA: 6 nouvelles tables (daily_checkin_configs, daily_checkin_schedules, daily_checkin_responses, meal_logs, client_points, client_streaks) + push_token sur coach_clients
FEATURE: Service layer lib/checkins/ — streak evaluation (days_of_week, grace period, reset), points attribution, level calculation
FEATURE: API routes coach — checkin-config (GET/POST), checkin-summary (moyennes 30j + heatmap), checkin-history (paginé), meal-logs
FEATURE: API routes client — checkin/schedule (GET/POST), checkin/today, checkin/respond (+ Inngest trigger), meals (GET/POST/DELETE), points
FEATURE: Inngest jobs — checkin/streak.evaluate, points/level.update, checkin/streak.expire (cron 02h UTC), checkin/reminder.send (cron minutaire + Web Push)
FEATURE: UI Coach — page /coach/clients/[clientId]/check-ins (config panel + stat cards + heatmap + drill-down)
FEATURE: UI Client — page /client/checkin/[moment] (sliders DS v2.0, animation points), agenda repas /client/checkin/meals, section progression dans /client/profil
CHORE: Install web-push + @types/web-push

## 2026-04-29

FIX(healthMath): visceral_fat_level, body_water_pct, bone_mass_kg, waist_hip_ratio absents de DerivedMetrics — jamais propagés vers evaluateAll → normes manquantes dans BioNormsPanel ; calcul waist_hip_ratio ajouté (waist÷hips)
FIX(MetricsSection): annotation icons now render on chart even when dates are after last data point — annotation/phase dates injected into data array for xScale positioning, XAxis domain clamped to lastDataDate to prevent phantom ticks
FEATURE(client/home): TopBar refonte — logo STRYVR à gauche, chip coach (photo si logo_url sinon initiales + nom) à droite ; ClientTopBar accepte prop left custom
FIX(template-builder): boutons TopBar absents en mode édition — EditTemplateClient passait topBarLeft=null, condition topBarLeft? bloquait le rendu des actions
FIX(useSetTopBar): cleanup race condition — le unmount d'un composant effaçait la TopBar déjà écrite par le composant suivant (React 18 mount-before-unmount) ; cleanup vérifie maintenant l'ownership avant d'effacer
SCHEMA: migration 20260429_template_exercise_movement_pattern_expand — constraint movement_pattern_check étendue avec hip_abduction, hip_adduction, shoulder_rotation, scapular_elevation, scapular_retraction, scapular_protraction
FIX(save-as-template): erreur "violates check constraint" corrigée par la migration ci-dessus — les programmes avec ces patterns peuvent maintenant être copiés en template

FIX(program-templates/route POST+PATCH): frequency calculé depuis sessions.length réel au lieu de meta.frequency — carte template affiche le bon nombre de jours/semaine
FIX(save-as-template): frequency dérivé de program_sessions.length — corrige la valeur stale en DB lors de la conversion programme → template
FIX(assign): frequency dérivé de coach_program_template_sessions.length — programme assigné hérite du vrai nombre de séances
FIX(ClientProgramsList): interface Program manquait program_sessions + champs meta — séances/exercices strippés avant passage au builder → programme toujours vide à l'ouverture
FEATURE(template-builder): j/sem auto-sync avec sessions.length — champ read-only, useEffect met à jour meta.frequency à chaque ajout/suppression de séance
REFACTOR(metriques): barre contrôles — fond #181818 + bordure supprimés, boutons flottent directement sur #121212
FIX(metriques): empty state affiché si bilan ne contient aucune métrique corporelle affichable (ex: bilan administratif sans poids/MG) — hasData et filteredRows ignorent les champs hors FIELDS (height_cm, etc.)
FIX(profil-client/ProfileForm): tokens CSS obsolètes (bg-surface-light, text-primary, bg-accent) remplacés par DS v2.0 — date naissance et genre maintenant visibles et non tronqués
FIX(branding): STRYV → STRYVR partout (layout, home TopBar, login, onboarding, access pages, manifest.json, acces-suspendu)
FIX(programme/tabs): tab Exercices supprimé — 3 tabs uniquement (Séance, Performances, Historique)

FIX(home/bilans): lien bilan en attente pointe vers /bilan/[token] (formulaire) au lieu de /client/bilans/[id] (vue lecture) — client arrive directement sur le formulaire à remplir
FIX(profil-client): ProfileForm manquait champs date_of_birth + gender — ajoutés au formulaire + PATCH /api/client/profile + GET select + initialisation depuis page profil
FIX(api/client/profile): schéma Zod PATCH étendu — date_of_birth + gender acceptés et persistés en DB
FIX(onboarding-tour): rectangle vert sur icônes nav supprimé — bg-black/70 overlay retiré (doublait avec box-shadow), background transparent sur highlight cutout
FIX(nutrition/page): ClientTopBar ajoutée — section NUTRITION / titre protocole, pseudo-header texte brut supprimé, layout aligné sur standard client
FIX(profil-coach): CRM data lisait data.date_of_birth au lieu de data.client.date_of_birth — API retourne { client: {...} }, destructuring corrigé → date naissance/genre/adresse/contact urgence s'affichent maintenant
FIX(api/clients/PATCH): allowlist manquait address, city, emergency_contact_name, emergency_contact_phone, acquisition_source, internal_notes — ces champs étaient filtrés silencieusement, jamais écrits en DB

FEATURE(programme): page Programme refonte — 4 tabs (Séance / Performances / Historique / Exercices) avec navigation client-side, données performance fetchées en parallèle côté serveur
FEATURE(programme): tab Performances — streak, heatmap 12 semaines, KPIs 30j, volume chart, PRs all-time
FEATURE(programme): tab Historique — 30 dernières séances avec volume/sets/durée/badge PR, lien recap
FEATURE(programme): tab Exercices — catalogue du programme avec sets/reps/pattern/séances associées
REFACTOR(progressTypes): types SessionLog/PREntry/HeatmapDay/SessionSummary + helpers extraits vers lib/client/progressTypes.ts — partagés entre /progress et /programme
FIX(BottomNav): suppression dot vert redondant sous icône active

FIX(intelligence): intelligenceSessions basé sur orderedSessions — corrige alertes affichées sur le mauvais exercice en mode Jours (index triés != index raw)
FIX(intelligence): cable normalisé en 'poulie' + expandProfileEquipment() couvre les alias cables/poulie — élimine fausses alertes "Équipement manquant" quand tout l'équipement est coché
FIX(TopBarContext): useTopBarContent force re-render immédiat après souscription — évite la race condition où notify() de la page s'exécutait avant que la TopBar ait souscrit, causant le bouton "Nouveau template" (et autres boutons TopBar) à ne pas s'afficher au premier render
FIX(muscleDetection): fuzzyFindInCatalog remplacé par similarité Jaccard (seuil 40%) — élimine les faux positifs ("Développé couché" → chest, plus "Développé nuque" → épaules)
FIX(muscleDetection): fallback fuzzy/regex appliqué par exercice (plus global) — chaque exercice sans DB slugs résout indépendamment
FIX(muscleDetection): regex fallback renforcées — word boundaries \b sur curl/tirage/rowing/calf, patterns plus précis évitent les matches parasites
REFACTOR: BottomNav — icônes Phosphor fill/regular (House/Barbell/ForkKnife/UserCircle), pill flottante #181818 rounded-2xl, labels + dot actif
FIX: OnboardingTour — highlight nav item avec glow vert lumineux + fond semi-transparent (ring invisible remplacé)

## 2026-04-29

FIX(client-context): ClientProvider value wrapped in useMemo — inline object was causing all useClient() consumers to re-render on every parent state change
FIX(useClientTopBar): suppression useMemo inutile sur rightContent — JSX toujours nouvelle ref, useSetTopBar stocke en ref directement
FIX(useSetTopBar): notify() guard sur prev refs — TopBar ne re-render plus sur chaque keystroke, seulement si left/right changent vraiment
REFACTOR(ProgramTemplateBuilder): prop topBarLeft — Builder gère sa propre TopBar directement, supprime le pattern setState<ReactNode> dans les pages parentes
REFACTOR(entrainement/page): suppression builderTopBarActions state — Builder reçoit topBarLeft stable, zéro re-render cascade
REFACTOR(templates/new, templates/edit): idem — onTopBarActions pattern remplacé par topBarLeft prop
FIX(TopBarContext): refonte complète pub/sub — refs + notify() au lieu de setState, zéro re-render cascade sur les pages qui écrivent la TopBar
FIX(useSetTopBar): écriture directe dans les refs store + notify() sans deps ReactNode — rompt définitivement la boucle infinie setState
FIX(CoachShell): TopBar isolée via useTopBarContent (forceUpdate local) — les pages ne re-rendent plus quand la TopBar change
FIX(ProgramTemplateBuilder): topBarActionsNode extrait en useMemo — stabilise les renders inutiles

FIX(bodymap): detectMuscleGroups — fuzzy catalog lookup (score ≥2 mots) remplace lookup exact; secondaryMuscles maintenant peuplés → muscles secondaires en vert pâle, muscles non sollicités restent gris
FIX(bodymap): fuzzyFindInCatalog utilisé aussi quand primary_muscles DB existent mais slugs ne résolvent pas

FIX(onboarding): tour déclenché si localStorage null ou 'false' — corrige le cas client arrivé sans passer par la fin de l'onboarding
FIX(onboarding): ajout step Bilans (navIndex 0, tooltip dédié) — 5 steps au total
FIX(onboarding): wording step Dashboard et step Nutrition clarifiés

FIX(metrics): normsSubmissionId gate — cherche weight_kg et height_cm dans toutes les rows indépendamment (plus la même submission requise); débloque l'onglet Normes si taille vient d'un bilan et poids d'une saisie manuelle
FIX(metrics): MetricsSection accepte clientDateOfBirth + le passe à BioNormsPanel — sexe et âge maintenant disponibles pour les calculs de normes
FIX(metrics): page metriques passe client.gender et client.date_of_birth depuis ClientContext à MetricsSection
FIX(assessments): sync automatique des champs bilan (date_naissance/date_of_birth → coach_clients.date_of_birth, sexe/gender/genre → coach_clients.gender) à la soumission — routes public et coach

FIX(ProgramTemplateBuilder): wrap handleSave in useCallback to break infinite re-render loop (React error #185) on /protocoles/entrainement
FIX(onboarding): screens 4-5 mis à jour — "Ta nutrition" remplace "Ta progression et ta nutrition", bilans pointent vers dashboard et non vers page liste
FEATURE(client-nav): BottomNav refonte — 4 items (Home, Programme, Nutrition, Profil), bg-[#181818], dot actif vert, icônes 20px strokeWidth 1.5/2, shadow élévation — aligné design DockLeft coach
FIX(client-nav): suppression items Bilans et Progrès de la nav — Bilans accessible via lien direct home, Progrès dans Programme
FIX(onboarding-tour): 4 steps alignés sur la nouvelle nav — index corrigés, step Bilans supprimé, step Progrès fusionné dans Programme
FIX(home): lien "Bilan en attente" redirige directement vers /client/bilans/[submissionId] — plus de page liste intermédiaire
FIX(recap): RecapNavButtons — router.refresh() avant push vers /client invalide le cache Next.js App Router; "Séance réalisée ✓" visible immédiatement sans relancer l'app
FIX(session-logger): router.refresh() appelé à chaque submitSession() pour pré-invalider le cache de /client pendant la lecture du recap
FIX(session-logger): submitSession() — flush final avec fallback POST atomique garanti + vérification obligatoire des réponses HTTP avant redirect; plus de perte de données silencieuse si l'upsert live échoue
FIX(session-logs/sets): Logging serveur de l'erreur upsert (code + message) pour diagnostiquer les échecs en prod
SCHEMA: 20260429_set_logs_upsert_fix.sql — contrainte UNIQUE (session_log_id, exercise_name, set_number, side) idempotente; side backfill + NOT NULL garantis en prod
REFACTOR(topbar): Nutrition page — "Nouveau protocole" moved to TopBar, inline header removed
REFACTOR(topbar): Bilans page — "Envoyer un bilan" moved to TopBar; SubmissionsList supports controlled sendModalOpen/onSendModalClose props
REFACTOR(topbar): Formules page — "Nouvelle formule" full label + DS v2.0 button style (h-8, tracking, uppercase)
REFACTOR(topbar): Studio/Templates page — "Nouveau template" full label + DS v2.0 button; cards use bg-white/[0.02] border DS, no green top bar, icon buttons aligned
FIX(builder): intelligenceSessions + intelligenceMeta now wrapped in useMemo — were recreated on every render, causing useProgramIntelligence debounce to reset infinitely and Smart Fit to always show 0/100
FIX(intelligence): expandSessionsByDays wrapped in try/catch — crash fallback returns original sessions instead of breaking the scoring engine
FIX(intelligence): useProgramIntelligence catches buildIntelligenceResult crashes and logs to console instead of silently keeping EMPTY_RESULT forever
REFACTOR(builder): "Template" + "Enregistrer" buttons moved to TopBar via onTopBarActions callback — global actions leave the sub-header; sub-header now contains name input only
FIX(save-as-template): sessions insert now logs error + rolls back template on failure instead of silently producing empty sessions; days_of_week included only if non-empty to avoid column-missing failure on unmigrated envs
FIX(intelligence): Multi-day sessions now count as multiple volume occurrences in Smart Fit — expandSessionsByDays() duplicates sessions before passing to scoreBalance/scoreSRA/scoreVolumeCoverage/scoreSpecificity/scoreCompleteness/scoreJointLoad/scoreCoordination; session stats display (sessionsStats) keeps per-session-unique view
FIX(intelligence): EQUIPMENT_MISMATCH alerts now normalize catalog EN slugs (cable, barbell, dumbbell…) to profile FR slugs (cables, barre, halteres…) before comparison — eliminates false-positive equipment missing alerts
FIX(topbar): useSetTopBar now clears right slot on unmount — TopBar buttons no longer persist across pages when navigating away from Entraînement
FIX(programmes): BookmarkPlus and Trash2 buttons on programme cards are always visible (removed opacity-0 group-hover:opacity-100)

## 2026-04-28

FEATURE: Multi-day sessions — days_of_week int[] replaces day_of_week int; coach can assign a session to multiple days (e.g. Pectoraux: Mardi + Vendredi); client app resolves sessions by array membership; SRA uses first scheduled day
SCHEMA: program_sessions + coach_program_template_sessions — add days_of_week int[] with GIN index; migrate existing data; keep day_of_week for backward compat

FIX(assign): copy goal/level/frequency/session_mode/equipment_archetype/muscle_tags from template to program on assign — metadata was lost
FIX(assign): copy movement_pattern/equipment_required/group_id from template exercises to program exercises — supersets and intelligence engine lost these fields
FIX(assign): sort exercises by position with null-safe fallback before insert
FIX(programs PATCH): log and skip failed session inserts instead of silently losing their exercises
FEATURE: Programme ↔ Template bidirectional flow — assign template via modal (with compatibility scoring) from client training page, save any client programme as reusable template (from builder TopBar + programme card)
FEATURE: TopBar Entraînement — "Assigner un template" + "+ Nouveau programme" buttons moved to TopBar (DS v2.0 compliant), inline buttons removed from list
FEATURE: AssignTemplateModal — modal with full rankTemplates scoring, compatible/incompatible split, substitutions display, name override input
FEATURE: SaveAsTemplateModal — modal to copy programme → coach_program_templates with name + optional description
FEATURE: POST /api/programs/[programId]/save-as-template — copies programme sessions + exercises to template, programme client untouched

PERF(morpho): Thumbnail URLs via Supabase Image Transform — gallery grid loads 400px@60% images (~30KB) instead of originals (3-8MB); full_url kept for canvas/compare only
PERF(morpho): Cache signed URLs in DB (morpho_photos.signed_url_cache, 24h TTL) — API skips createSignedUrls() for fresh photos, regenerates only stale ones, saves in background non-blocking
PERF(morpho): Module-level URL cache in MorphoGallery (50min TTL Map) — filter changes reuse cached URLs instantly without waiting for API
SCHEMA: Add signed_url_cache + signed_url_expires_at columns on morpho_photos (migration 20260428_morpho_photos_url_cache.sql)
PERF(morpho): Paginate /api/morpho/photos — limit 24 + offset, returns hasMore flag to avoid loading 100+ signed URLs at once
FIX(morpho): MorphoGallery — paginated loading with "Charger plus" button, grid-cols-6 (smaller cards), optimized image sizes
FIX(morpho): Fix position filter — photos with unrecognized field_key were silently assigned 'front'; they are now excluded from sync. Added aliases (face, dos, profil_g, etc.). Upsert now updates position on re-sync.
FIX(session-logger): Recommended inputs visually distinct — green-tinted border+text when system pre-filled, resets to white on manual edit
FIX(session-logger): Guard `!rir_actual` replaced by `rir_actual === ''` — RIR 0 (à l'échec) now triggers recommendation instead of silently skipping
FIX(setRecommendation): Blend weights corrected — live set now 70%, history 30% (was inverted); reduces over-reliance on last week when fatigue is present
FIX(setRecommendation): Round to 0.5kg instead of 0.25kg — avoids display truncation (56.25 → 56.5), matches real gym plate increments
FIX(setRecommendation): confidence threshold lowered from >10 to >8 reps — matches 1RM formula precision boundary (±2.5% up to 8 reps)
FIX(session): Fix 404 on session start — query used non-existent `template_id` FK + `coach_program_templates` JOIN on `programs`; replaced with direct `goal`/`level` columns (added in migration 20260420)
FEATURE(session-logger): Add in-session set recommendation engine — pre-fills next set weight/reps using 1RM calculation blended with last week history. Badge shows delta vs previous week (↑ green / ↓ amber / = S-1 grey)
FIX(morpho): MorphoCanvas — bug ligne/rect/cercle dessinés derrière la photo corrigé (fc.selection=false + objets non-interactifs en mode outil)
FIX(morpho): MorphoCanvas — photo verrouillée en mode outil (evented:false permanent, selection désactivée, curseur adapt)
FEATURE(morpho): MorphoCanvas — fond grille de points infinie style Figma synchronisée avec le zoom/pan Fabric
FEATURE(morpho): MorphoCanvas — zoom molette centré sur le curseur + pan clic molette
PERF(morpho): sync bilan photos fire-and-forget — galerie s'affiche immédiatement sans attendre la sync
PERF(morpho): signed URLs en batch par bucket (createSignedUrls) — N appels Supabase Storage → 3 appels max
PERF(morpho): MorphoCanvas en dynamic import — Fabric.js (~500kb) chargé uniquement à l'ouverture du canvas
FIX(morpho): MorphoCanvas toolbar — icônes Lucide au lieu de labels tronqués, tooltips contextuels avec description de chaque outil
FIX(morpho): MorphoCanvas — implémentation du dessin ligne/rectangle/cercle via mouse:down/move/up Fabric.js (était non fonctionnel)
FIX(morpho): MorphoCanvas — curseur adapté à l'outil actif (crosshair, text, cell, default)
FIX(morpho): MorphoCanvas — color picker remplacé par overlay lisible avec icône Palette + point de couleur actuel
FIX(morpho): MorphoCanvas — slider épaisseur remplacé par sélecteur visuel 5 niveaux avec aperçu du trait
FIX(morpho): MorphoCanvas — outil Texte revient automatiquement en mode Sélection après placement

## 2026-04-28

FIX: SessionLogger — parseSetForApi corrige le bug || null qui transformait 0 en null pour reps/poids/RIR
FIX: Home page client — affiche "Séance réalisée ✓" après complétion en vérifiant client_session_logs du jour
FIX: muscleDetection — CATALOG_SLUG_MAP étendu aux slugs FR anatomiques (trapeze_superieur, grand_dorsal, etc.)
FIX: SessionLogger — rest timer modal retardé à 8s et bloqué pendant saisie active (activeInputRef)
FEATURE: SessionLogger — supersets affichés en cartes empilées verticalement, repos déclenché après le dernier exercice du groupe
REFACTOR: SessionLogger — navigation par groupe (superset ou solo) au lieu d'index exercice individuel

FIX: MorphoPro — actions sélection (Comparer/Annoter/Analyser IA) déplacées dans la TopBar, floating bar supprimée
FIX: MorphoPro — grille 4 colonnes, aspect-[2/3], lazy loading images pour réduire la latence


FEATURE: MorphoPro coach — galerie photos, canvas annotation Fabric.js, analyse IA GPT-4o structurée (JSON), score postural, flags zones, recommandations, comparaison multi-photos
SCHEMA: Add morpho_photos table (index centralisé photos bilans + uploads coach)
SCHEMA: Add morpho_annotations table (canvas Fabric.js persisté par photo/coach)
SCHEMA: Extend morpho_analyses with photo_ids and analysis_result columns
REFACTOR: Replace Inngest morpho job with synchronous GPT-4o analysis (response_format: json_object)
CHORE: Remove legacy analyzeMorphoJob, job-status route, morpho-analyze Inngest function

## 2026-04-27

FEATURE: Client onboarding — 5 écrans swipables (bienvenue personnalisé, programme, séance, progression/nutrition, hub) remplacent la page welcome statique
FEATURE: OnboardingTour — tooltip tour guidé au premier lancement sur le dashboard (5 étapes, non-skippable, persisté en localStorage)
CHORE: Daily Check-ins spec documentée (docs/superpowers/specs/2026-04-27-daily-checkins-spec.md) — DB schema, API routes, gamification, intégration onboarding

FIX: muscleDetection — couverture complète slugs catalogue (rear_delts, levator_scapulae, trapezius, anconeus, adductors, upper_chest, pec_major, quads, calves, shoulders...) + fallback lookup catalogue par nom d'exercice quand primary_muscles[] est vide (exercices créés sans enrichissement biomech)
FIX: muscleDetection — ajout CATALOG_SLUG_MAP pour traduire les slugs catalogue (FR courts: dos/pectoraux/epaules + EN anatomiques: lats/pectoralis_major/anterior_deltoid...) vers les MuscleGroup BodyMap ; les muscles du BodyMap étaient systématiquement faux (seuls biceps/triceps s'allumaient) car isValidMuscleGroup rejetait tous les slugs catalogue
REFACTOR: Client app — DS v2.0 alignment : ClientTopBar flat dark (border-[0.3px] bg-[#121212], no blur/shadow/gradient), BottomNav max-w-[480px] + safe-area-inset-bottom + border-[0.3px], tous les headers hardcodés remplacés par ClientTopBar (home, profil, programme, bilans, progress), ConditionalClientShell padding safe-area aware
FIX: /api/client/restrictions — include coach_id in metric_annotations insert (NOT NULL constraint caused silent insert failure, restrictions added by client never appeared in coach dashboard)

FIX: MetricsSection — annotation emoji icons rendered via foreignObject (SVG <text> ne rend pas les emojis cross-browser)
FIX: sw.js — bump cache v2→v3 pour forcer réinstallation SW (vieux cache servait une page /client périmée après déploiement)
FIX: ConditionalClientShell — ajout /client/onboarding aux AUTH_PATHS (BottomNav ne doit pas s'afficher pendant l'onboarding)
FIX: client/onboarding — setSession() manuel depuis hash (supabase/ssr ne traite pas le hash automatiquement contrairement au SDK browser)
FIX: invite/route — utilise type 'recovery' au lieu de 'invite'/'magiclink' — seul type qui produit un hash #access_token fiable sur mobile Safari
FIX: client/onboarding — polling getSession() toutes les 300ms en fallback si INITIAL_SESSION sans session (mobile Safari ne fire pas SIGNED_IN de façon fiable)
FIX: client/login — forward automatique vers /client/onboarding si hash access_token présent (token d'invitation arrivant sur la mauvaise page)
REFACTOR: Modal création client — suppression des champs objectif, niveau, pratique sportive, fréquence (données recueillies via le bilan)
FIX: invite/route.ts — generateLink utilise 'invite' pour nouveaux comptes, 'magiclink' pour comptes existants (type 'invite' → 422 si email déjà enregistré)
FIX: Client onboarding — suppression du gate hasHashToken (le SDK Supabase consomme le hash avant la lecture) + getSession() immédiat si session déjà active
FIX: Client onboarding — page simplifiée pour gérer uniquement le flow implicit hash (SIGNED_IN) correspondant au type 'invite'
FIX: Email templates — ajout meta color-scheme:dark + prefers-color-scheme media query pour empêcher l'inversion auto des couleurs en mode sombre

FEATURE: ClientAccessToken — bouton "Envoyer un bilan" ouvre modal avec liste des templates à assigner (envoi email immédiat) ou CTA "Créer un bilan" si aucun template
REFACTOR: ClientAccessToken — bouton "Envoyer l'invitation" (client inactif/suspendu) promu en CTA pleine largeur DS v2.0 (h-46, icône droite, uppercase)
REFACTOR: layout [clientId] — skeleton de chargement aligné sur la vraie structure 2 colonnes de la page Profil
REFACTOR: Page Profil client — refonte structure : Informations complémentaires fusionnées dans card Informations, Restrictions + Équipement intégrés dans Profil sportif (ordre : restrictions → paramètres → équipement), Tags isolés en colonne droite, "Fréquence" renommé "Disponibilité"
REFACTOR: RestrictionsWidget — prop section ('all'|'restrictions'|'equipment') pour rendu sélectif

FIX: MetricsSection — chart always extends to today's date (today injected as phantom point in merged + absoluteData useMemos)



FIX: NutritionStudio edit page — suppression du double skeleton (page-level skeleton retiré, NutritionStudio monte immédiatement avec skeletons colonnes intégrés)

FIX: NotificationBell — notification assessment_completed redirige vers /coach/clients/[client_id]/bilans/[submission_id] (était /coach/bilans/[id] → 404)
FIX: Bilan photos — signed URLs générées via service role server-side (/api/assessments/photos/signed-url) au lieu du client Supabase anon (bucket privé, RLS bloquait tout accès direct)
FEATURE: API POST /api/assessments/photos/signed-url — génère une signed URL 1h pour une photo du bucket assessment-photos (auth coach requise)

FIX: Middleware — /client/onboarding ajouté aux routes publiques (cause racine du spinner infini : le middleware redirigait vers /client/login avant que le code PKCE soit échangé)
FIX: Client onboarding — détection immédiate des erreurs Supabase dans l'URL avant toute opération async
FIX: Client onboarding — fail fast si ni ?code= ni #access_token dans l'URL (plus de spinner infini)
FIX: Client onboarding — useRef évite double-résolution onAuthStateChange en StrictMode
FEATURE: Client onboarding — /client/onboarding remplace /client/set-password + /client/auth/callback (0 redirects)
REFACTOR: invite/route.ts — redirectTo pointe vers /client/onboarding
REFACTOR: Suppression de /client/set-password et /client/auth/callback

REFACTOR: NutritionStudio — skeletons des 3 colonnes refaits (structure fidèle au layout réel : composition/métabolisme/TDEE col1, waterfall grille+total col2, jours+éditeur actif col3)
FIX: CalculationEngine — calories cibles affichées = macroResult.calories (après goal + ajustement), plus macroResult.tdee brut
FIX: useNutritionStudio — goalCalories exposé (calories post-goal, pré-calorieAdjustPct) pour delta correct dans le slider
REFACTOR: CalorieAdjustmentDisplay — props tdee→baseCalories+targetCalories, delta et kcal cibles désormais exacts
REFACTOR: CalorieAdjustmentDisplay — slider aligné sur pattern hydratation (thumb coloré dynamique, track fill depuis centre, marqueurs -30/-15/0/+15/+30%, même CSS thumb)
FIX: Hydratation — algorithme recalibré pour athlètes récréatifs (bonus activité 0/150/300/450/700ml vs 0/300/600/900/1200ml, genre en offset plat, cap 6L water loading)
FIX: Hydratation — slider instantané (bypass debounce 300ms, useEffect séparé sur hydrationPhase via baseHydrationLitersRef)
FIX: Hydratation — curseur slider stylé DS v2.0 (thumb couleur dynamique = getPhaseColor, suppression jaune natif browser)
REFACTOR: NutritionProtocolDashboard — MacroDonut SVG supprimé, remplacé par DayMacroRow (nom+kcal en ligne, dots P/L/G + grammes + %, barre segmentée)
FEATURE: Hydratation — slider continu de phase (40–200%, 5 marqueurs indicatifs : pré-compet/sèche/base/sèche int./water load)
FEATURE: Hydratation — multiplicateur de phase appliqué au calcul EFSA en temps réel, couleur et description dynamiques
REFACTOR: CalculationEngine — titre "Calcul nutritionnel" en header fixe aligné sur Col 1 et Col 3 (px-4 pt-4 pb-3, text-[13px] font-semibold)
REFACTOR: ProtocolCanvas — bouton "Tous les calculs" → "Appliquer les paramètres"
REFACTOR: infoModalDefinitions — allCalculations modal mis à jour (titre + description contextualisés)
REFACTOR: Page Profil client — layout 2 colonnes (infos/sport/restrictions à gauche, accès/formules/CRM à droite), élimine espace vide full-width
FIX: RestrictionsWidget — suppression des headers internes dupliqués ("Restrictions physiques" / "Équipement disponible"), renommés en labels courts
FEATURE: Coach clients page — affichage photo de profil client dans les cartes (grille + liste), fallback initiales colorées
FIX: MetricsSection — annotations et phases via AnnotationsLayer (useXAxisScale + usePlotArea Recharts v3 hooks) — résout icônes invisibles sur chart category axis
FIX: MetricsSection — ajout lab_protocol à AnnotationType + ANNOTATION_ICONS (🧪) + ANNOTATION_LABELS
SCHEMA: metric_annotations — ajout colonne source_id UUID nullable + index (migration 20260427_annotation_source_id.sql)
FEATURE: Annotations bidirectionnelles — assign programme crée annotation program_change (source_id=program.id) ; DELETE programme supprime l'annotation liée
FEATURE: Annotations bidirectionnelles — share protocole nutrition stocke source_id=protocolId ; DELETE et unshare suppriment l'annotation liée

REFACTOR: CoachShell TopBar — retrait glassmorphisme (backdrop-blur, shadow, gradient), alignement DS v2.0 strict (bg-[#121212], border-[0.3px] border-white/[0.06]), hauteur réduite h-16→h-14
REFACTOR: NavRowB — retrait glassmorphisme, icônes Lucide→Phosphor Icons (regular/fill selon état), label "Lab"→"Athlètes", boutons sans border individuelle
REFACTOR: NavRowA — retrait backdrop-blur, bg-white/[0.03]→bg-[#121212], alignement DS v2.0
FEATURE: Animation "Entrée dans le Lab" — micro-animation scale+tint vert (#1f8a65/8%) au clic carte client avant navigation (CardGrid + ListView)

FIX: NutritionProtocolDashboard — replace window.confirm() with DS v2.0 DeleteConfirmModal (bg-[#181818], backdrop-blur, rouge)
FIX: Nutrition protocols page — skeleton aligné sur grille 2 colonnes (4 cartes, structure badge+titre+jours)
FIX: NutritionStudio — save/share TopBar closures stale (useMemo + useRef pattern, deps=[])
REFACTOR: NutritionProtocolDashboard — toutes les cartes (actif + brouillons) en grille 2 colonnes, suppression full-width systématique
FIX: MacroPercentageDisplay — progress bars now have mr-4 so they don't bleed to column edge
FIX: MetricsSection overlay chart — annotations non affichées : ifOverflow="visible" sur ReferenceLine (défaut Recharts = "discard" si date hors domaine category)
FIX: MetricsSection overlay chart — labels SVG clips : overflow-hidden retiré du div chart, [&_svg]:overflow-visible sur ChartContainer
FIX: MetricsSection overlay chart — annotations multiples le même jour superposées (stackIndex → décalage vertical 26px par annotation)
FIX: MetricsSection overlay chart — point fantôme +1j injecté quand annotation ≥ dernière date de données (étire le domaine X)
FIX: NutritionStudio save — track savedProtocolId so "Brouillon" PATCHes existing protocol instead of creating duplicates
REFACTOR: CalorieAdjustmentDisplay — move "Calories cibles" inline with % line (removed separate row in CalculationEngine)
REFACTOR: NutritionProtocolDashboard — drafts rendered in 2-column grid instead of full-width stacked cards
FIX: MacroPercentageDisplay — tighten gap and label width (w-20→w-16, gap-3→gap-2) for better alignment
REFACTOR: MacroPercentageDisplay — add colored progress bars per macro row (protein/fat/carbs)
REFACTOR: CalculationEngine — Carb Cycling refactored from text link to proper toggle buttons (Désactivé / Activé) with SectionDivider
FIX: TdeeWaterfall — increase bar thickness 5px → 8px for better visibility
FIX: ProtocolCanvas — remove stale destructured props (clientName, saving, sharing, onSave, onShare, onPreview)
FIX: CoachShell TopBar — supprimé overflow-hidden sur le header pour que les dropdowns (NotificationBell) ne soient plus clippés
REFACTOR: TdeeWaterfall — refonte complète en grille 4 segments (valeur + % + source), suppression légende séparée
FIX: MacroPercentageDisplay — colonnes à largeur fixe (w-20/w-14/w-16), plus aucun troncage du pourcentage
FIX: Override g/kg LBM — déplacé inline sur la ligne Protéines (plus sous Glucides)
FIX: Nutrition Studio — Move "Ajuster les paramètres" button from bottom to header (compact icon button)
FIX: Nutrition Studio — Increase backdrop opacity 40% → 50% for clearer panel visibility
REFACTOR: NotificationBell — polling 30s → 60s, add visibility-change listener
FEATURE: Client onboarding — Single-page refactor (merge set-password + auth/callback into /client/onboarding)
FEATURE: Client onboarding — Unified auth flow (PKCE code + implicit hash), 3-step wizard, timeout 15s
FEATURE: Client onboarding — Session established before form render (zero auth race conditions)

## 2026-04-26

FEATURE: Nutrition Studio — 11-task UX refactor (Tasks 7-10 complete)
FEATURE: Nutrition Studio — Data validation (clamp session_duration, cardio_frequency, cardio_duration)
FEATURE: Nutrition Studio — Col 1-3 refactoring (parameters panel, calculation engine, protocol canvas)
FEATURE: New components — ParameterAdjustmentPanel, InfoModal, TdeeWaterfallLegend, CalorieAdjustmentDisplay
FEATURE: Nutrition Studio — Task 10 (action buttons to TopBar with loading states)

## 2026-04-25

REFACTOR: Migrate n8n → Inngest for all async jobs (retry x3, timeout 5min, Vercel integrated)
FEATURE: Nutrition protocols — CRUD API, dashboard, client page (/client/nutrition)
FEATURE: TopBar coach — context client (photo, name, goal, level, status, page)
FEATURE: Client app — BottomNav → dock flottant (glassmorphism)
FIX: Session logs — live upsert via PATCH /sets (debounce 800ms)

## 2026-04-24

FEATURE: Exercise biomechanics enrichment (Phase 2) — all 458 exercises complete with 14 biomech fields
FEATURE: Smart Fit — volume coverage MEV/MAV/MRV scoring (16 muscle sub-groups, Israetel/RP thresholds)
FEATURE: Program Intelligence Phase 2B — client profile (injuries, equipment) + SRA customization
FEATURE: Phase 3 — PerformanceFeedbackPanel + auto-recommendations (volume/weight/swap/rest)

---

**See CHANGELOG.archive.md for pre-2026-04 history.**
