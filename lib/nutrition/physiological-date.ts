import type { MealType } from "@/lib/nutrition/food-items"

export const PHYSIOLOGICAL_DAY_OFFSET_HOURS = 4
export const PHYSIOLOGICAL_DAY_CUTOFF_HOUR = PHYSIOLOGICAL_DAY_OFFSET_HOURS
export const PHYSIOLOGICAL_DAY_CUTOFF_MINUTE = 0

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

export function computePhysiologicalDate(input: Date): string {
  const date = new Date(input)

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date passed to computePhysiologicalDate")
  }

  if (date.getHours() < PHYSIOLOGICAL_DAY_OFFSET_HOURS) {
    date.setDate(date.getDate() - 1)
  }

  return formatLocalDate(date)
}

export function inferMealType(input: Date): MealType {
  const hour = input.getHours()

  if (hour < 11) return "breakfast"
  if (hour < 15) return "lunch"
  if (hour < 22) return "dinner"
  return "snack"
}
