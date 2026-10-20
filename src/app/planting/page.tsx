import BottomNav from '@/components/BottomNav'
import { SectionRule } from '@/components/Buttons'
import ListenButton from '@/components/ListenButton'
import PlantingPicker from '@/components/PlantingPicker'
import TopBar from '@/components/TopBar'
import UnionPicker from '@/components/UnionPicker'
import { getPlace } from '@/lib/place'

export const metadata = { title: 'আমার জমি — Crop Guardian' }

const SPEECH =
  'প্রথমে আপনার ইউনিয়নের নাম চাপুন। তারপর আলু কবে লাগিয়েছেন, দিন, মাস আর বছর বেছে নিয়ে তারিখ রাখুন চাপুন।'

const BACK: Record<string, string> = { ledger: '/ledger', intro: '/', guide: '/guide' }

// Reached from Home, the Ledger header (?from=ledger), the first-run intro and the guide, and goes back there.
export default async function PlantingPage({ searchParams }: PageProps<'/planting'>) {
  const from = (await searchParams).from
  const back = (typeof from === 'string' && BACK[from]) || '/'
  const place = await getPlace()
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back={back} title="আমার জমি" right={<ListenButton text={SPEECH} label="পড়ে শোনান" />} />
      <div className="flex shrink-0 flex-col gap-3 px-4">
        <SectionRule label="১. আপনার ইউনিয়ন" />
        <p className="m-0 text-[15px] leading-[1.45]">জমি কোন ইউনিয়নে? সেখানকার আবহাওয়া দেখে ঝুঁকি বলব, ম্যাপেও দেখাব।</p>
        <UnionPicker current={place.union?.id ?? null} />
        <SectionRule label="২. রোপণের তারিখ" className="mt-3" />
      </div>
      <PlantingPicker back={back} />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
