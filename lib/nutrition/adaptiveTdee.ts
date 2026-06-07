export interface WeightSample {
  date: string       // ISO date 'YYYY-MM-DD'
  weight_kg: number
}

export interface AdaptiveTdeeInput {
  weightSamples: WeightSample[]
  avgIntakeKcal: number
  caloriesSource: 'logs' | 'protocol'
  windowDays: number
}

export interface AdaptiveTdeeResult {
  tdeeAdaptive: number
  weightDeltaKg: number
  slopeKgPerDay: number
  confidence: 'high' | 'low'
}

export function linearRegression(samples: WeightSample[]): { slope: number; intercept: number } {
  const sorted = [...samples].sort((a, b) => a.date.localeCompare(b.date))
  const origin = new Date(sorted[0].date).getTime()
  const points = sorted.map(s => ({
    x: (new Date(s.date).getTime() - origin) / 86400000,
    y: s.weight_kg,
  }))
  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0)
  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export function calcAdaptiveTdee(input: AdaptiveTdeeInput): AdaptiveTdeeResult {
  if (input.weightSamples.length < 2) {
    throw new Error('At least 2 weight samples required')
  }
  const { slope } = linearRegression(input.weightSamples)
  // Linear regression method: TDEE = intake - (slope × 7700)
  // Losing weight → slope < 0 → -slope > 0 → TDEE > intake ✓
  // Gaining weight → slope > 0 → -slope < 0 → TDEE < intake ✓
  const rawTdee = input.avgIntakeKcal - slope * 7700
  const tdeeAdaptive = Math.round(rawTdee / 10) * 10
  const weightDeltaKg = parseFloat((slope * input.windowDays).toFixed(2))
  const confidence: 'high' | 'low' =
    input.caloriesSource === 'protocol' || input.weightSamples.length < 4
      ? 'low'
      : 'high'
  return { tdeeAdaptive, weightDeltaKg, slopeKgPerDay: slope, confidence }
}
