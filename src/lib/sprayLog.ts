// The sprays the farmer logs ("আজ স্প্রে করেছি") for each field (by season, see fields.ts), and the
// cost per spray, kept on the device.
import { useMemo } from 'react'
import type { SeasonId } from '@/lib/crops'
import { SPRAY_COST } from '@/lib/data'
import { isIsoDate } from '@/lib/dates'
import { store, useStored } from '@/lib/deviceStore'

const SPRAYS_KEY = 'crop-guardian:sprays'
const COST_KEY = 'crop-guardian:spray-cost'
export const MAX_SPRAY_COST = 100_000

// Potato keeps the key from before fields, so the sprays already logged need no move. Sprays from
// an earlier season stay, but the ledger only counts those inside the field's window.
export const spraysKey = (season: SeasonId) => (season === 'potato' ? SPRAYS_KEY : `${SPRAYS_KEY}:${season}`)

export function parseSprays(raw: string | null): string[] {
  try {
    const list: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(list) ? [...new Set(list.filter((d): d is string => typeof d === 'string' && isIsoDate(d)))].sort() : []
  } catch {
    return []
  }
}

export function parseCost(raw: string | null): number {
  const n = Number(raw)
  return raw !== null && Number.isInteger(n) && n > 0 && n <= MAX_SPRAY_COST ? n : SPRAY_COST
}

export function useSprays(season: SeasonId): string[] {
  const raw = useStored(spraysKey(season))
  return useMemo(() => parseSprays(raw), [raw])
}

function readSprays(season: SeasonId): string[] {
  try {
    return parseSprays(localStorage.getItem(spraysKey(season)))
  } catch {
    return []
  }
}

export function addSpray(season: SeasonId, date: string): boolean {
  return store(spraysKey(season), JSON.stringify(parseSprays(JSON.stringify([...readSprays(season), date]))))
}

export function removeSpray(season: SeasonId, date: string): boolean {
  return store(spraysKey(season), JSON.stringify(readSprays(season).filter((d) => d !== date)))
}

export function useSprayCost(): number {
  return parseCost(useStored(COST_KEY))
}

export function saveSprayCost(cost: number): boolean {
  return store(COST_KEY, String(cost))
}
