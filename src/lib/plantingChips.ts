// The one-tap planting dates on /planting. Pure, so it is tested without React.
import { type SeasonId } from '@/lib/crops'
import { addDays, addMonths } from '@/lib/dates'
import { seasonFor } from '@/lib/season'

export type PlantingChip = { label: string; date: string }

const CHIPS: [string, (today: string) => string][] = [
  ['আজ', (t) => t],
  ['১ সপ্তাহ আগে', (t) => addDays(t, -7)],
  ['২ সপ্তাহ আগে', (t) => addDays(t, -14)],
  ['৩ সপ্তাহ আগে', (t) => addDays(t, -21)],
  ['১ মাস আগে', (t) => addMonths(t, -1)],
]

// Never in the future, and only dates whose crop would still be in the field today: a chip that
// ends the season at once would be a mis-tap, and the dropdowns are there for anything else.
export function plantingChips(today: string, season: SeasonId): PlantingChip[] {
  return CHIPS.map(([label, of]) => ({ label, date: of(today) })).filter(({ date }) => seasonFor(today, date, season).phase !== 'after')
}
