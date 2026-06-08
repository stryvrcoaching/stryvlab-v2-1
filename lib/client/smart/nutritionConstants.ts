// Shared nutrition constants — single source of truth for colors, labels, icons

export const MACRO_COLORS = {
  prot: '#e85d04', // orange — protéines
  carb: '#2d9a4e', // vert  — glucides
  fat:  '#d4a017', // ambre — lipides
  cal:  '#ffe01e', // jaune — calories
} as const

export const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch:     'Déjeuner',
  dinner:    'Dîner',
  snack:     'Collation',
  drinks:    'Boissons',
}

// Lucide icon names — import separately where needed
export const MEAL_TYPE_ICON: Record<string, string> = {
  breakfast: 'Coffee',
  lunch:     'Sun',
  dinner:    'Moon',
  snack:     'Apple',
  drinks:    'Droplets',
}
