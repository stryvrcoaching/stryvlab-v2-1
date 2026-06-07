import type { Metadata } from 'next'

import TdeePlannerPage from './TdeePlannerPage'

export const metadata: Metadata = {
  title: 'Calculateur TDEE',
  description:
    "Calculateur TDEE journalier avec BMR, NEAT, EAT, TEF et programmation simple du deficit, de la maintenance ou du surplus.",
  openGraph: {
    title: 'Calculateur TDEE | STRYV lab',
    description:
      'Un workflow guide pour estimer vos besoins par jour et programmer votre objectif avec plus de precision qu un calculateur standard.',
    type: 'website',
  },
}

export default function CalculateurPage() {
  return <TdeePlannerPage />
}
