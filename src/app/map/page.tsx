import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import ListenButton from '@/components/ListenButton'
import MapView, { type CaseCounts, type MapArea, type UnionRisk } from '@/components/MapView'
import { unionById } from '@/lib/areas'
import { DAY_STATE, RISKS } from '@/lib/data'
import { toBnDigits } from '@/lib/bn'
import { confirmedCounts } from '@/lib/caseDb'
import { CROP_IDS, type CropId, CROPS } from '@/lib/crops'
import { todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { shapesOf } from '@/lib/shapes'
import { fetchHourlyForecastMany } from '@/lib/weather'

export const metadata = { title: 'এলাকার ঝুঁকি ম্যাপ — Crop Guardian' }

// Today's weather risk for every crop at each union's centroid, from one forecast request.
async function unionRisks(unions: { id: string; lat: number; lon: number }[]): Promise<Record<CropId, UnionRisk[]> | null> {
  try {
    const forecasts = await fetchHourlyForecastMany(unions)
    const today = todayIn()
    const forCrop = (c: CropId) => unions.map((u, i) => ({ id: u.id, risk: CROPS[c].assess(forecasts[i], today).today }))
    return Object.fromEntries(CROP_IDS.map((c) => [c, forCrop(c)])) as Record<CropId, UnionRisk[]>
  } catch (err) {
    console.error('Union forecasts unavailable:', err)
    return null
  }
}

// Officer-confirmed late blight in the last week and month, in this upazila; null without the database.
async function caseCounts(ids: Set<string>): Promise<CaseCounts | null> {
  try {
    const [week, month] = await Promise.all([confirmedCounts(7), confirmedCounts(30)])
    // unionById also maps cases saved with the old bare Shibganj ids.
    const here = (m: Map<string, number>) => {
      const out: Record<string, number> = {}
      for (const [raw, n] of m) {
        const id = unionById(raw)?.id
        if (id && ids.has(id)) out[id] = (out[id] ?? 0) + n
      }
      return out
    }
    return { week: here(week), month: here(month) }
  } catch (err) {
    console.error('Case counts unavailable:', err)
    return null
  }
}

function speechFor(area: MapArea, risks: Record<CropId, UnionRisk[]> | null, counts: CaseCounts | null): string {
  if (!risks) return 'এলাকার আবহাওয়ার তথ্য এখন আনা যায়নি।'
  const perCrop = CROP_IDS.map((c) => {
    const groups = [...RISKS].reverse().flatMap((r) => {
      const names = area.unions.filter((u) => risks[c].find((x) => x.id === u.id)?.risk === r).map((u) => u.nameBn)
      return names.length ? [`${names.join(', ')}: ${DAY_STATE[r].word}`] : []
    })
    return `${CROPS[c].ofBn} ${CROPS[c].diseaseBn} রোগ। ${groups.join('। ')}।`
  })
  const cases = counts ? Object.values(counts.week).reduce((a, b) => a + b, 0) : null
  const caseText =
    cases === null ? '' : cases ? ` এই সপ্তাহে কর্মকর্তা ${toBnDigits(cases)}টা নাবি ধসা নিশ্চিত করেছেন।` : ' এই সপ্তাহে কোনো নিশ্চিত কেস নেই।'
  return `${area.name} উপজেলায় আজকের আবহাওয়া-ঝুঁকি। ${perCrop.join(' ')}${caseText}`
}

// The farmer's upazila (Shibganj, Bogura, until they pick theirs).
export default async function MapPage() {
  const place = await getPlace()
  const { upazila, district } = place
  const shapes = await shapesOf(upazila.id)
  const area: MapArea = {
    name: upazila.nameBn,
    viewBox: (shapes?.viewBox ?? [0, 0, 338, 284]).join(' '),
    unions: (shapes?.unions ?? []).flatMap((s) => {
      const u = upazila.unions.find((x) => x.id === s.id)
      return u ? [{ ...s, nameBn: u.nameBn }] : []
    }),
  }
  const [risks, counts] = await Promise.all([unionRisks(upazila.unions), caseCounts(new Set(upazila.unions.map((u) => u.id)))])
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between pt-4 pr-4 pl-[18px]">
        <div className="flex flex-col leading-[1.2]">
          <h1 className="m-0 font-display text-[25px] font-extrabold">আশেপাশের ঝুঁকি</h1>
          <span className="text-sm font-medium text-muted">
            {upazila.nameBn} উপজেলা, {district.nameBn} ·{' '}
            <Link href={`/planting?d=${district.id}`} className="font-bold text-teal">
              বদলান
            </Link>
          </span>
        </div>
        <ListenButton text={speechFor(area, risks, counts)} label="ম্যাপের সারাংশ শোনান" />
      </header>

      <MapView area={area} risksByCrop={risks} counts={counts} mine={place.union?.id ?? null} />

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
