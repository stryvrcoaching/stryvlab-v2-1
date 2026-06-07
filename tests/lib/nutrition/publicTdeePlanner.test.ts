import { describe, expect, it } from 'vitest'

import { buildPublicTdeePlanner } from '@/lib/nutrition/publicTdeePlanner'

const baseInput = {
  age: 30,
  weight: 80,
  height: 180,
  gender: 'male' as const,
  goal: 'deficit' as const,
  bodyFat: 18,
  steps: 9000,
  occupationPreset: 'moderate' as const,
  workouts: 4,
  sessionDurationMin: 70,
  cardioFrequency: 2,
  cardioDurationMin: 30,
}

describe('buildPublicTdeePlanner', () => {
  it('returns a higher training-day TDEE than rest-day TDEE', () => {
    const result = buildPublicTdeePlanner(baseInput, 'balanced')
    expect(result.trainingDay.tdee).toBeGreaterThan(result.restDay.tdee)
  })

  it('keeps weekly average close to the engine average in balanced mode', () => {
    const result = buildPublicTdeePlanner(baseInput, 'balanced')
    expect(Math.abs(result.weekly.averageCalories - result.average.calories)).toBeLessThanOrEqual(40)
  })

  it('moves calories toward training days in training_focus mode', () => {
    const balanced = buildPublicTdeePlanner(baseInput, 'balanced')
    const focused = buildPublicTdeePlanner(baseInput, 'training_focus')

    expect(focused.trainingDay.calories).toBeGreaterThan(balanced.trainingDay.calories)
    expect(focused.restDay.calories).toBeLessThan(balanced.restDay.calories)
  })

  it('moves calories away from rest days in recovery_focus mode', () => {
    const balanced = buildPublicTdeePlanner(baseInput, 'balanced')
    const focused = buildPublicTdeePlanner(baseInput, 'recovery_focus')

    expect(focused.restDay.calories).toBeLessThan(balanced.restDay.calories)
    expect(focused.trainingDay.calories).toBeGreaterThanOrEqual(balanced.trainingDay.calories)
  })
})
