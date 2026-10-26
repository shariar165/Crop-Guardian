// The farmer's fields as plain data: parsing and season checks with no device storage, so the
// server can read the copy a signed-in farmer sends for SMS alerts. The phone's store is fields.ts.
import { isSeasonId, SEASON_IDS, type SeasonId } from '@/lib/crops'
import { isIsoDate } from '@/lib/dates'
import { riskActive, seasonFor } from '@/lib/season'

export type Field = { season: SeasonId; planted: string }

export const bySeason = (a: Field, b: Field) => SEASON_IDS.indexOf(a.season) - SEASON_IDS.indexOf(b.season)

// Valid fields only, one per season, in season order.
export function validFields(list: unknown): Field[] {
  if (!Array.isArray(list)) return []
  const fields = new Map<SeasonId, Field>()
  for (const f of list) {
    const { season, planted } = (typeof f === 'object' && f !== null ? f : {}) as Record<string, unknown>
    if (isSeasonId(season) && typeof planted === 'string' && isIsoDate(planted) && !fields.has(season)) {
      fields.set(season, { season, planted })
    }
  }
  return [...fields.values()].sort(bySeason)
}

// The stored fields. With nothing stored yet, the old planting date (if any) is the potato field.
export function parseFields(raw: string | null, legacyPlanting: string | null): Field[] {
  if (raw === null) return legacyPlanting && isIsoDate(legacyPlanting) ? [{ season: 'potato', planted: legacyPlanting }] : []
  try {
    return validFields(JSON.parse(raw))
  } catch {
    return []
  }
}

export const inSeason = (field: Field, today: string) => riskActive(seasonFor(today, field.planted, field.season))
