// Logique pure — pas de 'use client', utilisable dans les Server Components
// Catalogue importé pour fallback lookup par nom d'exercice
import catalogJson from '@/data/exercise-catalog.json'

interface CatalogEntry { name: string; muscles?: string[]; primaryMuscle?: string; primaryActivation?: number; secondaryMuscles?: string[]; secondaryActivations?: number[]; stabilizers?: string[] }
const catalog = catalogJson as CatalogEntry[]

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
const catalogBySlug = new Map<string, CatalogEntry>(catalog.map(e => [toSlug(e.name), e]))

// Jaccard similarity fuzzy match: intersection(words) / union(words)
// Évite les faux positifs du "nombre de mots" pur — "Développé couché" ne matche plus "Développé nuque"
function fuzzyFindInCatalog(name: string, threshold = 0.4): CatalogEntry | null {
  const slug = toSlug(name)
  const words = new Set(slug.split('-').filter(w => w.length > 2))
  if (words.size === 0) return null
  let bestScore = 0
  let bestEntry: CatalogEntry | null = null
  for (const entry of catalog) {
    const catSlug = toSlug(entry.name)
    const catWords = new Set(catSlug.split('-').filter(w => w.length > 2))
    const wordsArr = Array.from(words)
    const catWordsArr = Array.from(catWords)
    const intersection = wordsArr.filter(w => catWords.has(w)).length
    const unionSet = new Set(wordsArr.concat(catWordsArr))
    const union = unionSet.size
    const score = intersection / union
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }
  return bestScore >= threshold ? bestEntry : null
}

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'back_upper'
  | 'back_lower'
  | 'traps'

export interface MuscleActivation {
  primary: Set<MuscleGroup>
  secondary: Set<MuscleGroup>
  stabilizers: Set<MuscleGroup>
}

// Mapping depuis les slugs du catalogue (muscles[] = FR court, primaryMuscle/secondaryMuscles = EN anatomique)
// vers les MuscleGroup du BodyMap.
const CATALOG_SLUG_MAP: Record<string, MuscleGroup> = {
  // ─── Slugs FR courts (champ muscles[]) ───────────────────────────────────
  'dos':                     'back_upper',
  'pectoraux':               'chest',
  'epaules':                 'shoulders',
  'biceps':                  'biceps',
  'triceps':                 'triceps',
  'abdos':                   'abs',
  'quadriceps':              'quads',
  'ischio-jambiers':         'hamstrings',
  'fessiers':                'glutes',
  'mollets':                 'calves',
  // ─── Slugs FR anatomiques (intelligence engine) ──────────────────────────
  'grand_dorsal':            'back_upper',
  'dos_large':               'back_upper',
  'trapeze_superieur':       'traps',
  'trapezes':                'traps',
  'trapeze_moyen':           'traps',
  'lombaires':               'back_lower',
  'erecteurs_spinaux':       'back_lower',
  'pectoraux_haut':          'chest',
  'pectoraux_bas':           'chest',
  'epaules_ant':             'shoulders',
  'epaules_lat':             'shoulders',
  'epaules_post':            'shoulders',
  'deltoide_anterieur':      'shoulders',
  'deltoide_lateral':        'shoulders',
  'deltoide_posterieur':     'shoulders',
  'rhomboides':              'back_upper',
  'ischio':                  'hamstrings',
  'ischio_jambiers':         'hamstrings',
  'fessiers_grand':          'glutes',
  'fessiers_moyen':          'glutes',
  'abdominaux':              'abs',
  // ─── Slugs EN anatomiques (primaryMuscle / secondaryMuscles[]) ───────────
  'lats':                    'back_upper',
  'upper_back':              'back_upper',
  'rhomboids':               'back_upper',
  'teres_major':             'back_upper',
  'teres_minor':             'back_upper',
  'infraspinatus':           'back_upper',
  'spine_erectors':          'back_lower',
  'erector_spinae':          'back_lower',
  'lower_back':              'back_lower',
  'pectoralis_major':        'chest',
  'pectoralis_major_upper':  'chest',
  'pectoralis_major_lower':  'chest',
  'pec_minor':               'chest',
  'anterior_deltoid':        'shoulders',
  'medial_deltoid':          'shoulders',
  'posterior_deltoid':       'shoulders',
  'deltoid':                 'shoulders',
  'rotator_cuff':            'shoulders',
  'subscapularis':           'shoulders',
  'biceps_brachii':          'biceps',
  'brachialis':              'biceps',
  'brachioradialis':         'forearms',
  'triceps_brachii':         'triceps',
  'triceps_brachii_lateral': 'triceps',
  'triceps_brachii_long':    'triceps',
  'triceps_brachii_medial':  'triceps',
  'rectus_abdominis':        'abs',
  'obliques':                'abs',
  'transverse_abdominis':    'abs',
  'lower_abs':               'abs',
  'core':                    'abs',
  'core_global':             'abs',
  'rectus_femoris':          'quads',
  'vastus_lateralis':        'quads',
  'vastus_medialis':         'quads',
  'hamstrings':              'hamstrings',
  'biceps_femoris':          'hamstrings',
  'semimembranosus':         'hamstrings',
  'semitendinosus':          'hamstrings',
  'gluteus_maximus':         'glutes',
  'gluteus_medius':          'glutes',
  'glutes':                  'glutes',
  'gastrocnemius':           'calves',
  'soleus':                  'calves',
  'traps':                   'traps',
  'upper_traps':             'traps',
  'middle_traps':            'traps',
  'trapezius':               'traps',
  'levator_scapulae':        'traps',
  // ─── Épaules — variantes ─────────────────────────────────────────────────
  'rear_delts':              'shoulders',
  'deltoids':                'shoulders',
  'shoulders':               'shoulders',
  'supraspinatus':           'shoulders',
  'external_rotators':       'shoulders',
  // ─── Pectoraux — variantes ───────────────────────────────────────────────
  'pec_major':               'chest',
  'upper_chest':             'chest',
  // ─── Dos — variantes ─────────────────────────────────────────────────────
  'scapula':                 'back_upper',
  'quadratus_lumborum':      'back_lower',
  // ─── Jambes — variantes ──────────────────────────────────────────────────
  'quads':                   'quads',
  'adductors':               'quads',
  'hip_flexors':             'quads',
  'calves':                  'calves',
  // ─── Divers ──────────────────────────────────────────────────────────────
  'anconeus':                'triceps',
  'forearms':                'forearms',
  // ─── Avant-bras ──────────────────────────────────────────────────────────────
  'avant_bras':              'forearms',
  'extensor_carpi_radialis': 'forearms',
  'extensor_carpi_ulnaris':  'forearms',
  'flexor_carpi_radialis':   'forearms',
  'flexor_carpi_ulnaris':    'forearms',
  'palmaris_longus':         'forearms',
  'pronator_teres':          'forearms',
  'supinator':               'forearms',
  'wrist_flexors':           'forearms',
  'wrist_extensors':         'forearms',
  'extensor_digitorum':      'forearms',
  'flexor_digitorum':        'forearms',
  'hip_abductors':           'glutes',
  'hip_adductors':           'quads',
  'serratus_anterior':       'chest',
  'coracobrachialis':        'biceps',
}

// Fallback regex sur le nom — utilisé uniquement si primary_muscles est vide ET le slug ne mappe pas
const MUSCLE_KEYWORDS: Record<MuscleGroup, RegExp> = {
  chest:      /pectoral|pec deck|développé couché|développé incliné|développé haltères|dips pecto|écarté|chest fly|flye|chest press/i,
  shoulders:  /militaire|élévation latérale|élévation frontale|développé épaule|shoulder press|delt|développé nuque|oiseau|reverse fly|face pull/i,
  biceps:     /\bcurl\b|bicep|marteau|hammer curl/i,
  triceps:    /tricep|\bextension\b.*(tricep|poulie haute|câble|barre)|skull|close.grip/i,
  forearms:   /avant.bras|wrist curl|wrist extension|brachioradial|enroulement poignet|extension poignet|pronation|supination|finger curl/i,
  abs:        /crunch|planche|dead bug|abdomi|\bcore\b|relevé de jambes|dragon flag/i,
  quads:      /squat|leg press|leg extension|presse à cuisses|hack squat|fente avant|split squat/i,
  hamstrings: /leg curl|ischio|roumain|jambes tendues|nordic/i,
  glutes:     /hip thrust|fessier|glute bridge|kickback/i,
  calves:     /mollet|\bcalf\b|calf raise/i,
  back_upper: /\btirage\b|\browings?\b|\btractions?\b|lat pulldown|seated row|chest supported row/i,
  back_lower: /extension lombaire|hyperextension|good morning/i,
  traps:      /trapèze|\bshrug\b|haussement d'épaule/i,
}

// Exercice avec métadonnées DB (optionnelles)
export interface ExerciseInput {
  name: string
  sets?: number
  primary_muscles?: string[]
  secondary_muscles?: string[]
  stabilizers?: string[]
  // Champs biomech du catalogue enrichi
  primary_muscle?: string | null
  primary_activation?: number | null
  secondary_muscles_detail?: string[]
  secondary_activations?: number[]
}

/**
 * Calcule un ratio d'activation 0–1 par groupe musculaire sur l'ensemble d'une séance.
 * Utilise sets × activation (comme le scoring engine) quand les données biomech sont disponibles,
 * sinon fallback sur le système primary/secondary.
 * Retourne Map<MuscleGroup, number> où 1.0 = groupe le plus sollicité de la séance.
 */
export function computeMuscleIntensity(exercises: ExerciseInput[]): Map<MuscleGroup, number> {
  const volumeByGroup = new Map<MuscleGroup, number>()

  for (const ex of exercises) {
    const sets = ex.sets ?? 3

    // ── Chemin biomech (activation précise) ──────────────────────────────────
    if (ex.primary_muscle && ex.primary_activation != null) {
      const pg = resolveSlug(ex.primary_muscle)
      if (pg) {
        volumeByGroup.set(pg, (volumeByGroup.get(pg) ?? 0) + sets * ex.primary_activation)
      }
      const secMuscles = ex.secondary_muscles_detail ?? []
      const secActivations = ex.secondary_activations ?? []
      secMuscles.forEach((m, i) => {
        const g = resolveSlug(m)
        const act = secActivations[i] ?? 0.2
        if (g) volumeByGroup.set(g, (volumeByGroup.get(g) ?? 0) + sets * act)
      })
      continue
    }

    // ── Fallback : tenter lookup catalogue par nom pour données biomech complètes ──
    // Seuil 0.30 (plus permissif que fuzzyFindInCatalog 0.40) pour capter singulier/pluriel et variantes mineures
    const catalogEntry = catalogBySlug.get(toSlug(ex.name)) ?? fuzzyFindInCatalog(ex.name, 0.30)
    if (catalogEntry?.primaryMuscle && catalogEntry?.primaryActivation != null) {
      const pg = resolveSlug(catalogEntry.primaryMuscle)
      if (pg) volumeByGroup.set(pg, (volumeByGroup.get(pg) ?? 0) + sets * catalogEntry.primaryActivation)
      const secM = catalogEntry.secondaryMuscles ?? []
      const secA = catalogEntry.secondaryActivations ?? []
      secM.forEach((m, i) => {
        const g = resolveSlug(m)
        const act = (secA[i] as number | undefined) ?? 0.2
        if (g) volumeByGroup.set(g, (volumeByGroup.get(g) ?? 0) + sets * act)
      })
      continue
    }
    // ── Fallback primaire/secondaire depuis slugs DB ──────────────────────────
    for (const m of (ex.primary_muscles ?? [])) {
      const g = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
      if (g) volumeByGroup.set(g, (volumeByGroup.get(g) ?? 0) + sets * 0.85)
    }
    for (const m of (ex.secondary_muscles ?? [])) {
      const g = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
      if (g) volumeByGroup.set(g, (volumeByGroup.get(g) ?? 0) + sets * 0.3)
    }
  }

  if (volumeByGroup.size === 0) return volumeByGroup

  // Normalise 0–1 par rapport au groupe le plus sollicité
  let max = 0
  volumeByGroup.forEach(v => { if (v > max) max = v })
  const result = new Map<MuscleGroup, number>()
  volumeByGroup.forEach((vol, group) => result.set(group, vol / max))
  return result
}

/**
 * Détecte les groupes musculaires actifs depuis une liste d'exercices.
 * Priorité : colonnes DB (primary_muscles / secondary_muscles) → fallback regex sur le nom.
 * Un muscle ne peut pas être à la fois primaire ET secondaire : primaire gagne.
 */
/** Traduit un slug catalogue (FR court ou EN anatomique) vers un MuscleGroup BodyMap. */
function resolveSlug(slug: string): MuscleGroup | null {
  const direct = CATALOG_SLUG_MAP[slug]
  if (direct) return direct
  // Tentative case-insensitive
  const lower = slug.toLowerCase()
  return CATALOG_SLUG_MAP[lower] ?? null
}

export function detectMuscleGroups(exercises: ExerciseInput[]): MuscleActivation {
  const primary = new Set<MuscleGroup>()
  const secondary = new Set<MuscleGroup>()
  const stabilizers = new Set<MuscleGroup>()

  for (const ex of exercises) {
    const hasPrimary = ex.primary_muscles && ex.primary_muscles.length > 0
    const hasSecondary = ex.secondary_muscles && ex.secondary_muscles.length > 0

    if (hasPrimary || hasSecondary) {
      // Source DB — résoudre via mapping catalogue puis fallback isValidMuscleGroup
      const resolvedPrimary = new Set<MuscleGroup>()
      const resolvedSecondary = new Set<MuscleGroup>()
      const resolvedStabilizers = new Set<MuscleGroup>()

      for (const m of (ex.primary_muscles ?? [])) {
        const group = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
        if (group) resolvedPrimary.add(group)
      }
      for (const m of (ex.secondary_muscles ?? [])) {
        const group = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
        if (group && !resolvedPrimary.has(group)) resolvedSecondary.add(group)
      }
      for (const m of (ex.stabilizers ?? [])) {
        const group = resolveSlug(m) ?? (isValidMuscleGroup(m) ? m as MuscleGroup : null)
        if (group && !resolvedPrimary.has(group) && !resolvedSecondary.has(group)) resolvedStabilizers.add(group)
      }

      // Si aucun slug DB n'a résolu pour cet exercice, fallback fuzzy/regex par exercice
      if (resolvedPrimary.size === 0 && resolvedSecondary.size === 0) {
        const entry = fuzzyFindInCatalog(ex.name)
        if (entry) {
          const pm = entry.primaryMuscle ? resolveSlug(entry.primaryMuscle) : null
          if (pm) resolvedPrimary.add(pm)
          for (const m of (entry.secondaryMuscles ?? [])) {
            const g = resolveSlug(m)
            if (g && !resolvedPrimary.has(g)) resolvedSecondary.add(g)
          }
          for (const m of (entry.stabilizers ?? [])) {
            const g = resolveSlug(m)
            if (g && !resolvedPrimary.has(g) && !resolvedSecondary.has(g)) resolvedStabilizers.add(g)
          }
        } else {
          for (const [group, regex] of Object.entries(MUSCLE_KEYWORDS) as [MuscleGroup, RegExp][]) {
            if (regex.test(ex.name)) resolvedPrimary.add(group)
          }
        }
      }

      resolvedPrimary.forEach(m => primary.add(m))
      resolvedSecondary.forEach(m => { if (!primary.has(m)) secondary.add(m) })
      resolvedStabilizers.forEach(m => { if (!primary.has(m) && !secondary.has(m)) stabilizers.add(m) })
    } else {
      // Pas de données DB — lookup exact puis fuzzy puis regex
      const slug = toSlug(ex.name)
      const entry = catalogBySlug.get(slug) ?? fuzzyFindInCatalog(ex.name)
      if (entry) {
        const pm = entry.primaryMuscle ? resolveSlug(entry.primaryMuscle) : null
        if (pm) primary.add(pm)
        // secondaryMuscles prioritaire sur muscles[] (plus précis)
        if ((entry.secondaryMuscles ?? []).length > 0) {
          for (const m of (entry.secondaryMuscles ?? [])) {
            const g = resolveSlug(m)
            if (g && !primary.has(g)) secondary.add(g)
          }
        } else {
          for (const m of (entry.muscles ?? [])) {
            const g = resolveSlug(m)
            if (g && g !== pm) secondary.add(g)
          }
        }
        for (const m of (entry.stabilizers ?? [])) {
          const g = resolveSlug(m)
          if (g && !primary.has(g) && !secondary.has(g)) stabilizers.add(g)
        }
      } else {
        // Fallback ultime — regex sur le nom (primaire uniquement, pas de secondaire deviné)
        for (const [group, regex] of Object.entries(MUSCLE_KEYWORDS) as [MuscleGroup, RegExp][]) {
          if (regex.test(ex.name)) primary.add(group)
        }
      }
    }
  }

  // Priorité stricte : primaire > secondaire > stabilisateur
  primary.forEach(m => { secondary.delete(m); stabilizers.delete(m) })
  secondary.forEach(m => stabilizers.delete(m))

  return { primary, secondary, stabilizers }
}

const VALID_MUSCLE_GROUPS = new Set<string>([
  'chest','shoulders','biceps','triceps','forearms','abs',
  'quads','hamstrings','glutes','calves','back_upper','back_lower','traps'
])

function isValidMuscleGroup(m: string): boolean {
  return VALID_MUSCLE_GROUPS.has(m)
}
