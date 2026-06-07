import {
  calculateMacros,
  type MacroGoal,
  type MacroGender,
  type MacroInput,
  type MacroResult,
} from '@/lib/formulas/macros'

export type DayDistribution = 'balanced' | 'training_focus' | 'recovery_focus'
export type OccupationPreset = 'sedentary' | 'light' | 'moderate' | 'active'

export interface PublicTdeePlannerInput {
  age: number
  weight: number
  height: number
  gender: MacroGender
  goal: MacroGoal
  bodyFat?: number
  muscleMassKg?: number
  bmrKcalMeasured?: number
  visceralFatLevel?: number
  steps?: number
  occupationPreset?: OccupationPreset
  workHoursPerWeek?: number
  workouts: number
  sessionDurationMin?: number
  trainingCaloriesWeekly?: number
  cardioFrequency?: number
  cardioDurationMin?: number
  stressLevel?: number
  sleepDurationH?: number
  caffeineDaily?: number
  alcoholWeekly?: number
  menstrualPhase?: 'follicular' | 'luteal' | 'unknown'
}

export interface PublicPlanDay {
  key: 'training' | 'rest'
  label: string
  calories: number
  protein: number
  carbs: number
  fats: number
  tdee: number
  adjustment: number
  breakdown: MacroResult['breakdown']
  macroResult: MacroResult
}

export interface PublicWeeklySummary {
  averageCalories: number
  averageProtein: number
  averageCarbs: number
  averageFats: number
  averageTdee: number
  weeklyCalorieTarget: number
}

export interface PublicTdeePlannerResult {
  average: MacroResult
  trainingDay: PublicPlanDay
  restDay: PublicPlanDay
  weekly: PublicWeeklySummary
  distribution: DayDistribution
  trainingDays: number
  restDays: number
}

const OCCUPATION_MULTIPLIER: Record<OccupationPreset, number> = {
  sedentary: 1.0,
  light: 1.05,
  moderate: 1.1,
  active: 1.18,
}

function buildMacroInput(input: PublicTdeePlannerInput): MacroInput {
  return {
    age: input.age,
    weight: input.weight,
    height: input.height,
    gender: input.gender,
    goal: input.goal,
    bodyFat: input.bodyFat,
    muscleMassKg: input.muscleMassKg,
    bmrKcalMeasured: input.bmrKcalMeasured,
    visceralFatLevel: input.visceralFatLevel,
    steps: input.steps,
    occupationMultiplier: OCCUPATION_MULTIPLIER[input.occupationPreset ?? 'moderate'],
    workHoursPerWeek: input.workHoursPerWeek,
    workouts: input.workouts,
    sessionDurationMin: input.sessionDurationMin,
    trainingCaloriesWeekly: input.trainingCaloriesWeekly,
    cardioFrequency: input.cardioFrequency,
    cardioDurationMin: input.cardioDurationMin,
    stressLevel: input.stressLevel,
    sleepDurationH: input.sleepDurationH,
    caffeineDaily: input.caffeineDaily,
    alcoholWeekly: input.alcoholWeekly,
    menstrualPhase: input.menstrualPhase,
  }
}

function resolveDistributionShift(goal: MacroGoal): number {
  if (goal === 'surplus') return 120
  if (goal === 'maintenance') return 140
  return 160
}

function applyCalorieShift(
  macroResult: MacroResult,
  delta: number,
  gender: MacroGender,
): PublicPlanDay {
  let calories = macroResult.calories + delta
  const protein = macroResult.macros.p
  let fats = macroResult.macros.f
  let carbs = macroResult.macros.c

  const calorieFloor = gender === 'female' ? 1200 : 1400
  calories = Math.max(calorieFloor, calories)

  let carbDelta = Math.round(delta / 4)
  carbs = Math.max(0, carbs + carbDelta)

  const recalculatedCalories = protein * 4 + fats * 9 + carbs * 4
  if (recalculatedCalories > calories) {
    const kcalOver = recalculatedCalories - calories
    const fatReduction = Math.min(fats, Math.ceil(kcalOver / 9))
    fats -= fatReduction
  } else if (recalculatedCalories < calories) {
    carbs += Math.round((calories - recalculatedCalories) / 4)
  }

  const finalCalories = protein * 4 + fats * 9 + carbs * 4

  return {
    key: 'rest',
    label: '',
    calories: finalCalories,
    protein,
    carbs,
    fats,
    tdee: macroResult.tdee,
    adjustment: finalCalories - macroResult.tdee,
    breakdown: macroResult.breakdown,
    macroResult,
  }
}

function withDayIdentity(
  day: PublicPlanDay,
  key: PublicPlanDay['key'],
  label: string,
): PublicPlanDay {
  return { ...day, key, label }
}

export function buildPublicTdeePlanner(
  input: PublicTdeePlannerInput,
  distribution: DayDistribution = 'balanced',
): PublicTdeePlannerResult {
  const trainingDays = Math.max(0, Math.min(7, Math.round(input.workouts)))
  const restDays = Math.max(0, 7 - trainingDays)
  const average = calculateMacros(buildMacroInput(input))

  const trainingMacroResult = calculateMacros(
    buildMacroInput({
      ...input,
      workouts: trainingDays > 0 ? 7 : 0,
      cardioFrequency: (input.cardioFrequency ?? 0) > 0 ? 7 : 0,
      trainingCaloriesWeekly: undefined,
    }),
  )

  const restMacroResult = calculateMacros(
    buildMacroInput({
      ...input,
      workouts: 0,
      cardioFrequency: 0,
      trainingCaloriesWeekly: undefined,
    }),
  )

  const averageTrainingDelta = trainingMacroResult.tdee - average.tdee
  const averageRestDelta = restMacroResult.tdee - average.tdee

  let trainingDelta = averageTrainingDelta
  let restDelta = averageRestDelta

  if (distribution !== 'balanced') {
    const shift = resolveDistributionShift(input.goal)
    if (distribution === 'training_focus' && trainingDays > 0 && restDays > 0) {
      trainingDelta += shift
      restDelta -= Math.round((shift * trainingDays) / restDays)
    }
    if (distribution === 'recovery_focus' && trainingDays > 0 && restDays > 0) {
      restDelta -= shift
      trainingDelta += Math.round((shift * restDays) / trainingDays)
    }
  }

  const currentWeeklyCalories =
    (average.calories + trainingDelta) * trainingDays +
    (average.calories + restDelta) * restDays
  const weeklyTarget = average.calories * 7
  const weeklyCorrection = weeklyTarget - currentWeeklyCalories

  if (restDays > 0) {
    restDelta += Math.round(weeklyCorrection / restDays)
  } else if (trainingDays > 0) {
    trainingDelta += Math.round(weeklyCorrection / trainingDays)
  }

  const trainingDay = withDayIdentity(
    applyCalorieShift(
      trainingMacroResult,
      average.calories + trainingDelta - trainingMacroResult.calories,
      input.gender,
    ),
    'training',
    'Jour entrainement',
  )
  const restDay = withDayIdentity(
    applyCalorieShift(
      restMacroResult,
      average.calories + restDelta - restMacroResult.calories,
      input.gender,
    ),
    'rest',
    'Jour repos',
  )

  const weeklyCalorieTarget =
    trainingDay.calories * trainingDays + restDay.calories * restDays

  const weekly = {
    averageCalories: Math.round(weeklyCalorieTarget / 7),
    averageProtein: Math.round(
      (trainingDay.protein * trainingDays + restDay.protein * restDays) / 7,
    ),
    averageCarbs: Math.round(
      (trainingDay.carbs * trainingDays + restDay.carbs * restDays) / 7,
    ),
    averageFats: Math.round(
      (trainingDay.fats * trainingDays + restDay.fats * restDays) / 7,
    ),
    averageTdee: Math.round(
      (trainingDay.tdee * trainingDays + restDay.tdee * restDays) / 7,
    ),
    weeklyCalorieTarget,
  }

  return {
    average,
    trainingDay,
    restDay,
    weekly,
    distribution,
    trainingDays,
    restDays,
  }
}

export function formatPlannerSummary(result: PublicTdeePlannerResult): string {
  return [
    `Moyenne hebdo: ${result.weekly.averageCalories} kcal`,
    `Jour entrainement: ${result.trainingDay.calories} kcal (${result.trainingDay.protein}P / ${result.trainingDay.carbs}G / ${result.trainingDay.fats}L)`,
    `Jour repos: ${result.restDay.calories} kcal (${result.restDay.protein}P / ${result.restDay.carbs}G / ${result.restDay.fats}L)`,
    `Planning: ${result.trainingDays} jours entrainement, ${result.restDays} jours repos`,
  ].join('\n')
}
