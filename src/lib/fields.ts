// The farmer's fields, kept on the device in localStorage: at most one per season (আলু, বোরো, আমন),
// each with its planting or transplanting date, so the season is the field's id. The union stays
// one per phone (the cg-union cookie). Client-only.
import { useMemo } from 'react'
import { isSeasonId, type SeasonId } from '@/lib/crops'
import { store, useStored } from '@/lib/deviceStore'
import { bySeason, type Field, inSeason, parseFields } from '@/lib/fieldList'

export { type Field, inSeason, parseFields }

const FIELDS_KEY = 'crop-guardian:fields'
// Before fields, the phone kept one potato planting date. It still becomes the potato field,
// and is kept in step with it so an older version of the app still finds the date.
const LEGACY_PLANTING_KEY = 'crop-guardian:planting-date'
// The field Home last showed.
const CHOSEN_KEY = 'crop-guardian:home-field'

// Empty during server rendering and hydration (check useHydrated before calling it "no fields").
export function useFields(): Field[] {
  const raw = useStored(FIELDS_KEY)
  const legacy = useStored(LEGACY_PLANTING_KEY)
  return useMemo(() => parseFields(raw, legacy), [raw, legacy])
}

export function readFields(): Field[] {
  try {
    return parseFields(localStorage.getItem(FIELDS_KEY), localStorage.getItem(LEGACY_PLANTING_KEY))
  } catch {
    return []
  }
}

function writeFields(fields: Field[]): boolean {
  if (!store(FIELDS_KEY, JSON.stringify(fields.sort(bySeason)))) return false
  store(LEGACY_PLANTING_KEY, fields.find((f) => f.season === 'potato')?.planted ?? null)
  return true
}

// Sets (or with null, removes) the season's field. Returns false if the device would not store it.
export function saveField(season: SeasonId, planted: string | null): boolean {
  const others = readFields().filter((f) => f.season !== season)
  return writeFields(planted ? [...others, { season, planted }] : others)
}

export function useChosenSeason(): SeasonId | null {
  const value = useStored(CHOSEN_KEY)
  return isSeasonId(value) ? value : null
}

export const chooseSeason = (season: SeasonId) => store(CHOSEN_KEY, season)

// The field the ledger and Home's pill follow when none is picked: the one last chosen on Home,
// else the first in season, else the first. Null with no fields.
export function mainField(fields: Field[], today: string, chosen: SeasonId | null): Field | null {
  return fields.find((f) => f.season === chosen) ?? fields.find((f) => inSeason(f, today)) ?? fields[0] ?? null
}
