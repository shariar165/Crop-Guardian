// Today's risk for a crop at a place, as the assistant's todayRisk tool and the MCP server's
// get_risk tool return it. The same forecast and rule as Home and /api/risk.
import type { Place } from '@/lib/areas'
import { CROPS, type CropId } from '@/lib/crops'
import type { Risk } from '@/lib/data'
import { todayIn } from '@/lib/dates'
import { fetchHourlyForecast } from '@/lib/weather'

export type PlaceRisk = { place: string; crop: CropId; experimental: boolean; today: Risk; reason: string; days: { date: string; risk: Risk }[] }

export async function riskAt(place: Place, crop: CropId): Promise<PlaceRisk> {
  const { today, reason, days } = CROPS[crop].assess(await fetchHourlyForecast(place.lat, place.lon), todayIn())
  return { place: place.name, crop, experimental: CROPS[crop].experimental, today, reason, days }
}
