import BottomNav from '@/components/BottomNav'
import ListenButton from '@/components/ListenButton'
import MapView, { type CaseCounts, type UnionRisk } from '@/components/MapView'
import { DAY_STATE, RISKS } from '@/lib/data'
import { toBnDigits } from '@/lib/bn'
import { confirmedCounts } from '@/lib/caseDb'
import { todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { assessRisk } from '@/lib/risk'
import { UNIONS } from '@/lib/unions'
import { fetchHourlyForecastMany } from '@/lib/weather'

export const metadata = { title: 'এলাকার ঝুঁকি ম্যাপ — Crop Guardian' }

// Today's weather risk at each union's centroid, from one forecast request.
async function unionRisks(): Promise<UnionRisk[] | null> {
  try {
    const forecasts = await fetchHourlyForecastMany(UNIONS)
    const today = todayIn()
    return UNIONS.map((u, i) => ({ id: u.id, risk: assessRisk(forecasts[i], today).today }))
  } catch (err) {
    console.error('Union forecasts unavailable:', err)
    return null
  }
}

// Officer-confirmed late blight in the last week and month; null without the database.
async function caseCounts(): Promise<CaseCounts | null> {
  try {
    const [week, month] = await Promise.all([confirmedCounts(7), confirmedCounts(30)])
    return { week: Object.fromEntries(week), month: Object.fromEntries(month) }
  } catch (err) {
    console.error('Case counts unavailable:', err)
    return null
  }
}

function speechFor(risks: UnionRisk[] | null, counts: CaseCounts | null): string {
  if (!risks) return 'এলাকার আবহাওয়ার তথ্য এখন আনা যায়নি।'
  const groups = [...RISKS].reverse().flatMap((r) => {
    const names = UNIONS.filter((u) => risks.find((x) => x.id === u.id)?.risk === r).map((u) => u.nameBn)
    return names.length ? [`${names.join(', ')}: ${DAY_STATE[r].word}`] : []
  })
  const cases = counts ? Object.values(counts.week).reduce((a, b) => a + b, 0) : null
  const caseText =
    cases === null ? '' : cases ? ` এই সপ্তাহে কর্মকর্তা ${toBnDigits(cases)}টা নাবি ধসা নিশ্চিত করেছেন।` : ' এই সপ্তাহে কোনো নিশ্চিত কেস নেই।'
  return `শিবগঞ্জ উপজেলায় আজকের আবহাওয়া-ঝুঁকি। ${groups.join('। ')}।${caseText}`
}

export default async function MapPage() {
  const [place, risks, counts] = await Promise.all([getPlace(), unionRisks(), caseCounts()])
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between pt-4 pr-4 pl-[18px]">
        <div className="flex flex-col leading-[1.2]">
          <h1 className="m-0 font-display text-[25px] font-extrabold">আশেপাশের ঝুঁকি</h1>
          <span className="text-sm font-medium text-muted">শিবগঞ্জ উপজেলা, বগুড়া</span>
        </div>
        <ListenButton text={speechFor(risks, counts)} label="ম্যাপের সারাংশ শোনান" />
      </header>

      <MapView risks={risks} counts={counts} mine={place.union?.id ?? null} />

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
