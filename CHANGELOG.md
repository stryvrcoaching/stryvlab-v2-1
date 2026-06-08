# CHANGELOG — STRYVR

> **Format court** — entrées de 1 ligne par changement.
> **Archivé** → voir `CHANGELOG.archive.md` pour l'historique complet (< 2026-04)

## 2026-05-22

FIX: Replace yellow STRYVR logo references with the gray public logo on client auth pages and email templates
FIX: Chat input voice transcription now appears inside the textarea and no longer shows the separate "Enregistrement vocal actif" message
REFACTOR: BottomNav icons — replace custom ChatBubbleIcon SVG + lucide-react Dumbbell with Material Design icons (MdChat + MdFitnessCenter) for consistency with Nutrition (MdRestaurant) and Metrics (MdShowChart)
REFACTOR: BottomNav + button radius — increase from rounded-2xl (16px) to rounded-[20px] for subtly more rounded corners
FEATURE: Add weekly training/rest-day overview in Nutrition Studio protocol editor
SCHEMA: Add `weekday` (0=Sunday..6=Saturday) and `day_type` (`training`|`rest`|`special`) to `nutrition_protocol_days` (migration `20260522_add_daytype_weekday.sql`)

## 2026-05-21

REFACTOR: Splash screen PWA — remove splash1.png background image, solid dark #0d0d0d only
REFACTOR: Logo animation — 180° rotation with momentum, 1s pause, repeat cycle at 3s duration (was 1.4s ease-in-out simple half-rotation)
REFACTOR: Reduce splash screen duration from 2200ms to 1200ms (1 second faster loading); sync Capacitor SplashScreen launchShowDuration to 1200ms
REFACTOR: Update Capacitor StatusBar and Android backgroundColor from #ededed to #0d0d0d (dark theme)

REFACTOR: Reorder client mensurations anatomically; remove redundant shoulder circumference field; align client measurements with coach fields

FEATURE: Add fresh lemon juice (Jus de citron pressé) to food_items database — category: drinks/jus-smoothies
FIX: BottomNav visual redesign to floating premium pill dock with centered CTA, muted inactive states, and safe-area spacing
FIX: Client BottomNav now uses a centered fade overlay behind the dock on non-chat pages so content disappears smoothly beneath the bar
FIX: Nutrition targets now respect training schedule — per-day protocol day selection prefers 'high' carb days when training session exists for that date; affects both badge display and macro targets
FIX: QuickLogSheet "Repas" — navigue vers /client/nutrition?addMeal=1 pour ouvrir MealLogSheet directement
FIX: NutritionClientPage — détecte ?addMeal=1 via useSearchParams, auto-ouvre MealLogSheet, nettoie le param après fermeture
FIX: ClientMeasurementSheet — replace silhouette/ruler UI with direct numeric inputs and persist via /api/client/measurements
FIX: MesurationsTab — dropdown metric selector replaces body silhouette picker; FAB uses rounded-xl and opens measurement sheet

FEATURE: BottomNav — central FAB + button (50px, bg-[#f2f2f2]) entre Programme et Nutrition
FEATURE: QuickLogSheet — bottom sheet 3 actions : Eau (QuickWaterModal), Repas (/client/nutrition), Activité (FreeActivitySheet)
FEATURE: ClientMeasurementSheet — body zones + horizontal ruler picker + save to DB
FEATURE: BodyMapAnnotated — BodyMap with measurement overlay, dashed connectors, bilan pills
FEATURE: /api/client/measurements POST — self-reported measurements endpoint
SCHEMA: client_measurements table (waist/hips/arm/chest + RLS) — apply manually via Supabase Dashboard
FEATURE: /api/client/body-data — merges client_measurements into measuresByBilan, sorted by date
FIX: MesurationsTab — BodyMap replaces BodySilhouette; + FAB opens measurement sheet; onRefresh reloads data
FIX: MetricsClientPage — tab bar segment-control style (matches ProgrammeClientPage)

FEATURE: System prompt v2 — coach identity (user_profiles), full bilan history (limit 10, ascending), active program, tone rules (2-3 phrases max, no generic advice)
FEATURE: buildDailyBrief — structured day summary after check-in (session, macros, water, 1 LLM coaching sentence)
FEATURE: chat-morning-brief Inngest cron 06:30 UTC — proactive morning init message per active client with trigger_checkin chip
FEATURE: chat-evening-brief Inngest cron 21:30 UTC — proactive evening init message per active client with trigger_checkin chip
FEATURE: ChatPage handles trigger_checkin chip — activates existing check-in flow, marks chip answered
FIX: Water target reads from nutrition_protocol_days.hydration_ml (was hardcoded 2500ml)
FIX: Bilan history expanded from 2 to 10 entries — PROGRESSION TOTALE now shows full delta since first bilan
FIX: MesurationsTab — replace basic BodySilhouette SVG with BodyMap (full anatomical, neutral mode)
FIX: MetricsClientPage — tab bar now uses segment-control style matching ProgrammeClientPage

FEATURE: Metrics page refactored with 3-tab navigation (Données corporelles / Mensurations / Vitalité)
FEATURE: MetricCard generic component with expand-inline SVG chart, bilan markers, coach annotations
FEATURE: BodySilhouette SVG front-view with bilan date navigator and dashed measurement annotation lines
FEATURE: VitalityTab with aggregated wellness score (0-100) from client_daily_checkins
FEATURE: /api/client/vitality route — score formula energy×1.5 + sleep×1.5 − stress − soreness×0.5
FEATURE: /api/client/body-data extended with bodyFatSeries, leanMassSeries, measuresByBilan, annotations

## 2026-05-24

FIX: Select nutrition protocol day by physiological date instead of always using the first protocol day
FIX: Localize /client/nutrition header date and classify protocol day with explicit carb-cycle / cycle phase badge
FIX: ChatInputBar voice icon now records speech directly into the chat input field instead of opening the nutrition voice sheet

FEATURE: Macro color system — copper(#8c5230)=protéines, gold(#9a8038)=glucides, petrol(#2d7a62)=lipides, steel(#4d8090)=eau
FEATURE: Arc gradient copper→gold→petrol sur jauge calories (SmartNutritionWidget, SmartNutritionHero, NutritionWidget)
REFACTOR: NutritionWidget, SmartNutritionWidget, SmartNutritionHero — carb var(--data-gold), fat var(--data-petrol), water var(--data-steel)
REFACTOR: MacroWeekGrid, NutritionMealsList, NutritionLogContent — même mapping macro couleurs
CHORE: globals.css + tailwind.config.ts — data token values mis à jour (copper/gold/petrol/steel)
CHORE: ui-design-system.md — section DS v4.0 Data Colors ajoutée avec règles macro + arc gradient

## 2026-05-23

FIX: VoiceLogSheet — stopRecording lit accRef.current dans recognition.onend (non plus en sync) pour capturer les résultats finals ASR sur enregistrements courts
FIX: VoiceLogSheet logMeal — food_item_id lu via c.data?.id (API retourne { data } pas { id directement }) — élimine erreur "Impossible d'analyser le repas"
FIX: VoiceLogSheet — reset logging=false au re-open pour éviter le bouton log bloqué si fermeture pendant logMeal

## 2026-05-22

FEATURE: Add 3-tab navigation to /client/nutrition (Aujourd'hui / Tendances / Protocole)
FIX: setRecommendation — restore rir_hold veto in Path A, scope failure_recovery to belowZone only, remove 0.25kg increment floor
FIX: Volume hebdomadaire — client_set_logs ne possède pas completed_at (colonne session-level uniquement) → suppression du champ du select nested, volume coverage affiche désormais les vraies valeurs
FIX: Perf sessions query — reps_actual inexistant → actual_reps, completed_at sur sets → completed (boolean)

## 2026-05-21

FEATURE: Chat SP2 — interactive check-in flows (chips, sliders, number input) morning/evening with smart time detection
FEATURE: Chat SP2 — ChatBubble supports interactive message types (chips, slider, number) via metadata JSONB
FEATURE: Chat SP2 — POST /api/client/checkin saves check-in data to client_daily_checkins + LLM closing message
FEATURE: Chat SP2 — buildSystemPrompt enriched with 3-day nutrition trends and daily check-in context
FIX: buildSystemPrompt — correct nutrition_meals columns (total_calories/total_protein_g/total_fat_g/total_carbs_g) + include meal_logs legacy source
SCHEMA: Add client_daily_checkins table (sleep, energy, stress, weight, hunger, muscle_soreness) with RLS

## 2026-05-22

FIX: NutritionMealsList — cartes collapsées par défaut (était expanded par défaut)
FIX: MealTypeChooser — stopPropagation sur bouton + overlay pour éviter toggle de la carte; retrait overflow-hidden sur racine MealCard pour que le dropdown ne soit pas tronqué
FIX: NutritionLogContent standalone — paddingTop déplacé du parent vers la motion.div (absolute inset-0 ignorait le paddingTop du parent, contenu masqué sous la TopBar fixe)
FIX: ChatBubble — coach avatar shows real photo (logo_url from coach_profiles) with first-letter initial fallback instead of hardcoded "S"
FIX: ChatConversation — typing indicator uses coach avatar/initial (consistent with message bubbles)
FIX: ChatPage — empty state coach avatar uses dynamic initial fallback

FEATURE: Nutrition — heure et nom personnalisé sur création repas (NutritionLogContent footer + VoiceLogSheet review layer)
FEATURE: NutritionMealsList — édition inline heure repas existant (tap heure → input[type=time] → PATCH)
FEATURE: POST /api/client/nutrition/meals — champ title accepté
FEATURE: PATCH /api/client/nutrition/meals/[id] — logged_at accepté, physiological_date recomputé
FIX: TempoGuideModal — ECC phase → vivid gold #d4920f (was gray #e0e0e0); background gradient 18→55 opacity, ellipse 70%x40%→90%x65% for striking phase immersion; diamond colors CON_COLOR/ECC_COLOR
FIX: BodyMap — muscle colors migrated from yellow rgba(255,224,30) to copper rgba(157,112,82) with opacity tiers (primary 0.90, secondary 0.42, stabilizer 0.16)
FIX: SetRow — completed set border/bg migrated from yellow to copper (rgba(157,112,82,0.07/0.24))
FIX: ExerciseBlock — active set glow migrated from yellow to copper ring (rgba(157,112,82,0.28))
FIX: TdeeChart — band fill + dot fills migrated from yellow to copper
FIX: PrepTimeModal — all #FFB800 accents replaced with copper #9d7052, CTA → DS v4.0 bg-[#f2f2f2]
FIX: ProgrammeClientPage/login/onboarding/ClientRestrictionsSection/OnboardingTour/PreferencesForm/ProfileForm — hover:bg-[#ffd000] → hover:bg-[#e8e8e8]
FIX: NutritionMealsList — MC constant old hex → data-copper/petrol/steel
FIX: MacroWeekGrid (Régularité 7j) — carb data-gold→data-petrol, fat data-gold→data-steel
REFACTOR: G/Glucides redéfini globalement data-petrol (#3d7070) — NutritionWidget/SmartNutritionWidget/SmartNutritionHero/NutritionLogContent; kcal arc libéré → data-gold
FIX: NutritionLogContent — cartes catégories/subcatégories/items/inputs (#111111 sur #111111) → bg-[#1a1a1a] pour profondeur visuelle
FIX: NutritionLogContent — macros P/G/L → data-copper/petrol/steel (mini-bars, macro card, footer)
FIX: NutritionWidget — lipides utilisait data-gold comme glucides, remplacé par data-steel (#607a80)
FEATURE: VoiceLogSheet — ajout item manuel déclenche AI lookup (voice-parse) sur name blur pour auto-remplir les nutriments
REFACTOR: SmartNutritionWidget + SmartNutritionHero — couleurs macros migrées de hex vivants vers data-copper/gold/steel, eau → data-petrol
REFACTOR: VoiceLogSheet — badges confiance migrés vers data-petrol/gold (suppression #22c55e/#f59e0b)
CHORE: globals.css + tailwind.config.ts — ajout token --data-steel: #607a80

## 2026-05-21

REFACTOR: Client PWA — Design System v4.0 dark gray minimal (DS v4.0) — 60+ fichiers
REFACTOR: Suppression totale #ffe01e (accent jaune) de toute l'app client
REFACTOR: Suppression totale border-white/_ dans composants client (zéro bordures)
REFACTOR: Gray scale #080808→#f2f2f2 comme unique système couleur UI /client
REFACTOR: Boutons primary → bg-[#f2f2f2] text-[#080808] (monochrome max contraste)
REFACTOR: Nav active → text-[#f2f2f2], inactive → text-[#5a5a5a]
REFACTOR: Chat — user bubbles bg-[#f2f2f2] text-[#080808], bot bg-[#111111]
REFACTOR: Nutrition charts — data colors var(--data-copper/gold/petrol) uniquement
REFACTOR: TempoGuideModal — accent #FFB800 → #e0e0e0, phases PHASE_CONFIG neutres
REFACTOR: AdherenceScoreCard — thèmes recalibrés sur gray scale
CHORE: globals.css — ajout tokens --c-_ (gray scale) + --data-copper/gold/petrol
CHORE: tailwind.config.ts — gray scale + data colors ajoutés
CHORE: manifest.json + viewport themeColor → #080808

## 2026-05-22

FIX: MetricsPage — fetch and display client profile_photo_url in hero avatar
FIX: MetricsPage — settings gear button now navigates to /client/profil (full page with all settings) instead of empty bottom sheet
FIX: app/client/page.tsx — fetch coach_profiles.logo_url from coach_id and pass as coachAvatarUrl to ChatPage
REFACTOR: MetricsPage — remove unused settings bottom sheet, supabase client, settingsOpen state
FEATURE: MetricsPage — add "DONNÉES CORPORELLES" section label above body data

FIX: buildSystemPrompt — expand LLM scope to body composition, phases, periodization (removed hardcoded out-of-scope reply)
FIX: buildSystemPrompt — inject latest body comp data (weight, BF%, LBM, weight delta vs prev bilan) into system prompt

## 2026-05-21

FIX: ChatPage — fixed layout, input bar anchored to bottom (was at top due to h-full in pb-24 shell)
FIX: ChatPage — empty state with personalized greeting, STRYVR avatar, quick suggestion chips
FIX: ChatTodayStrip — water query uses gte/lte logged_at instead of .eq('date') — was always 0L
FIX: ChatTodayStrip — check-in pill sends check-in message to chat, water pill opens QuickWaterModal
FIX: ChatTodayStrip — calories + water mini progress bars inline
FIX: MetricsPage — remove streak_days column (doesn't exist), fetch current_streak from client_streaks
FIX: client/page.tsx — pass clientFirstName for personalized greeting in ChatPage empty state
FIX: /api/client/body-data — fix broken destructuring of Promise.all (include checkins result); prevents 500 and restores metrics payload

## 2026-05-21

CHORE: food_items — refonte catégories : migration 20260521 (CHECK + reclassifications), category `drinks` séparée, parmesan/mozzarella → proteins/laitiers, miel/confiture → extras/sucres, frites/purée/gnocchis → carbs/fecules, snacks salés/sucrés + boissons restructurés, labels nettoyés (suppression fast-food)
CHORE: seed-food-items — 171 items total, +ajouts (coupes bœuf, poissons frais, fromages, beurre de baratte, couscous, riz basmati, snacks), zéro doublon

## 2026-05-20

FEATURE: Chat-first client app SP1 — conversational home page replaces Smart Agenda
FEATURE: /client now renders ChatPage with today-strip, conversation, voice input
FEATURE: /client/metrics — new body metrics page replacing /client/profil
REFACTOR: BottomNav 4 tabs (Chat/Programme/Nutrition/Métriques) — radial FAB removed
SCHEMA: Add chat_messages table — 3-day rolling window, archived_at archiving
SCHEMA: Add chat_sessions table — morning/evening/freeform flow tracking
FEATURE: API GET /api/client/chat/messages — active messages (archived_at IS NULL)
FEATURE: API POST /api/client/chat/messages — send + LLM response + save both
FEATURE: API GET /api/client/chat/archives — messages by date
FEATURE: API GET /api/client/chat/today-strip — sessions, calories, water, checkin status
FEATURE: Inngest cron chat-archive — archives messages older than 3 days at 03:00 UTC
REFACTOR: Remove CoachAIButton, CoachAIChatSheet — replaced by dedicated ChatPage
FIX: VoiceLogSheet — add onTranscriptOnly prop for chat voice input without meal logging
FIX: ClientTopBar — remove CoachAIButton reference
FIX: NotificationsBar — update /client/profil links to /client/metrics

## 2026-05-21

CHORE: seed-food-items — +47 aliments : coupes bœuf (entrecôte, faux-filet, bavette, côte, rôti), charcuterie (jambon blanc/sec, lardons), viandes (veau, canard, foie), poissons frais (truite, bar, dorade, tilapia, sole, lieu noir, moules, saumon fumé, thon frais), conserves (thon huile, maquereau tomate, anchois), beurres (baratte, demi-sel, ghee, cacahuète), fromages (emmental, comté, gruyère, camembert, brie, cheddar), glucides (couscous, riz basmati/jasmin, pâtes fraîches, galettes riz, muesli), laits végétaux
FEATURE: i18n ES/EN — traduction complète app client PWA (+~150 nouvelles clés dans clientTranslations.ts)
FEATURE: i18n — TempoGuideModal phases (contraction/maintien/descente/pause), tap-resume, PRÊT/READY/LISTO
FEATURE: i18n — SessionLogger coaching cues, PR flash, erreurs réseau, compteur séries, UI repos
FEATURE: i18n — ProgrammeClientPage tabs (Séance/Performances/Historique), streak, périodes heatmap, KPIs
FEATURE: i18n — CoachAIChatSheet greeting, suggestions rapides, erreurs, placeholder, compteur messages
FEATURE: i18n — SmartWorkoutWidget, SetTypeSelector (types séries), SetRow (valider), ExerciseBlock (résumé)
FEATURE: i18n — NutritionWidget toggle Consommé/Restant + SmartNutritionWidget régularité protéines
FEATURE: i18n — FreeActivitySheet (titres, labels), DayChecklist (items), QuickWaterModal (loguer eau)
FEATURE: i18n — ClientRestrictionsSection zones anatomiques + sévérités + form complet
FEATURE: i18n — SmartAlertsFeed (voir plus/réduire), DeloadAlertBanner, AdherenceScoreCard labels
FEATURE: i18n — PortionScalingForm instructions de mesure main
FEATURE: i18n — pages erreur accès (suspendu, expiré, invalide) converties en Client Components i18n

## 2026-05-20

FIX: VoiceLogSheet — quantité éditable via draft local + commit onBlur, macros calculées depuis bases par gramme (plus de reset à zéro en cours de frappe)
FIX: voice-parse prompt — règle absolue nom transcript verbatim, catalogHint isolé à résolution ID uniquement (évite substitution par aliments du catalogue), temperature 0.1, préfixe "Transcript vocal :"
FIX: VoiceLogSheet — setModeSync("recording") déplacé dans startRecording (après le guard) — évite que le guard modeRef==="recording" court-circuite startRecording avant le démarrage
FIX: CheckinModal — handle 409 "already responded" as success, show error message on failed submit
FIX: DayChecklist hydratation item — ouvre QuickWaterModal au lieu de naviguer vers /client/nutrition
FIX: CoachAIButton — déplacé de div fixed global vers ClientTopBar right slot (évite superposition avec photo profil, badges, etc.)
FIX: CoachAIChatSheet — height 88vh fixe (au lieu de maxHeight) pour éviter le tronquage
FIX: Remove duplicate mic button from NutritionLogContent embedded sub-header (MealLogSheet already has one in its header)

## 2026-05-20

FIX: SetRow ConfirmModal CTA — h-14 (56px), text-[15px], tracking-[0.14em], safe-area-inset-bottom padding
FEATURE: Add Coach IA Chat — GPT-4o mini daily contextual chat in client PWA, 20 msg/day rate limit, zero message persistence
SCHEMA: Add ai_coach_daily_usage table for Coach IA daily rate limiting (client_id, date, message_count PK)

REFACTOR: setRecommendation — refonte complète logique ; RIR=0 (échec) = priorité absolue → descend charge d'un palier peu importe Path A/B ; RIR trop bas (≤ targetRir-1) → maintien charge + reps prescrites ; suppression rir_hold Path A (était trop permissif) ; seuil rirTooLow corrigé (< targetRir-1 au lieu de < targetRir-2) ; aboveZone + rirTooHigh → double incrément
FIX: bodymap recap — trapèzes et muscles absents car client_set_logs n'a pas de colonnes primary/secondary_muscles ; fallback catalog lookup (getPrimaryMuscleFromCatalog + getSecondaryMusclesFromCatalog) ajouté
FIX: notes de séance invisibles dans recap — SessionLogger envoyait `notes` (JSON string) dans champ texte ; corrigé : envoie `exercise_notes` (objet JSONB) → route PATCH accepte et persiste dans `exercise_notes`, recap les lit correctement
FIX: SessionLogger — RIR=0 (échec musculaire) force repos 3min automatiquement au lieu du repos prescrit
FIX: setRecommendation — palier minimum 0.25kg (évite recommandations type 27.6kg impossibles à charger) ; formatWeight snap au 0.25 le plus proche
FIX: zoom iOS sur focus input — maximum-scale=1 + userScalable=false dans viewport global (app/layout.tsx)
FIX: TempoGuideModal — bouton close masqué visuellement derrière l'overlay pause (blur zIndex 5) ; close button dupliqué dans l'overlay avec pointerEvents auto, visible et tappable en pause
FIX: RestTimer — nom exercice suivant tronqué (truncate → leading-snug wrap)
REFACTOR: SetRow — suppression double saisie (inline + modal) ; rows read-only (valeurs prescrites coach en grisé), tap n'importe où ouvre modal ; modal redesigné : steppers pleine largeur empilés verticalement, input KG centré lisible, RIR visible et éditable, set complété recliquable pour correction
FIX: ProgrammeClientPage — prochaine séance en mode repos affichait mauvais jour (fallback sessions[0] trié par position au lieu de day_of_week)
FIX: volume hebdomadaire — zéro affiché malgré séances complétées car getBiomechData retourne null pour exercices non-enrichis biomech ; fallback sur getPrimaryMuscleFromCatalog + 1 set crédit
FIX: VolumeCoverageWidget — suppression slice(0,12) qui cachait des groupes musculaires ; tri par actual décroissant (muscles travaillés en premier)
FIX: VolumeCoverageWidget — label "Volume hebdo" → "Volume hebdomadaire" (non tronqué)
FIX: onFocus select-all sur tous les inputs numériques restants — NutritionLogContent (quantité + macros manuelles), SetRow (repos/reps/poids inline), FreeActivitySheet, PortionScalingForm + type="number"→"text"
REFACTOR: MacroWeekGrid — suppression toggle Consommé/Restant et ligne récap (redondant), barres simples P/G/L empilées par jour, compact 56px, kcal sous chaque barre, aujourd'hui en jaune
FIX: nutrition journal — meal_type GPT utilisait heure UTC serveur au lieu heure locale client (client_hour envoyé depuis VoiceLogSheet)
FIX: couleurs macros — protéines uniformisées #e85d04 (orange) partout : SmartNutritionHero, SmartNutritionWidget, MacroWeekGrid (était #4a90e2 bleu incohérent)
FIX: icônes meal type — emojis 🌅☀️🌙 remplacés par icônes Lucide (Coffee/Sun/Moon/Apple) dans NutritionMealsList
CHORE: nutritionConstants.ts — source de vérité unique MACRO_COLORS + MEAL_TYPE_LABEL/ICON
FIX: VoiceLogSheet — sécurité enregistrement : limite 90s auto-stop, guard double-start (startingRef), guard getUserMedia pending si sheet fermé, visibilitychange coupe si téléphone verrouillé/tab changé, erreurs réseau recognition stoppent proprement, timer rouge 20 dernières secondes
FIX: VoiceLogSheet — fermeture via croix pendant enregistrement crashait l'app : stopAll() sur open=false, openRef guard dans stopRecording + parseTranscript (pas de setState sur composant fermé)
REFACTOR: VoiceLogSheet — toggle click (1 clic = démarre, 1 clic = stop+analyse), suppression onPointerDown/Up qui causaient double-trigger sur mobile
FIX: inputs numériques mobiles — type="number" → type="text" inputMode="decimal/numeric" + onFocus select-all sur VoiceLogSheet, SetRow (reps/poids/RIR), NutritionLogContent, FreeActivitySheet
REFACTOR: VoiceLogSheet — suppression mode locked/verrouiller, push-to-talk pur (idle=jaune, holding=gris+contour jaune, relâcher=analyse)
FIX: VoiceLogSheet + VoiceEntryFab — double onSuccess+onClose supprimé (crash app), router.refresh() différé 350ms pour laisser AnimatePresence exit se terminer
REFACTOR: VoiceLogSheet — réécriture complète, suppression drag/rigole, 3 états bouton distincts (idle/holding/locked), logique pointer fiable, accRef pour transcript sans stale closure
FIX: Splash screen — remplacé composant React (trop tardif) par HTML/CSS pur inline dans root layout, s'affiche avant tout JS, couvre l'écran noir PWA, fade out au load, supprimé sur routes non-/client
FIX: VoiceLogSheet — layout recording refondu : bouton 88×88, rigole 44px propre, waveform compacte 48px, transcript placeholder, couleur lock fill corrigée, conflict translateY/animate supprimé
REFACTOR: VoiceLogSheet — press & hold pour enregistrer, glisser → pour verrouiller, tap pour terminer ; waveform 7 barres ; bouton carré 100×100 Technogym ; SpeechRecognition continuous=true (plus de coupure sur silence)
REFACTOR: BottomNav — nav tabs w-[72px] justify-end/start gap-1 (paires rapprochées) ; action buttons justify-end/start gap-4
FIX: SmartNutritionHero — bouton + hydratation supprimé (redondant avec FAB cluster)

## 2026-05-19 (suite 2)

FIX: MealLogSheet — double bouton mic supprimé (NutritionLogContent renderait un 2ème mic en embedded category)
FIX: MealLogSheet — espace vide disparu (div mic standalone supprimée)
REFACTOR: MealLogSheet — bouton mic jaune (#ffe01e bg/12 + couleur) dans le header
REFACTOR: VoiceEntryFab — FAB cluster jaune : bouton + (jaune plein, ouvre MealLogSheet) + mic (jaune outline), stacked verticalement

## 2026-05-19 (suite)

REFACTOR: AdherenceScoreCard — labels complets (Nutrition, Hydratation, Check-ins), font 7px pour tenir en 4 colonnes
REFACTOR: ClientTopBar — full jaune (#ffe01e), texte #0d0d0d, suppression bande accent
REFACTOR: BottomNav — onglet actif = icône+label jaune uniquement (suppression bande top + fond), action buttons rounded-2xl
FEATURE: CheckinModal — bottom sheet DS v3.0 (sliders jaunes, progress dots, success state +pts), remplace les pages /client/checkin/\*
REFACTOR: ClientHomeShell — wrapper client pour DayChecklist + CheckinModal + router.refresh() sur succès
REFACTOR: BottomNav — action checkin ouvre CheckinModal (morning/evening selon heure)

## 2026-05-20

FEATURE: Voice nutrition logger — SpeechRecognition + GPT-4o mini parse + review flow
FEATURE: VoiceLogSheet — bottom sheet 3 couches (recording/processing/review), waveform, silence auto-stop
FEATURE: /api/client/nutrition/voice-parse — nettoyage transcript + GPT-4o mini + match food_items + rate limit
FEATURE: VoiceEntryFab — bouton micro flottant sur la page nutrition
FEATURE: Bouton micro dans MealLogSheet et NutritionLogContent (embedded)
SCHEMA: nutrition_entries.input_mode — ajout 'voice' à la contrainte CHECK (migration 20260520_voice_input_mode.sql)

## 2026-05-19

FIX: /client page crash prod — extract computePriorityAction to lib/client/smart/priorityAction.ts (was exported from 'use client' component, causing "j is not a function" in Server Component bundle)
REFACTOR: BottomNav v2 — Technogym flat (full-width, no radius, top stripe jaune 4px onglet actif, Barlow Condensed uppercase labels, action buttons squared)
REFACTOR: ClientTopBar v2 — bande accent jaune 3px gauche, titre 15px Barlow Condensed uppercase, subtle jaune box-shadow séparateur

## 2026-05-20

FEATURE: Dashboard v2 — AdherenceScoreCard score 0-100 style Technogym (jaune plein ≥75, no border), PriorityActionCard contextuelle, DayChecklist 5 items, header jour complet
CHORE: Supprimer DashboardHeroSnapshot + DashboardAlertsFeed
FIX: BottomNav — action buttons icon-only (remove label text, fix overflow out of navbar)
FEATURE: Dashboard client redesign — layout full-width vertical, DashboardHeroSnapshot (4 stats), DashboardAlertsFeed (alertes unifiées), SmartWorkoutWidget+SmartNutritionWidget full-width, régularité protéines 7j
FIX: DeloadAlertBanner — return null while loading instead of Skeleton (grey zone on workout page)
FIX: TempoGuideModal — background unified dark, phaseColor as subtle radial glow (no 3-zone color split)
FIX: SmartAgendaTimeline — water time display correct (use actual log ISO, not fake UTC slot suffix)
REFACTOR: SmartAgendaTimeline — label "Journée" → "Smart Agenda"
REFACTOR: BottomNav — action buttons restyled to match DÉMARRER pattern (dark bg #1c1a00, yellow border/text, label)
FIX: Volume hebdo bug — window 7j glissants au lieu de semaine calendaire fixe
REFACTOR: Page Workout — suppr "Programme de la semaine", VolumeCoverageWidget en bas onglet Séance
REFACTOR: SmartWorkoutWidget — titre font-semibold 15px, bouton Démarrer outline jaune discret
FIX: SessionLogger — bouton "J'ai bu" appelle POST /api/client/water (mlPerSip) → hydratation séance loguée en DB et visible partout
SCHEMA: 20260520_client_water_logs.sql — CREATE TABLE client_water_logs (id, client_id, amount_ml, logged_at) + RLS + index
FIX: /api/client/water — await createClient() (missing await caused auth failure in App Router)
FIX: BottomNav — boutons action droite manquaient label+style, tous boutons action rectangulaires (rounded-xl, label intégré dans bouton)
FIX: TempoGuideModal — fond linear-gradient (haut→bas) remplace radial (cercle trop visible en paysage)
FEATURE: POST /api/clients/[clientId]/ai-checkin-feedback — GPT-4o reads 7d check-ins + last session + weight trend → draft coach message (2-4 sentences FR) saved as coach_feedback is_ai_draft=true
FEATURE: POST /api/clients/[clientId]/ai-bilan-analysis — GPT-4o reads completed assessment + previous for delta → structured report (observations/évolutions/alertes/recommandations) saved as metric_annotation ai_analysis
FEATURE: Coach check-ins page — "Générer message coach" IA button + inline preview panel
FEATURE: Coach bilan detail page — "Analyse IA" button in TopBar + inline report panel with 4-section layout
SCHEMA: 20260520_coach_feedback_ai_draft.sql — ADD COLUMN is_ai_draft boolean to coach_feedback
SCHEMA: 20260520_metric_annotations_ai.sql — ADD COLUMN is_ai_draft + extend event_type CHECK to include ai_analysis
FIX: ExerciseSwapSheet — movement_pattern + primary_muscles passés au scoring → alternatives pertinentes par pattern musculaire
FIX: ExerciseSwapSheet — nom complet line-clamp-2, vignette GIF/image, badges colorés, rounded-t-2xl DS v3.0
FIX: ExerciseContextMenu — "Exercice d'échange" → "Changer l'exercice"
FEATURE: POST /api/clients/[clientId]/nutrition-protocols/generate — auto-generates draft protocol from assessment data (calculateMacros + hydration + carb cycling); no coach input required
FEATURE: NutritionProtocolDashboard — "Générer (IA)" button + meta feedback (TDEE, calories, bmrSource) + error display
REFACTOR: TempoGuideModal — ISO+PAUSE rouge #ef4444, fond radial BB→44 (80%→27%), pulse 0.45→1.0 agressif sur phases statiques
FIX: water logging — new POST /api/client/water — single insert client_water_logs, no food_items lookup → sub-200ms
FIX: QuickWaterModal — direct /api/client/water call, optimistic onLogged fires before server response
FIX: SmartNutritionWidget — optimistic waterDelta, hydration bar updates instantly
FIX: SmartNutritionHero — same optimistic pattern, waterDelta accumulates across logs

## 2026-05-19

REFACTOR: BottomNav — "Accueil"→"Dashboard" (SquaresFour), "Programme"→"Work out", logo rotate 180°, labels sur boutons action
FIX: SetRow tempo slot toujours rendu (spacer invisible quand inactif) — colonnes alignées avec headers ExerciseBlock
FIX: handleTempoForExercise — utilise movement_pattern fallback via getDefaultTempo (tempo s'ouvre maintenant pour tous les exercices)
FIX: Bouton Fin header devient jaune quand allDone, long press conservé sinon — bouton fixe bas de page supprimé
FEATURE: ExerciseBlock image cliquable → lightbox plein écran Framer Motion (photo ou GIF à taille naturelle)
FIX: Solo exercises onValidateSet transmet reps/weight/rir confirmés depuis ConfirmModal
FEATURE: BottomNav inline action bar — logo pivote 45°, onglets slidés remplacés par 4 boutons jaunes sans alignement flottant
CHORE: Suppression RadialActionMenu.tsx (remplacé par logique inline dans BottomNav)
FEATURE: Smart Workout redesign — SessionLogger liste scrollable style Motra (remplace vue focalisée 1 exercice)
FEATURE: SetRow — row inline-editable avec swipe droite=valider + swipe gauche=supprimer
FEATURE: SetTypeSelector — sheet EC / Série principale / RC / Dégressive par set
FEATURE: ExerciseBlock — card exercice avec sets inline + Add Set + context menu •••
FEATURE: ExerciseContextMenu — échange, repos, note, tempo, supprimer exercice
FEATURE: SupersetContextMenu — dissocier, repos, supprimer superset
FEATURE: SmartWorkoutHero — titre 22px, suppression navigation date, muscle pills
SCHEMA: add set_type column to client_set_logs (warmup/working/cooldown/dropset)
CHORE: remove SetSwipeCard.tsx and SetEditSheet.tsx (replaced by SetRow inline)

## 2026-05-20

FEATURE: TdeeChart — pure SVG adaptive TDEE trend line with formula baseline (dashed), flux range band, range pills (1M/3M/ALL), insights strip
FEATURE: GET /api/client/nutrition/tdee-history — client-side TDEE history route (reads nutrition_tdee_history, RLS-protected)
REFACTOR: nutrition/page.tsx — replace inline TDEE card with TdeeChart component (self-hides when no history)
FEATURE: MacroWeekGrid — add Consommé/Restant toggle; remaining mode shows uncompleted macro budget per day with inverted color logic
FEATURE: NutritionStreakCard — 5-week calendar heatmap + current/longest streak counter (90-day fetch from nutrition_meals)
FEATURE: streak computed client-side from physiological_date distinct days — no new DB table needed

FEATURE: MacroWeekGrid — replace WeeklyTrendStrip with MacroFactor-style stacked P/F/C blocks per day (7-day grid)
FEATURE: ProtocolRationale — collapsible accordion explaining TDEE → calorie target → protein → fat/carb split with contextual body
REFACTOR: nutrition/page.tsx — trend fetch now includes total_protein_g/carbs_g/fat_g + body weight fetch for g/kg ratio
REFACTOR: nutrition/page.tsx — remove unused CoachProtocolCard import

FIX: RadialActionMenu — buttons now render at z-[60] above nav (z-50), no longer clipped behind nav bar
FIX: timeline/today — filter out meal_type='drinks' so water logs don't appear as meals in SmartAgendaTimeline
FIX: home page meals query — exclude meal_type='drinks' from consumed totals on home page
FIX: SmartNutritionHero date navigation — parse ISO dates as UTC to avoid TZ-offset day-2 shift
FEATURE: SmartNutritionHero — add hydration bar + quick water button directly in the hero card
REFACTOR: nutrition/page.tsx — remove CoachProtocolCard (JOUR ENTRAÎNEMENT), add day type badge to TopBar right slot
REFACTOR: nutrition/page.tsx — move WeeklyTrendStrip above hero (now first section)
FIX: CoachProtocolCard removed from nutrition page layout to avoid data redundancy

FIX: tempo tests — align 7 expected values with code (hypertrophy map uses 1s isometric pause at top, not 0)
FIX: muscle-normalization test — validateMuscleArray silently ignores non-string entries (no throw)
FIX: exercise-resolver test — update error message substring to match actual throw text
FIX: muscle-consistency integration test — invalid slug mixed with valid slug → valid slug kept, no throw

## 2026-05-19

FIX: rename [feedbackId] route segment to [entityType] under /api/client/feedback/ — resolve Next.js conflicting dynamic slug build error
SCHEMA: coach_feedback + coach_feedback_reactions tables, RLS, extend coach_client_notifications CHECK (coach_feedback, client_reaction) — ⚠️ apply 20260519_coach_feedback.sql manually
FEATURE: lib/feedback/types.ts — CoachFeedback, FeedbackReaction, FEEDBACK_EMOJIS shared types
FEATURE: GET/POST /api/clients/[clientId]/feedback — coach feedback list + create with client notification
FEATURE: POST /api/clients/[clientId]/feedback/[feedbackId]/reactions — coach reaction on feedback
FEATURE: GET /api/client/feedback/[entityType]/[entityId] — client reads coach annotations for entity
FEATURE: POST /api/client/feedback/[feedbackId]/reactions — client reacts + notifies coach
FEATURE: components/coach/FeedbackComposer.tsx — bottom sheet composer DS v2.0
FEATURE: app/coach/clients/[clientId]/feedback/page.tsx — coach hub page with entity filter pills
FEATURE: components/client/smart/FeedbackThread.tsx — coach annotations + emoji reactions + reply, DS v3.0
FEATURE: session recap page — FeedbackThread embedded (entity_type=session)
FEATURE: bilans detail page — FeedbackThread embedded (entity_type=bilan)
FEATURE: MorphoAnalysisSection — MessageSquare button + FeedbackComposer per morpho analysis
FEATURE: NotificationsBar — coach_feedback type + entity navigation (session/bilan/checkin/morpho)
FIX: client page normalizeNotificationType — added tdee_updated + coach_feedback
FEATURE: Client profil — refonte accordion (8 sections, une seule ouverte à la fois, Framer Motion AnimatePresence)
FEATURE: Client profil — nouvelle section "Données corporelles" (poids sparkline, composition corporelle, mensurations)
FEATURE: Client profil — hero compact avec avatar 56px + streak pill jaune
FEATURE: Client profil — nouvelle API GET /api/client/body-data (série poids, composition, mensurations depuis bilans)
FIX: Client profil — liste notifications limitée à max-h-64 avec scroll interne
REFACTOR: nutrition UX — merged /client/nutrition/journal into /client/nutrition (single page), journal now redirects 301, NutritionMealsList client component created
FIX: timelineBuilder — meal href changed from /client/nutrition/journal#id to /client/nutrition
FIX: NutritionLogContent + checkin/meals — all journal hrefs updated to /client/nutrition
FIX: BottomNav FAB — no longer overflows nav bar, contained within h-62px nav, animation changed to scale, anchor recalculated (51px from bottom)
FIX: nutrition/page.tsx — same column name bug (calories→total_calories, trend select also fixed)
FIX: NutritionWidget NoTargetSummary — macro labels no longer truncated (PROT/GLUC/LIPI → Protéines/Glucides/Lipides)
FIX: client home — nutrition widget always showed 0 (wrong column names: calories→total_calories, protein_g→total_protein_g, carbs_g→total_carbs_g, fat_g→total_fat_g)
FIX: MealLogSheet — nutrition data now refreshes after save (router.refresh() via onSuccess callback chain)
FIX: BottomNav FAB — oversized button (80px→56px, logo 48→32px, anchor recalculated in RadialActionMenu)
CHORE: adaptive TDEE — final TS check (0 new errors) + 14 Vitest tests PASS
FEATURE: client nutrition page — adaptive TDEE display block (kcal/jour ou "Estimation" si proxy)
FEATURE: NotificationsBar — tdee_updated type with TrendingUp icon, routes to /client/nutrition
FEATURE: Nutrition Studio — adaptive TDEE block in CalculationEngine (TDEE réel, delta vs formule, badge proxy, Appliquer button, historique 5 runs collapsible), useNutritionStudio hook updated with tdeeAdaptive state + applyAdaptiveTdee callback
FEATURE: POST /api/clients/[clientId]/nutrition-protocols/[protocolId]/apply-adaptive-tdee — on-demand coach recalc
FEATURE: GET /api/clients/[clientId]/nutrition-tdee-history — last 5 TDEE history entries
FIX: nutrition-data route returns tdee_adaptive, tdee_adaptive_at, tdee_data_source from active protocol
FEATURE: lib/inngest/functions/adaptive-tdee.ts — weekly cron Monday 06:00 UTC, fan-out per shared protocol, weight-delta TDEE, proportional macro rescale, coach + client notifications
FEATURE: lib/nutrition/adaptiveTdee.ts — pure calcAdaptiveTdee + linearRegression (MacroFactor weight-delta method), 14 Vitest tests PASS
FIX(pwa): deep review — 15 issues fixed: sw.js push icons path corrected (/icon-192.png), removed SSR routes from precache (were caching login redirects), networkFirst API routes now network-only (no cache write — session data privacy), AbortController in networkFirstWithTimeout, notificationclick navigate await fixed, Service-Worker-Allowed + Cache-Control headers added to next.config.js, worker-src CSP directive added, manifest orientation→any + id + categories + split any/maskable icon entries, client layout removed broken startupImage + removed userScalable:false (WCAG 1.4.4), root layout themeColor→#121212 (DS v2.0) + manifest removed from root (coaches should not install client PWA), ServiceWorkerRegistrar deferred reload flag (sw_update_pending) survives active sessions, offline fallback page app/client/offline/page.tsx, CACHE_NAME bumped to v4
FIX: muscle slug "deltoid_posterior" (EN) crashes /client page — added to LEGACY_TO_CANONICAL map + validateMuscleArray now skips unknown slugs instead of throwing + detectMuscleGroups wraps per-exercise errors
FEATURE: SessionLogger swipe-first keyboard-less redesign — SetSwipeCard (Framer Motion drag, useMotionValue/useTransform, haptic, swipe hint, completed compact row), SetEditSheet (bottom sheet steppers reps/poids/RIR, spring motion z-70), SessionLogger solo + superset grid replaced with SwipeCards, SetEditSheet integrated with PR re-detection on confirm, editingSet state, swipeHintDismissed localStorage gate, 0 TypeScript errors
FEATURE: 1RM auto-estimation + deload detection — lib/training/oneRepMax.ts (Epley + Brzycki, RIR adjustment, trend computation), lib/training/deloadDetection.ts (4 signals: RIR inflation, completion drop, 1RM decline, volume stagnation), API routes /api/client/one-rm-trends (top 5 exercises) + /api/client/deload-status (4-week analysis), OneRMWidget (top 5 trends with deltas), DeloadAlertBanner (priority signal with recommendation), integrated in ProgrammeClientPage Séance + Performances tabs, 21 Vitest tests PASS, build successful

## 2026-05-19

FEATURE: Recovery correlation alerts — sommeil/stress/énergie → recommandations séance : computeRecoveryAlerts lib + GET /api/client/recovery-status + RecoveryStatusWidget (DS v3.0) sur home avant nutrition/workout grid, alerte sleep_debt (critical), poor_sleep/high_stress/low_energy (warning), optimal (info), couleurs #ef4444/#f59e0b/#10b981, dismissible per session (localStorage), 10 Vitest tests PASS

## 2026-05-18

FEATURE: Meal favorites + quick-log — save favorite meals + 1-tap quick-log from recents in nutrition composer, client_meal_favorites table with JSONB entries + use_count tracking
FEATURE: SessionLogger — PR detection temps réel + coaching cues inline : badges PR jaunes sur sets (solo + superset), flash notification ⚡ Nouveau record, cues coaching RIR-based (Trop facile / Bonne intensité / Maximum atteint)
FEATURE: Exercise progression chart in Performances tab — interactive SVG line chart with weight trend per exercise, exercise selector pills, stats (max weight, progression delta, session count)

## 2026-05-18

FIX: Hydratation — sync client_water_logs depuis l'API hydration (eau affichait 0ml sur home et nutrition)
FIX: FAB — logo 2× plus grand (80px), déborde au-dessus nav, remonte -8px au tap
FIX: FAB — anchor w-0 h-0, boutons centrés depuis centre exact du FAB (fin du décalage droite)
FIX: Check-in FAB — navigue directement vers morning/evening selon heure (plus d'onboarding en boucle)
FIX: MealLogSheet — hauteur fixe 88vh + min-h-0 sur wrapper, footer sticky bottom-0, contenu visible
FIX: QuickWaterModal — router.refresh() après log eau pour mettre à jour widget home
FIX: FAB boutons — jaunes #ffe01e, icône fill #0d0d0d, transform ancré sur left/top
FIX: FAB animation — logo scale 1.18 + remonte -6px au tap (spring)
FIX: Check-in — guard localStorage "checkin_configured" évite boucle onboarding
FIX: Check-in icône — Moon → ClipboardText (check-in plus explicite)
FEATURE: Home dashboard — grid 2 colonnes (nutrition | workout) visible sans scroll, Timeline en dessous
REFACTOR: SmartNutritionWidget — prop compact (arc réduit, barres mini, wrapper Link vers /client/nutrition)
REFACTOR: SmartWorkoutWidget — prop compact (cache BodyMap, textes réduits), h-full pour stretch égal
FIX: SmartWorkoutWidget — CTA "Démarrer" ouvre /client/programme au lieu de lancer la session directement
FIX: NotificationsBar — coach_note navigue vers /client/profil (était non-cliquable)
FEATURE: FAB RadialActionMenu — arc 120° uniforme, boutons cercles premium, spring motion (stiffness 420/damping 26)
FEATURE: MealLogSheet — bottom sheet inline pour logger un repas sans quitter la page courante
REFACTOR: Extraire NutritionLogContent depuis nutrition/log/page.tsx — réutilisable en embedded mode

## 2026-05-18

FIX(critical): remove loopback HTTP fetches from Server Components — inline direct Supabase queries in app/client/page.tsx, app/client/nutrition/page.tsx, app/client/programme/page.tsx to fix production crash
FIX: nutrition studio — align client intelligence macro breakdown with actual MacroResult shape (`tdee` from root, not breakdown)
FIX: client BottomNav central button — use STRYVR logo SVG in yellow action button instead of text placeholder
FIX: volume-coverage route — remplace exercises_catalog inexistant par getBiomechData (JSON catalog statique)
FIX: workout-alerts route — supprime exercise_name de progression_events select (colonne absente), map exercise_id
FIX: notifications route — merge client_notifications + coach_client_notifications avec field mapping + legacy_id prefix
SCHEMA: migration 20260518 — étend meal_type CHECK constraint avec 'drinks' (requis par route hydration)
FEATURE: Smart Trio refonte app client — Smart Agenda (accueil) + Smart Workout + Smart Nutrition 3 piliers
FEATURE: BottomNav 5 slots + logo STRYVR central + RadialActionMenu 4 actions arc (repas/eau/activité/check-in)
FEATURE: FreeActivitySheet — logger activité libre (running, cycling, etc.) → client_activity_logs
FEATURE: SmartNutritionWidget — demi-cercle calorique MacroFactor style + macros P/L/G + hydratation
FEATURE: SmartWorkoutWidget — résumé séance + BodyMap mini + CTA démarrer
FEATURE: SmartAgendaTimeline — timeline logs journée avec agrégation eau par tranche horaire
FEATURE: NotificationsBar — notifications coach conditionnelles (bilans, programme, notes, rappels)
FEATURE: Smart Nutrition page — héro demi-cercle + alertes IA (4 règles) + protocole coach + restant + trend
FEATURE: Smart Workout page — alertes RIR/stagnation + volume coverage MEV/MAV/MRV + dernières séances
FEATURE: Alertes IA nutrition — protéines en retard, limite glucides, hydratation faible, déjeuner non logué
FEATURE: Alertes IA workout — surmenage RIR, stagnation 3sem, progression positive
SCHEMA: coach_client_notifications table + RLS (bilans, programme, coach_note, system_reminder)
SCHEMA: client_activity_logs table + RLS (running, cycling, swimming, walking, team_sport, other)
REFACTOR: suppression routes /client/agenda + /client/progress → redirects 301 vers /client
REFACTOR: BottomNavPlusMenu remplacé par RadialActionMenu
REFACTOR: AgendaDayView, AgendaWeekView, AgendaEventCard supprimés
CHORE: i18n smart.\* namespace (FR/EN/ES) — 48 nouvelles clés

FEATURE: Portions scaling main user — `coach_clients.hand_length_cm` + helper `getScaledPortionG` (réf 18cm, fallback taille × 0.108 Pheasant)
FEATURE: PORTION_SIZES refactor — 15 portions (8 nouvelles : demi-paume, poing sec, bol mains, pince, tbsp bombée, tranche pain, œuf, verre) + tag `scales: 'hand' | 'fixed'`
FEATURE: Composer couche 4 — multiplicateur ×1 → ×5 sur portions (réutilise même portion N fois) + badge "ajusté à ta main" si override actif
FEATURE: Endpoint GET/PATCH /api/client/profile-scaling (hand_length_cm + height_cm)
FEATURE: Profil client — section "Portions visuelles" : input main + guide mesure + preview palm=Xg dynamique
FEATURE: Bananes plantains — 5 variantes (vert cru, mûr cru, bouilli, frit, mûr frit)
SCHEMA: ALTER coach_clients ADD COLUMN hand_length_cm DECIMAL(4,1) — migration 20260518_portion_scaling_and_plantains.sql

FIX: Landing /stryvr — inscription bêta : service role client utilisé (bypass RLS, route publique sans session)
REFACTOR: Landing /stryvr — DS v3.0 strict : radius sur tous les éléments (cards R16, boutons R12, badges R8, pills), border 1px solid rgba(255,255,255,0.08), gap au lieu de borderRadius:0
REFACTOR: BetaForm — DS v3.0 : toggle grid 2 cols avec gap, inputs rounded-xl avec border focus, CTA rounded-xl avec icon box
FEATURE: Landing /stryvr — mockups app refaits (HomeScreen, SessionScreen, NutritionScreen, AgendaScreen) fidèles à la vraie UI DS v3.0
REFACTOR: Landing /stryvr — toggle bêta "JE VEUX ÊTRE COACHÉ" (plus générique que remise en forme)
FEATURE: Landing /stryvr — HeroPhoneStack 3 phones en perspective (home, nutrition, agenda)
FEATURE: Landing /stryvr — formulaire bêta avec toggle COACH / ATHLÈTE (rôle transmis en DB + email)
FEATURE: Landing /stryvr — email de confirmation bêta branded STRYVR (sendBetaWaitlistEmail) selon rôle
FEATURE: Landing /stryvr — vrai logo SVG STRYVR dans navbar + footer
FEATURE: Landing /stryvr — section "On construit ensemble" (bêta testeur : offre vs demande)
REFACTOR: Landing /stryvr — responsive mobile complet (hero, stats, features, app, safety, CTA, footer)
SCHEMA: beta_waitlist — colonne role TEXT CHECK('coach','athlete') ajoutée (migration 20260517_beta_waitlist_role.sql)
CHORE: PWA icons — remplacé favicon2 par les icônes officielles STRYVR (public/logo/icons) — icon-192.png, icon-512.png, apple-touch-icon.png
CHORE: mailer — logo email remplacé par PNG officiel (logo-stryvr.png) — SVG non supporté par certains clients mail

## 2026-05-18

CHORE: mailer.ts — DS v3.0 tokens appliqués (fond #0d0d0d, surface #161616, accent #ffe01e, texte bouton #0d0d0d, dot jaune, border 0.08)
FIX: invite route — active client with existing password gets login email (reactivation), not set-password email — fixes "deleted PWA" resend scenario
FEATURE: PWA manifest.json — created with STRYVR name + favicon2 icons (dark bg, yellow S) for correct home screen icon on iOS/Android
CHORE: client/layout — wire apple-touch-icon + favicon to favicon2 set (STRYVR yellow)
CHORE: Branding audit — all client-visible touchpoints now use STRYVR (was STRYV) — emails FROM, subjects, body, footer, logo in emails + AssessmentForm

FIX: calcHydrationPlan — formule EFSA daily→session (exercise delta ~700-900ml vs 3000ml+)
REFACTOR: Hydratation intro modal — design rest-timer (backdrop-blur, plein écran, volume centré large, sans card box)
REFACTOR: Hydratation reminder modal — même design rest-timer, bouton "Ignorer" discret aligné sur "Passer le repos"

CHORE: Replace logo.png with SVG logo (Logo STRYVR.svg) across all client-facing pages — login, onboarding, home, acces-suspendu, access/expired, access/invalid

FIX: today-progress + nutrition/page — timestamp T27:59:59 invalide → borne haute correcte nextDay T04:00:00
FIX: NutritionWidget — suppression drop-shadow coloré sur arc over-target (violation DS v3.0)
FIX: NutritionWidget — mode sans cible (targetCal=0) → résumé compact (valeur + strip + 3 tiles macro) au lieu d'arc vide
FIX: MealLogCard macro labels — couleurs Macrofactor P=#e85d04 / G=#2d9a4e / L=#d4a017 (était blue-400/jaune/rouge)
FIX: Protocol days bars (nutrition/page) — couleurs Macrofactor (était bg-blue-400/ffe01e/red-400)
FIX: Composer item list + macro preview + footer totals — couleurs Macrofactor (était blue/amber/red)
FIX: saveMeal() — gestion erreur API explicite (était silencieux sur !res.ok)
FIX: executeDelete() journal — vérifie res.ok avant retrait de la liste locale (évite phantom state)
FIX: QuickWaterModal — CTA bg-blue-500 → bg-[#ffe01e] text-[#0d0d0d] (DS v3.0 CTA token)
FIX: QuickWaterModal — message d'erreur si food_item introuvable (était silencieux)
FIX: QuickWaterModal — selected pill blue → neutre white (DS v3.0)
FIX: journal MealTypeChooser dropdown — bg-[#1e1e1e] → bg-[#161616] (DS v3.0 surface token)
FIX: journal delete modal — bg-[#1a1a1a] → bg-[#161616] (DS v3.0 surface token)

FEATURE: TempoGuideModal — couleur balle prédictive (annonce phase suivante avant le mouvement)
FEATURE: TempoGuideModal — 3 diamants aux points-clés (creux/sommet) — pulse au passage, dim après traversée
FEATURE: TempoGuideModal — circuit strokeWidth 40 + balle r=18 (proportions cohérentes)

FIX: today-progress — agrège nutrition_meals (Composer) + meal_logs (IA), timezone locale, tri jours par position
FIX: MacroStrip journal + labels carte repas — couleurs Macrofactor P=#e85d04 / G=#2d9a4e / L=#d4a017
CHORE: Suppression NutritionRings.tsx zombie

FEATURE: i18n nutrition — ~80 clés ajoutées (catégories alimentaires, sous-types, journal, log/composer, types repas, hydratation)
REFACTOR: app/client/nutrition/page.tsx — tous strings via ct(lang, ...) : today, hydratation, CTA repas, protocole coach
REFACTOR: app/client/nutrition/journal/page.tsx — useClientT() partout — formatDate/formatTime locale-aware, MEAL_TYPE_LABELS → MEAL_TYPE_KEYS, strings delete modal traduits
REFACTOR: app/client/nutrition/log/page.tsx — useClientT() dans NutritionLogInner/QuickSearch/CustomFoodForm — CATEGORY_LABELS/SUBCATEGORY_LABELS construits dynamiquement via t()
FEATURE: i18n client app — traduction complète ES + EN : ~150 clés ajoutées à clientTranslations.ts (login, onboarding, tour, profil, progress, agenda, recap, form, notifications, password reset)
REFACTOR: app/client/login/page.tsx — tous strings via useClientT(), messages d'erreur hash traduits
REFACTOR: app/client/onboarding/page.tsx — WELCOME_SCREENS + password flow + error states via i18n (useClientT)
REFACTOR: components/client/OnboardingTour.tsx — TOUR_STEPS via clés dictionnaire, CTA traduits
REFACTOR: components/client/profile/ProfileForm.tsx — labels champs + options TRAINING_GOALS/FITNESS_LEVELS/GENDERS/SPORT_PRACTICES via useClientT
REFACTOR: components/client/profile/PreferencesForm.tsx — labels via useClientT
REFACTOR: components/client/profile/NotificationsPanel.tsx — labels + TYPE_LABELS + timeAgo via useClientT
REFACTOR: components/client/profile/PasswordResetButton.tsx — tous strings via useClientT
REFACTOR: app/client/page.tsx — gamification (niveau, points, série, record), check-in labels, stats semaine via ct()
REFACTOR: app/client/profil/page.tsx — restrictions, progression, LEVEL_META, ACTION_LABELS via ct()
REFACTOR: app/client/progress/ProgressClientPage.tsx — streak labels, insights, section labels, dates locale-aware via useClientT
REFACTOR: app/client/agenda/page.tsx — section/title/toggles via useClientT
REFACTOR: app/client/programme/recap/[sessionLogId]/page.tsx — bannière, muscles, notes, repos via ct()

## 2026-05-17

FEATURE: NutritionWidget — refonte Macrofactor exacte : arc 270° bleu #3b82f6 (calories), couleurs exactes P=#e85d04 / G=#2d9a4e / L=#d4a017, barres 7px, 52px font-black centre, toggle Consommé/Restant pill blanc, flancs Restant·Cible, glow jaune si dépassement
REFACTOR: nutrition/page + journal — NutritionRings → NutritionWidget (calories jaune / protéines bleu / glucides ambre / lipides rouge), caps arrondis, glow jaune si dépassement, tiles Technogym dessous (valeur 18px font-black + label uppercase coloré)
FEATURE: Nutrition hub — anneaux intégrés (size=240, stroke=16) + hydratation row + CTA loguer
FEATURE: Journal — anneaux intégrés dans "Bilan du jour" (size=220, stroke=14) — barres supprimées

FIX: Journal — swipe-to-delete supprimé sur ComposerMealCard et MealLogCard — seul bouton corbeille reste (+ modale confirmation)
FIX: Journal — MealLogCard (legacy IA) : bouton corbeille ajouté, drag supprimé, layout propre

REFACTOR: SessionLogger hydratation — suppression bouton Droplets header, modal intro au démarrage séance (total ml + conseils), modal rappel 15min immersif centré (style repos) au lieu de bottom sheet
FEATURE: TempoGuideModal — double courbe sinusoïdale continue (style Technogym) remplace triangle — balle avance sans retour arrière, viewBox glisse horizontalement
FIX: TempoGuideModal — layout portrait refait (hauteurs fixes shrink-0), countdown overlay centré sur courbe uniquement, zéro superposition d'éléments
FIX: TempoGuideModal — landscape : contrôles à droite de la courbe (label + timer + barres + counter + Terminer)
FIX: TempoGuideModal — label/couleur phase synchronisés via DOM direct (refs) dans RAF — élimine le délai React setState (~16-32ms) entre changement de phase et affichage label
FIX: TempoGuideModal — portrait layout tronqué : SVG contraint à 44vh max, label/barres/counter toujours visibles
FIX: tempo — ISO=1 sur tous les patterns hypertrophie (HYPERTROPHY_TEMPO_MAP) — contraction isométrique minimale au sommet
FIX: ExerciseCard — presets "Hypertrophie standard" 2-1-3-1 et "Hypertrophie excentrique" 2-1-4-0

FEATURE: ExerciseCard (builder) — toggle "Unilatéral (G + D par série)" pour cocher is_unilateral directement dans le builder coach
FIX: is_unilateral propagé dans save payload (template PATCH/POST + program assign) → program_exercises
SCHEMA: migration 20260517_template_exercises_is_unilateral.sql — ajoute is_unilateral sur coach_program_template_exercises
FIX: page.tsx regex fallback — ajout abduction|adduction pour détection auto exercices unilatéraux
FIX: Nutrition hub — lien "Journal" déplacé dans le header (ClientTopBar right prop), suppression du doublon dans le bloc hero
FIX: Journal — suppression avec confirmation modale obligatoire (bouton rouge "Supprimer" + bouton "Annuler") sur swipe ET bouton corbeille — plus de suppression directe
FIX: QuickWaterModal — utilise /api/client/nutrition/hydration (nouveau) au lieu de /meals — ne crée plus de carte "Collation" dans le journal
FEATURE: API POST /api/client/nutrition/hydration — endpoint dédié eau/boissons : réutilise/crée un seul repas meal_type="drinks" par jour, entries comptées dans totaux, invisible dans la liste du journal
FIX: Journal — filtre meal_type="drinks" dans la liste des repas affichés (hydratation comptée mais pas listée)
FEATURE: Aliment personnalisé — formulaire "Créer un aliment personnalisé" dans Composer couche 1 (nom + macros/100g) → POST /api/client/food-items → sélection immédiate
FEATURE: API POST /api/client/food-items — INSERT food_items avec client_id (ownership), item_key slug stable, source='user'
FEATURE: API DELETE /api/client/food-items?id=xxx — suppression aliment custom avec ownership check
FIX: GET /api/client/food-items — expose source + client_id, filtre ?mine=true pour aliments perso uniquement

FEATURE: TempoGuideModal v2 — circuit triangle fermé (balle continue, zéro snap entre phases)
FEATURE: TempoGuideModal v2 — codes couleurs par phase : CONTRACTER vert / FREINER orange / TENIR rouge / PAUSE rouge (labels font-barlow-condensed)
FEATURE: TempoGuideModal v2 — anticipation isométrique multi-canal : décélération balle + clignotement label orange→rouge + haptic 10ms à 0.8s avant ISO
FEATURE: TempoGuideModal v2 — reps bonus mode relais : tempo continu après reps planifiées, barres bonus grises, onClose enrichi { plannedReps, bonusReps, totalReps }
FEATURE: TempoGuideModal v2 — layout landscape responsive : triangle gauche / contrôles droite, zéro overflow
FEATURE: SessionLogger — sync IA↔tempo : utilise rec.reps de la recommandation au tap ▶ (fallback resolveReps)
FEATURE: SessionLogger — reps bonus alimentent actual_reps du set si bonusReps > 0
FEATURE: SessionLogger — rappels hydratation toutes les 15min : calcul EFSA (poids × 35ml + durée × 8ml), bottom sheet "J'ai bu" / "Ignorer"
FEATURE: session/page.tsx — fetch clientWeight depuis assessment_submissions, passé à SessionLogger

FIX: computePhysiologicalDate — utilisait toISOString() (UTC) au lieu de l'heure locale, causait décalage -1/-2 jours en timezone UTC+2 (Paris) après minuit
REFACTOR: Nutrition hub — refonte architecture : hero calories 48px, macro bars P/G/L/eau compactes dans 1 seul bloc, CTA "+ Ajouter" inline en bas du bloc, protocole coach discret en bas (plus de double CTA journal)

FIX: setRecommendation — belowZone+!rirTooLow branch now maintains weight, targets planned_reps
FIX: setRecommendation — Path A HOLD (rir≤target-2) veto overload, BOOST (rir≥target+3) double incrément
FIX: setRecommendation — delta_vs_last null when targetWeight already reached this session (badge trompeur supprimé)
FIX: session/page.tsx — lastPerformance fetch excludes in-progress session logs (completed_at IS NOT NULL)
FIX: SessionLogger — formatWeight() strips trailing dot/zeros from recommendation weight inputs

## 2026-05-16

REFACTOR: Journal — refonte complète DA Technogym : bilan 36px font-black, macros P bleu / G jaune #ffe01e / L rouge, barres progression, ingrédients auto-expanded, swipe-to-delete gestuel, type repas modifiable inline
FEATURE: Journal — ingrédients visibles dans chaque repas (nom + quantité + kcal), auto-expanded au chargement, collapsible via tap
FEATURE: Journal — swipe-to-delete (-72px seuil) sur repas Composer ET legacy IA, confirmation rouge visuelle
FEATURE: Journal — type repas modifiable inline (dropdown 🌅☀️🌙⚡ → PATCH /api/client/nutrition/meals/[id])
FEATURE: Journal nutrition — cartes repas Composer éditables : photo, titre personnalisé, type repas, contenu détaillé, quantités modifiables, suppression aliment/repas
SCHEMA: nutrition_meals — add title + photo_urls for editable/story-ready meal cards
FEATURE: API nutrition meals/[id] — PATCH metadata/photo + DELETE structured meal with ownership check
FEATURE: API nutrition entries/[id] — PATCH quantity + DELETE entry, recalcul automatique des totaux meal
REFACTOR: Journal nutrition — carte repas DA Technogym : hero photo, kcal massif, macro tiles, détail expandable, actions rapides
FIX: Build — wrap useSearchParams() in Suspense on /client/nutrition/log (prerender error)
FIX: Build — add force-dynamic to /stryvr page (Supabase call during static prerender)

REFACTOR: TempoGuideModal — refonte architecture complète : path pyramide arrondie (arche), balle immobile pendant ISO et PAUSE (seuls CON et ECC la déplacent), trail caché en phases statiques, diamonds à peak et base droite uniquement

FEATURE: Catégorie "Boissons" (drinks) — 7ème catégorie Composer dédiée : Eau & Hydratation, Boissons chaudes, Jus & Smoothies, Laits végétaux, Boissons sportives, Alcools
FEATURE: food_items drinks — 31 boissons (eau plate, gazeuse, café, thé, tisane, jus, laits végétaux, isotonique, bières, vins, spiritueux)
FEATURE: QuickWaterModal — modale hydratation rapide depuis le + : 4 quantités prédéfinies (150/250/330/500ml) + ajustement 50ml, feedback ✓ vert
FEATURE: BottomNavPlusMenu — bouton "Loguer de l'eau" (icône bleue) accès direct QuickWaterModal sans passer par Composer
FEATURE: Nutrition hub — widget hydratation : ml consommés / cible protocole, barre bleue, alerte "encore X.xL à boire" si < 50%
FIX: Composer — bouton "Ajouter au repas" déplacé dans le footer fixe (plus jamais caché sous le scroll) — "Terminer" devient secondaire en couche 4, principal sur les autres couches
FEATURE: Composer — support ?meal_id=xxx : ajouter des aliments à un repas existant (totaux recalculés, ownership vérifié)
FEATURE: Journal — bouton "Ajouter des aliments à ce repas" sur chaque carte repas Composer → ouvre Composer avec meal_id
FIX: API POST /api/client/nutrition/meals — mode append (meal_id fourni) : INSERT entries + UPDATE totaux meal existant, ownership check, pas de points/agenda dupliqués
FEATURE: Nutrition hub — suivi prévu vs réalisé : barres progression par macro (P/G/L), alertes texte manque >20%, agrégation Composer + legacy IA, CTA "Loguer mon premier repas" si rien loggé
FIX: Nutrition hub — aggregation nutrition_meals (Composer, confiance 0.85) + meal_logs (IA, confiance 0.55) via journée physiologique
FIX: Composer — scroll area hauteur dynamique via ResizeObserver sur footer (pb fixe remplacé, plus de contenu caché)
FEATURE: Composer couche 2 — emojis sous-types (24 icônes) à gauche de chaque label subcategory
FEATURE: Composer couche 3 — mini barre P/G/L colorée (bleu/amber/rouge, proportions kcal) sur chaque item
FEATURE: Composer couche 4 — emojis portions visuelles (🤚✊👍🥄☕🙌🍽️) dans chaque bouton portion
FEATURE: food_items — +80 aliments (noix étendus, sodas, chips, Nutella, Oreo, fast-food, alcools, céréales petit-déj)
FEATURE: Composer extras — snacks-sales, snacks-sucres, fast-food (6 sous-types)
REFACTOR: CATEGORY_LABELS extras → "Snacks & Extras", icône 🍿
SCHEMA: Add food_items, nutrition_meals, nutrition_entries tables — Nutrition Composer foundation
FEATURE: Nutrition Composer 4 couches — /client/nutrition/log — catégorie → sous-type → item → quantité (grammes + portions visuelles)
FEATURE: Journal alimentaire unifié — /client/nutrition/journal — DA v3.0, repas structurés + legacy IA, barre macros vs protocole, journée physiologique
FEATURE: GET /api/client/food-items — recherche aliments par catégorie/sous-type/texte
FEATURE: POST /api/client/nutrition/meals — créer repas structuré avec nutrition_entries + totaux + smart_agenda_events + points
FEATURE: GET /api/client/nutrition/meals — liste repas structurés du jour avec entries
FEATURE: lib/nutrition/physiological-date.ts — computePhysiologicalDate() + inferMealType()
FEATURE: lib/nutrition/food-items.ts — types FoodItem, NutritionMeal, EntryDraft, PORTION_SIZES, calcEntryMacros()
FEATURE: scripts/seed-food-items.ts — ~150 aliments base interne (6 catégories × sous-types)
FIX: BottomNavPlusMenu — "Ajouter un repas" → /client/nutrition/log (remplace /client/agenda/meals/new)
FIX: nutrition/page.tsx — lien Journal alimentaire → /client/nutrition/journal
REFACTOR: /client/agenda/meals/new — redirect vers /client/nutrition/log
REFACTOR: /client/checkin/meals — redirect vers /client/nutrition/journal

FIX: SessionLogger superset — ajout colonne Tempo ▶ (#FFB800, PrepTime + TempoGuide identique au solo), grille unifiée REP/KG/RIR/▶/✓
FIX: SessionLogger — grilles solo et superset unifiées : mêmes colonnes, gap-3, px, labels courts — alignement parfait garanti dans les deux modes
FIX: DS v3.0 — suppression tous rounded-[2px] restants dans /client (journal, log, checkin, access, bilans) → rounded-xl
CHORE: CLAUDE.md — ajout section DS v3.0 non-négociable (tokens, hiérarchie radius, règles borders/shadows/gradients)
FIX: SessionLogger — refonte grille colonnes : fusion # + PRÉVU en col unique (1.2fr), 6 colonnes totales gap-3, header et data rows identiques — alignement parfait garanti
FIX: SessionLogger — headers colonnes RÉALISÉ/KG/RIR/✓ alignés text-center, cohérents avec inputs centrés — alignement parfait header↔data
FIX: SessionLogger modal repos — refonte : plein écran, jauge circulaire fine, boutons +30s/-30s, card prochaine série, Barlow Condensed, fermer discret
FIX: SessionLogger — header colonne RIR → "RIR" court (supprime retour à la ligne qui décalait les colonnes)
FIX: Home — nom séance du jour text-[19px] font-semibold (supprime uppercase font-black trop agressif)
FIX: Home — suppression gradient vert #1f8a65 + lueurs shadow sur card séance du jour, border check-in neutralisée
FIX: Home — labels stats + progression en font-barlow-condensed uppercase, dots séances → barres w-5 h-1, nom séance uppercase Barlow Condensed 22px
FIX: SessionLogger — muscles en pills jaunes dans header, sets×reps Barlow Condensed 18px, overlay image éditorial renforcé, micro-checkmark sur set complété, header Barlow Condensed uppercase
FIX: SessionLogger — grille colonnes réalignée (proportions 0.5/1.6/1.6/1.6/1.2/0.7/0.7fr), header Tempo avec icône ▶ #FFB800, titre RIR aligné sur sa colonne
REFACTOR: Client app — radius restauré rounded-xl (inputs/boutons) sur tous les fichiers, aligné sur PrepTimeModal, plus agréable visuellement
REFACTOR: Migrate entire client app (/client) to DS v3.0 Technogym — accent #ffe01e jaune, fond #0d0d0d, surfaces #161616, radius 2px, police Barlow Condensed, texte #0d0d0d sur CTAs jaunes
REFACTOR: Add Barlow + Barlow_Condensed via next/font/google — variables CSS + tokens Tailwind font-barlow / font-barlow-condensed
REFACTOR: BottomNav — fond #0d0d0d, tab actif #ffe01e, bouton + jaune texte #0d0d0d, rounded-[2px]
REFACTOR: ClientTopBar — bord bas border-b, fond #0d0d0d, titres font-barlow-condensed uppercase, rounded-[2px]
REFACTOR: manifest.json — background_color + theme_color #121212 → #0d0d0d
REFACTOR: Migrate SessionLogger, ExerciseSwapSheet, TempoGuideModal, ClientAlternativesSheet to DS v3.0 Technogym — #ffe01e accent, #0d0d0d bg, #161616 surfaces, rounded-[2px], text-[#0d0d0d] on yellow CTAs

REFACTOR: Landing STRYVR — refonte complète DA Technogym (#F5D800 jaune, #0a0a0a fond, grille industrielle gap-1px, typo uppercase 900, mockup training sinusoïde+barres, CTA pleine largeur jaune, footer 4 colonnes)
FIX: deps — bump three 0.157→0.170 (BatchedMesh manquant, peer dep three-mesh-bvh@0.7.8 requiert three@^0.166)
FEATURE: PrepTimeModal — client configure temps préparation par exercice (spinner 3–30s, modal informationnelle, persisté localStorage) — déclenché au premier ▶ de chaque exercice
FEATURE: Tempo preset selector — dropdown coach 5 presets documentés (Hypertrophie standard/excentrique, Force, Endurance, Explosif, Manuel) + convention ECC–PB–CON–PH dans label + validation Manuel via parseTempo
FEATURE: Tempo Guide Modal — guide visuel plein écran style Technogym (SVG sinusoïdal bézier, balle blanche + trail comète, losanges #FFB800 aux transitions, barres reps animées, haptique) — bouton ▶ par set dans SessionLogger
FEATURE: Système tempo d'exécution — coach configure par exercice ("3-1-2-0"), badge auto-calculé par pattern/objectif dans SessionLogger, tempo_used persisté dans les set_logs
SCHEMA: Add tempo (nullable) to coach_program_template_exercises + program_exercises; tempo_used to client_set_logs
FIX: BodyMap — enrichissement catalog côté serveur dans programme/page.tsx (primary_muscle + secondary_muscles lookupés depuis catalog-utils si absents ou génériques en DB)
FIX: catalog-utils — ajout getSecondaryMusclesFromCatalog()
FIX: BodyMap trapèzes — primary_muscles génériques ['dos','biceps'] ignorés, fallback sur primary_muscle anatomique ('traps') pour Shrug et exercices similaires
FIX: ExercisePicker — primaryMuscles peuplé depuis primaryMuscle anatomique précis au lieu de muscles[] générique
FIX: ProgrammeClientPage — "exercicess" double pluriel (ct() retourne déjà "exercices", + 's' redondant supprimé)
FIX: LEGACY_TO_CANONICAL — 40+ slugs catalog ajoutés (fessiers, gluteus_maximus, gluteus_medius, spine_erectors, gastrocnemius, mollets, etc.) — BodyMap vide séances jambes/fessiers/mollets résolu définitivement
FIX: tryNormalizeMuscle — tirets convertis en underscores (ischio-jambiers → ischio_jambiers)
FIX: SessionLogger — suppression ↩ Xkg × N redondant dans colonne PRÉVU (info déjà dans placeholders inputs)
FIX: computeMuscleIntensity — fallback sur primary_muscle singulier si primary_muscles[] vide (BodyMap pré-séance)

## 2026-05-15

FIX: SessionLogger — roundToIncrement floating point (32.199999… → 32.2) via toFixed(10) après multiplication
FIX: SessionLogger — getLastPerfLabel/getExLastPerfLabel match par set_number exact (évite ref croisée entre sets 1/2/3)
FIX: Recap — computeMuscleIntensity normalise les slugs muscles via LEGACY_TO_CANONICAL avant lookup BodyMap (BodyMap vide résolu)

FIX: HowItWorksSection — screens corrigés (01 Onboarding→nutrition, 02 Moteur→stats, 03 Exécuter→agenda), titres alignés au contenu affiché
REFACTOR: "Pour qui" — SVG supprimés, emojis 36px (🔥💪🚀⚡) à la place, cards épurées
REFACTOR: Landing "Comment ça marche" → HowItWorksSection interactive (étapes cliquables, mockup dynamique AnimatePresence, numéro orange actif, bullets expand)
REFACTOR: Landing "Pour qui" — SVG illustratifs 64px par profil (silhouette perte de gras, haltère masse, triangle débutant, étoile athlète) sur fond MUTED 72×72
FIX: Piliers hero — labels non tronqués (Masse / Performance / Nutrition / Santé / Perte de gras)
FEATURE: DS v3.1 Landing Dark — design system complet stryvr/docs/DESIGN_SYSTEM_V3.1_LANDING_DARK.md (tokens, radius, surfaces, glass, orange rules, composants, animations, anti-patterns)
REFACTOR: Landing — fond #111115 (plus noir pur), CARD #1c1c20, MUTED #2a2a2e, navbar rgba(17,17,21,0.90), BetaForm surfaceBg aligné
REFACTOR: Landing hero — piliers visuels emojis 28px (🔥💪⚡🥗❤️) sur cards MUTED centrées (5 cards icône SVG + label, grille 5 colonnes, MUTED+border+R) remplacent chips texte
FIX: BetaForm — borderRadius: 6 sur bloc terminal
FIX: Landing — glass token borderRadius R, barres métriques et 24h borderRadius RS, FactRow droite borderRadius R (Perte de gras/Prise de masse/Recomposition/Performance/Santé chips), copy description moteur physiologique, suppression "double digital"
REFACTOR: Landing stryvr — suppression blur résiduel sur cards, radius complet audit (ComposerDemo R, gap-px overflow:hidden, step numbers RS, safety codes RS, outcome pills RS)
REFACTOR: Landing stryvr — radius R=6px RS=4px sur tous les éléments (grilles gap-px overflow:hidden, badges, boutons, composer, cards standalone, tableaux, step numbers)
REFACTOR: Landing stryvr — shadcn dark zinc canonique (bg #09090b, card #18181b, muted #27272a, foreground #fafafa, muted-foreground #a1a1aa, border rgba(255,255,255,0.10)), orange FF6116 chirurgical (CTA + barre 24h + h1 + span H2 éditoriaux seulement), suppression tous radial glows, suppression fondus, suppression glassmorphisme multiple → navbar seule, surfaces solides CARD partout
REFACTOR: Landing stryvr — token system strict (s0/s1/s2/s3 · t0/t1/t2 · b0/b1 · ac/acB/acH/acBr), élimination complète de tous les vestiges light (#767676 #ABABAB rgba(236...) rgba(0,0,0,...) rgba(255,255,255,0.7+)), SectionH2 simplifié, dark prop supprimée
REFACTOR: Landing stryvr — passage complet en dark (#09090B, glass dark rgba(255,255,255,0.05), radial orange atmosphérique, navbar dark, bouton CTA orange, all borders rgba(255,255,255,...))
FEATURE: Landing — ComposerDemo animé (4 couches auto-cycle, lexique portions paume/poing/pouce, 5 voies de saisie, confidence score)
REFACTOR: Landing — section "Ton double" → "Disponibilité 24h" (visuel barre temporelle coach 1h vs STRYVR 24/7, marqueurs événements, suppression concept flou)
REFACTOR: Landing — transitions atmosphériques (séparateurs dégradés, fondus haut/bas sections dark, replace dividers 1px solid)
FEATURE: Landing footer — enrichi (logo+tagline, liens légaux CGU/confidentialité/contact, réseaux sociaux Instagram/LinkedIn/TikTok, note légale médicale)
REFACTOR: Landing copy — callouts journée + nutrition + séance + CTA final réécrits (ton humain, émotionnel, moins technique)
FIX: Landing navbar — CTA visible mobile (flèche → seule) + label complet sm+
FEATURE: Landing — section "Safety Layer" (TCA / GLP-1 / cycle féminin / surmenage — grille 2×2 glass, code pill, flag orange, note légale)
FEATURE: Landing — section "Comment ça marche" (3 étapes numérotées : onboarding 9 étapes / moteur 24/7 / Smart Agenda, grille label+détail, outcome pill orange)
FEATURE: Landing — section "Pour qui" (4 profils 2×2 : perte de poids / prise de masse / débutant / athlète, grille glass industrielle, ligne exclue)
REFACTOR: BetaForm — refonte terminal dark (bloc #0A0A0A, indicateur orange animé, labels contextuels, fontSize 20 light, bouton soudé, success minimaliste)
FEATURE: Landing — section preuve sociale (4 stats réelles JMIR/PMC/Flurry/Glofox, plaques glass DS v3.0, ligne contexte)
REFACTOR: BetaForm — refonte totale (bloc unifié, labels uppercase, séparateur interne, bouton soudé, erreur inline, success carré)
FIX: Landing + AppMockup — alignement produit réel STRYVR (Smart Agenda, RPE pas RIR, weight_trend_kg moteur, velocity_status, wellbeing_score_7j, mésocycle, onboarding 9 étapes, COACH_FACTS fidèles aux flux fonctionnels)
FEATURE: AppMockup — NutritionScreen (arc kcal semi-circulaire, macros barres P/G/L, liste repas du jour)
FEATURE: Landing — section Nutrition dédiée entre Journée et Séance, AppMockup screen nutrition
FIX: AppMockup — icône tab data → utensils (nutrition), tab vitals → bolt (séance)
FIX: BetaForm — inputs h-56 + fontSize 15 + padding 18px (plus confortables), bouton aligné h-56
FIX: AppMockup — TabBar active corrigée (Agenda→home, SessionLogger→vitals, Stats→charts)
FIX: BetaForm — inputs empilés verticalement pleine largeur (suppression sm:flex-row trop étroit)
FIX: Landing — hero grid mobile (inline style écrasait Tailwind breakpoints), navbar CTA toujours hidden, stats bar non-responsive
FIX: Landing — SVG noise filter ID unique via useId() (évite doublons StrictMode)
FIX: Landing — borderRadius '50%' sur dots (pas 2px hybride), progress bars radius 0, glow divs sans borderRadius
FIX: Landing — viewport once:true manquant sur CTA final, SectionLabel/H2 props dark dead supprimées, glassDark dead code supprimé
FIX: BetaForm — rounded-full supprimé sur icône success, font-bold → fontWeight:500
CHORE: DS v3.2 — radius doctrine radicale (0px défaut), typo weight 300-400, Optical & Material System (section 14), card radius 0px
REFACTOR: AppMockup — radius 0 sur tous les écrans, cards glass rgba, typo weight 300-500, densité améliorée, muscle strips, sparkline propre
REFACTOR: Landing STRYVR — refonte atmosphérique glass system — fond gradient+noise, backdrop-blur 28px, radius 8px, typo weight 300-400, borders rgba perceptives
FEATURE: Refonte landing STRYVR — 6 sections scrollytelling + hero 3 iPhones stack perspective DS v3.0
FEATURE: AppMockup — SessionLoggerScreen + StatsScreen nouveaux écrans + HeroPhoneStack composant
FEATURE: BetaLandingClient — sections "Ta journée pilotée", "Tu ne penses plus", "Ton double te connaît", stats countUp, progression bars, CTA dark
FIX: Align stryvr landing with DS v3.0 — bg #F3F3F3, stats #EBEBEB, #767676 text-secondary, orange badge/focus, features border 0.5px, tabular-nums, metric-large 40px
FIX: BetaForm — input bg #EBEBEB, border rgba(0,0,0,0.06), button height 56px, focus border #FF6116 (plus vert)
FIX: AppMockup — glow gradient décoratif supprimé, tab bar DS v3.0 ajoutée (rectangle radius-sm noir), frame #0A0A0A
CHORE: Add DS v3.0 native app design system (Urbanist, #FF6116, light+dark, arc SVG, tab pill)
CHORE: Update design-system skill to reference DS v3.0 tokens and separate coach/client systems
CHORE: Update client-app-ux skill with DS v3.0 visual tokens
CHORE: Update ui-ux-reviewer agent with DS v3.0 compliance rules
CHORE: Update stryvr/ui-system.md palette from placeholder blue to #FF6116 orange + light/dark tokens
CHORE: Update ui-design-system.md rules header to clarify DS v2.0 scope (coach web only)

## 2026-05-14

FEATURE: Add STRYVR beta landing page at /stryvr — light mode, Urbanist font, iPhone mockup, Framer Motion animations
FEATURE: Add beta_waitlist Supabase table with RLS + server actions (joinWaitlist, getBetaCount)

## 2026-05-09

FIX(nutrition-studio): manual data global instead of per-bilan — switching bilans now shows correct fallback data. Added assessment_submission_id to coach_client_nutrition_manual_data. PATCH saves data tied to selected bilan; GET fetches per-submission first, then global fallback. Prevents May 6 manual entries (BMR 1750, steps 9000) overwriting March 20 bilan (BMR 1705, steps 6000)
FIX(nutrition-studio): UPSERT constraint error — added UNIQUE(client_id, coach_id) to coach_client_nutrition_manual_data table. PATCH route now uses onConflict: "client_id,coach_id" instead of "client_id". Fixes "Enregistrer" doing nothing (500 error with PostgreSQL 42P10 no matching constraint)
FIX(nutrition-studio): BMR calculator — use clientData not biometricsConfig for Mifflin/Katch math. biometricsConfig is hook-local state; clientData has real bilan values. This fixes "Calculer" silently failing when biometricsConfig empty
FIX(nutrition-studio): calculator function signatures — calculateBMRMifflin(weight_kg, height_cm, age_years, gender) and calculateBMRKatchMcArdle(weight_kg, body_fat_pct) are positional params, not objects. Katch requires body_fat_pct (not lean_mass lookup)
FIX(nutrition-studio): integrate dataSource tracking for intelligent fallback — dataSource state now flows from API → hook → ClientIntelligencePanel. MissingDataAlerts distinguishes volatile fields (bmr, weight, bf, steps, lean_mass, muscle_mass) needing alerts when from fallback vs stable fields (height) that fallback silently. Alert labels now show reason: "absent bilan sélectionné", "du bilan antérieur (à vérifier)", "jamais ajoutée"
REFACTOR(nutrition-studio): replace CompleteMissingDataModal with inline MissingDataPanel — bottom-aligned panel in Col 1 for cleaner UX. Click alert → inline panel opens → enter/calculate → Enregistrer saves + refetches data + macros recalc
FIX(nutrition-studio): z-index collision CompleteMissingDataModal (z-50) vs ParameterAdjustmentPanel (z-50) — raised modal to z-[70]
FIX(nutrition-studio): data not persisting after Apply in modal — added explicit refetch in handleMissingDataSave after PATCH completes, updates biometricsConfig with fresh values
FIX(nutrition-studio): height missing alert absent from MissingDataAlerts — added height_cm check to component
FIX(nutrition-studio): no historical fallback for volatile data — modified API route to fetch ALL submissions (target + older), enabled proper fallback population with dataSource tracking
FEAT(nutrition): make missing data alerts clickable — opens modal to calculate or manually enter BMR, weight, height, body_fat_pct, daily_steps directly from Col 1. No need to navigate "Ajuster les paramètres". Applies + persists instantly, recalcs macros automatically
FIX(nutrition): destructure completing prop in CompleteMissingDataModal — resolves ReferenceError at runtime
SCHEMA: add coach_client_nutrition_manual_data table — stores manually entered/calculated nutrition metrics with priority over bilan data (weight, height, body_fat, BMR, etc.). PATCH /api/clients/[clientId]/nutrition-data now upserts into this table
FIX(body-map): check all primary muscles when filtering secondaries — prevents double-counting secondary muscles that map to any primary muscle (fixes multi-primary exercises like Dips showing incomplete BodyMap)
FIX(nutrition): add missing CheckCircle2 import in CalculationEngine — resolves blank nutrition protocol page (ReferenceError: CheckCircle2 is not defined)
FEAT(hydration): add seed script hydrate-normalized-muscles.ts — maps EN→FR from exercise-catalog.json, updates 379 exercises with primary_muscles_normalized + secondary_muscles_normalized (86 skipped due to missing EN→FR mappings)
FIX(api): validate primary_muscles non-empty on template exercise POST — rejects exercises without muscles, prevents hydrated data corruption
FIX(body-map): use normalized primary_muscles activation (1.0) instead of legacy primary_activation coefficient — BodyMap now displays all primary muscles at full intensity (fixes bug where multi-primary exercises like Dips showed only secondary muscles)
FIX(client-app): export computeMuscleIntensity from muscleDetection — function was imported but missing from exports, caused crash on Programme page. Now computes intensity map (0-1 per muscle group) from exercise volume + activation coefficients
FIX(templates): validate movement_pattern before inserting — replaces invalid patterns (2, E33, B38, etc.) with null to prevent check constraint violations in save-as-template and assign operations
FIX(session-logger): prevent duplicate session logs on completion — initDraft now returns early on 404 (completed_at exists), removed fallback POST that created second incomplete log
FIX(templates): update sessions/exercises in-place instead of delete/recreate — prevents data loss when editing template + preserves order
FEATURE(nutrition): auto-save parameters with debounce 500ms + visual feedback "Enregistré" — changes persist instantly, no manual Save button needed
FEATURE(nutrition): quick-add height widget in adjustment panel if missing — non-blocking, can add anytime (height non-critical, immutable after first bilan)
FEATURE(nutrition): missing data alerts in Col 1 (BMR absent, poids manquant, MG% absent, pas quotidiens inconnus) — warnings only, never blocking calculation
REFACTOR(ParameterAdjustmentPanel): save button closes panel on success + shows green checkmark state — Fermer button for manual close
REFACTOR(nutrition): height input removed from biometrics section if already filled via quick-add (idempotent sync)
REFACTOR(dock): remove Nutrition stub from Studio navigation — only Programmes + Bilans remain (Nutrition returns 404 in Studio context)

## 2026-05-08

SCHEMA: add primary_muscles_normalized + secondary_muscles_normalized columns to all exercise tables — consolidates 5 muscle data sources into single DB authoritative source (migration 20260508_exercise_normalized_muscles.sql, manual application required in Supabase Dashboard)
FEAT(muscle-normalization): add canonical muscle layer with legacy EN→FR mapping + strict resolver (no regex fallback) — 65 canonical muscles, full backward compat, validation at API boundary
FEAT(scoring): complete MUSCLE_TO_VOLUME_GROUP mapping for all canonical muscles — volume heatmap now covers all muscles consistently
FEAT(api): add Zod validation schemas for normalized muscle arrays — rejects invalid slugs at API routes (POST/PATCH exercise endpoints)
REFACTOR(muscleDetection): eliminate regex fallback, read strictly from DB normalized columns — same exercise shows identical muscles across BodyMap, volume charts, scoring alerts
TEST(integration): add muscle consistency tests — verify all components read from same authoritative source
DOCS: add MUSCLE_DATA_CONSOLIDATION.md architecture doc — explains single-source-of-truth design, migration path, next steps
SCHEMA: add is_compound + biomech columns to coach_program_template_exercises — migration 20260508_template_exercises_is_compound.sql aligns template schema with program_exercises enrichment
FIX(template-clone): add is_compound field to exercise inserts in save-as-template + assign — survives template cloning intact
FIX(matching): remove hard stops on frequency ecart + level mismatch — soft warnings only, coaches can assign any template to any client (Phase 3 substitution remains only hard stop)
FIX(equipment-validation): change phase1EquipmentFilter from hard stop to soft warning when equipment_category is null — coaches can assign templates despite unconfigured category
FEATURE(equipment-inference): add inferEquipmentCategory() function — maps individual equipment items (barbell+dumbbell→home_full, dumbbells→home_dumbbells, machines→commercial_gym, etc.) + assign page infers category from equipment array if explicit category missing

## 2026-05-07

FEATURE(nutrition): Phase 2b — Extended ParameterAdjustmentPanel with biometrics fields (weight, height, BF%, LBM, muscle mass, visceral fat) + BMR calculator modal with source badges (measured/estimated/calculated)
FEATURE(calculators): new lib/nutrition/calculators.ts — BMR formulas (Katch-McArdle + Mifflin-St Jeor) + LBM + muscle mass calculations + BMRSource type (measured|estimated|calculated) + describeBMRFormula utility
FEATURE(useNutritionStudio): add biometricsConfig state + setBiometricsConfig setter + initialization from clientData.bmr_kcal_measured (infers source as measured if exists, else estimated)
REFACTOR(ClientIntelligencePanel): wire biometricsConfig + onBiometricsChange props — receives updated biometrics from ParameterAdjustmentPanel, passes through callback to useNutritionStudio setter
REFACTOR(NutritionStudio): pass biometricsConfig + setBiometricsConfig to ClientIntelligencePanel for complete component hierarchy wiring (NutritionStudio → ClientIntelligencePanel → ParameterAdjustmentPanel → recalc on biometrics change)
FEATURE(ParameterAdjustmentPanel): BMR calculator modal (Framer Motion) with formula toggle, pre-fill logic (weights available data), result display, apply button → persists to state + recalcs
FIX(volume-targets): add petit_fessier mapping to fessiers_moyen — petit fessier now included in weekly volume aggregation
FEATURE(nutrition): Phase 2a — Bilan selector dropdown + missing data alerts + extended API query params
FEATURE(nutrition-data): add ?submissionId optional query param — coach selects which assessment (default=latest) without page reload
FEATURE(nutrition-data): return allSubmissions array (id/date/status chronological) + selectedSubmissionId in response
SCHEMA(nutrition-data): API extended to support bilan filtering at data fetch layer
FEATURE(MissingDataAlerts): new component — badge count + max 3 alerts (critical→warning), field/category/severity/label, [Saisir]/[Calculer] buttons
FEATURE(useNutritionStudio): add selectedSubmissionId + allSubmissions state, memoized missingDataAlerts (checks weight/BF%/BMR/height/frequency/steps)
FEATURE(CalculationEngine): bilan selector dropdown (latest button → click → chronological list with checkmark), alerts section below TDEE
FIX(nutrition-data): type annotation on submissions array — resolves TS7034 implicit any[] error
REFACTOR(NutritionStudio): prop wire-up (submissions/selectedSubmissionId/onSubmissionChange/missingDataAlerts)
FIX(nutrition): include in_progress bilans in data fetch — reopened assessments (status: in_progress) now populate nutrition-data instead of appearing empty
FIX(bilan): reopen completed assessment — load previous responses pre-filled in form (coach reopens → client sees data to correct, not blank form)
FIX(nutrition): date_of_birth sync — syncProfileFromResponses cherchait field_key 'date_naissance'|'date_of_birth', mais modules.ts définit 'birth_date' — âge était toujours null en nutrition-data — ajout 'birth_date' au mapping
FIX(performance-coach): inferMuscleGroup — 465/465 exercices catalogue couverts (était 109/465 en "Autre") — ajout Jambes/Abdos/Épaules/Dos/Pectoraux/Avant-bras patterns manquants
FIX(performance-coach): RPE vide — API cherchait s.rpe inexistant, corrigé en rir_actual → RPE = 10 - RIR
FIX(performance-coach): barres volume grises — METRIC_COLOR.volume était #141414 (invisible sur #181818), remplacé par couleurs DS (#1f8a65 / #6366f1 / #f59e0b)
FIX(performance-coach): tooltip "Invalid Date" sur BarChart groupes musculaires — BarTooltipContent séparé sans formatDate
FIX(performance-coach): timeline clé date — log.logged_at.split('T')[0] pour regrouper par jour (était le timestamp complet)
FEATURE(performances): filtre période 7j/30j/90j/Tout — KPIs + heatmap + label section synchronisés sur la période sélectionnée
FIX(inngest): migration signatures v4 complète — triggers dans 1er arg pour les 5 fonctions (checkin-streak-evaluate, checkin-streak-expire, checkin-reminder-send, meal-analyze, points-level-update) — build Vercel débloqué
FIX(recap): stat "Durée" affichait le repos moyen (avgRestSec) au lieu de duration_min — durée séance réelle maintenant affichée, repos moyen en sous-titre

FIX(bilan): move measurement_method before body_fat_pct in biometrics block — fields now appear after method selection
FIX(bilan): convert measurement_method from single_choice to multiple_choice — allows selecting both balance + plis cutanés simultaneously
FIX(bilan): update visceral_fat/body_water/metabolic_age/bmr conditions from eq to includes — compatible with multiple_choice array
FIX(bilan): update skinfold fields conditions from eq to includes — plis cutanés fields visible when method includes 'Plis cutanés'

FIX: Add react-is as explicit dependency — recharts peer dep missing on Vercel build
FIX: Migrate all 5 Inngest createFunction signatures to v4 format (triggers in second arg)

## 2026-05-06

FEATURE: Smart Agenda Phase 1 — vue jour/semaine chronologique client (/client/agenda)
FEATURE: Page ajout repas — saisie texte, vocal (Web Speech API), upload photos (bucket meal-photos)
FEATURE: Inngest job meal/analyze.requested — GPT-4o Vision → macros estimées async
FEATURE: smart_agenda_events — table centrale agrégeant repas/check-ins/séances/bilans
FEATURE: coach_agenda_annotations — table Phase 2 (créée, usage Phase 2)
FEATURE: BottomNav bouton + avec slide-up menu (Ajouter un repas / Check-in)
FEATURE: Nutrition page — barre progression macros du jour (consommé vs protocole)
FEATURE: Home page — raccourci Smart Agenda
SCHEMA: smart_agenda_events + coach_agenda_annotations tables + RLS (20260506_smart_agenda.sql)
SCHEMA: meal_logs — colonnes transcript, photo_urls TEXT[], ai_status ajoutées

## 2026-05-05

CHORE: Suppression complète du système Genesis/IPT — composants, pages, routes API, types, lib (74 600 lignes supprimées)
CHORE: Suppression docs obsolètes, plans de sessions, données de test RGPD (CSV/PDF/DOCX)
CHORE: Suppression lib/morphology/ (doublon de lib/morpho/ avec refs n8n), hooks/useIPTSession, types/genesis.ts, types/02_types.ts
CHORE: Suppression routes API mortes — api/kanban/, api/lab/, api/calculator-results/, api/checkout/, api/auth/, api/stripe/ipt+gplus+omni
CHORE: Suppression app/lib/genesis/ (scoring engine IPT), components/genesis/, components/ipt/, components/canvas/IPTVisualization, sections marketing Genesis
FIX: Bug morpho/photos/route.ts — client_id: photo.id corrigé en client_id: photo.client_id
CHORE: Unification env vars — OPEN_AI_API_KEY → OPENAI_API_KEY, NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL
CHORE: Nettoyage refs n8n dans cron/payment-reminders (commentaire obsolète)

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
