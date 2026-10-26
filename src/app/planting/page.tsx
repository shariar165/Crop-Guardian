import BottomNav from '@/components/BottomNav'
import { SectionRule } from '@/components/Buttons'
import ListenButton from '@/components/ListenButton'
import PlantingPicker from '@/components/PlantingPicker'
import TopBar from '@/components/TopBar'
import UnionPicker from '@/components/UnionPicker'
import { getPlace } from '@/lib/place'

export const metadata = { title: 'আমার জমি — Crop Guardian' }

const SPEECH =
  'প্রথমে আপনার এলাকা বেছে নিন: জেলা, তারপর উপজেলা, তারপর ইউনিয়নের নাম চাপুন। তারপর ফসল বেছে নিন, আলু না ধান। ধান হলে বোরো না আমন, সেটাও বেছে নিন। তারপর কবে লাগিয়েছেন, দিন, মাস আর বছর বেছে নিয়ে তারিখ রাখুন চাপুন। আলু আর ধান, দুই জমিই রাখা যায়।'

const BACK: Record<string, string> = { ledger: '/ledger', intro: '/', guide: '/guide', account: '/account' }

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

// Reached from Home, the Ledger header (?from=ledger), the first-run intro, the guide, the map and
// the SMS alerts on /account, and goes back there. `?season=` opens the form on that field; `?d=`
// and `?u=` are the place picker's steps.
export default async function PlantingPage({ searchParams }: PageProps<'/planting'>) {
  const params = await searchParams
  const from = one(params.from)
  const season = one(params.season)
  const back = (from && BACK[from]) || '/'
  const keep = new URLSearchParams(Object.entries({ from, season }).filter((e): e is [string, string] => e[1] !== undefined)).toString()
  const place = await getPlace()
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back={back} title="আমার জমি" right={<ListenButton text={SPEECH} label="পড়ে শোনান" />} />
      <div className="flex shrink-0 flex-col gap-3 px-4">
        <SectionRule label="১. আপনার এলাকা" />
        <p className="m-0 text-[15px] leading-[1.45]">জমি কোথায়? জেলা, উপজেলা আর ইউনিয়ন বেছে নিন। সেখানকার আবহাওয়া দেখে ঝুঁকি বলব, ম্যাপেও দেখাব।</p>
        <UnionPicker current={place.union} district={one(params.d)} upazila={one(params.u)} base={keep ? `/planting?${keep}` : '/planting'} />
        <SectionRule label="২. ফসল আর রোপণের তারিখ" className="mt-3" />
      </div>
      <PlantingPicker back={back} start={season ?? null} />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
