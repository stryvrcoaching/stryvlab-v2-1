export type PriorityActionType = 'checkin' | 'session' | 'meal' | 'water' | 'protein'

export type PriorityActionCardProps = {
  type: PriorityActionType
  title: string
  subtitle: string
  href: string
  ctaLabel: string
}

export function computePriorityAction(params: {
  hour: number
  morningCheckinDone: boolean
  sessionScheduledToday: boolean
  sessionCompletedToday: boolean
  sessionName: string | null
  mealsLoggedToday: number
  waterMl: number
  waterTargetMl: number
  protein_g: number
  proteinTargetG: number
}): PriorityActionCardProps | null {
  const {
    hour, morningCheckinDone, sessionScheduledToday, sessionCompletedToday,
    sessionName, mealsLoggedToday, waterMl, waterTargetMl, protein_g, proteinTargetG,
  } = params

  if (hour < 12 && !morningCheckinDone) {
    return {
      type: 'checkin',
      title: 'Démarre ta journée',
      subtitle: 'Check-in matin non réalisé',
      href: '/client/checkin/morning',
      ctaLabel: 'Check-in',
    }
  }

  if (sessionScheduledToday && !sessionCompletedToday) {
    return {
      type: 'session',
      title: sessionName ? `Séance — ${sessionName}` : 'Séance prévue',
      subtitle: "Ton programme t'attend",
      href: '/client/programme',
      ctaLabel: 'Démarrer',
    }
  }

  if (hour > 12 && mealsLoggedToday < 2) {
    const mealLabel = hour < 14 ? 'déjeuner' : hour < 19 ? 'repas' : 'dîner'
    return {
      type: 'meal',
      title: `Tu n'as pas loggé ton ${mealLabel}`,
      subtitle: `${mealsLoggedToday} repas loggé${mealsLoggedToday > 1 ? 's' : ''} aujourd'hui`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  if (hour > 15 && waterTargetMl > 0 && waterMl < waterTargetMl * 0.5) {
    return {
      type: 'water',
      title: 'Hydratation insuffisante',
      subtitle: `${(waterMl / 1000).toFixed(1)}L / ${(waterTargetMl / 1000).toFixed(1)}L`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  if (hour > 14 && proteinTargetG > 0 && protein_g < proteinTargetG * 0.5) {
    return {
      type: 'protein',
      title: 'Protéines en retard',
      subtitle: `${Math.round(protein_g)}g / ${proteinTargetG}g`,
      href: '/client/nutrition',
      ctaLabel: 'Logger',
    }
  }

  return null
}
