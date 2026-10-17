import BottomNav from '@/components/BottomNav'
import ListenButton from '@/components/ListenButton'
import PlantingPicker from '@/components/PlantingPicker'
import TopBar from '@/components/TopBar'

export const metadata = { title: 'রোপণের তারিখ — Crop Guardian' }

const SPEECH = 'আলু কবে লাগিয়েছেন? দিন, মাস আর বছর বেছে নিয়ে তারিখ রাখুন চাপুন।'

// Reached from Home and from the Ledger header (?from=ledger), and goes back there.
export default async function PlantingPage({ searchParams }: PageProps<'/planting'>) {
  const back = (await searchParams).from === 'ledger' ? '/ledger' : '/'
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back={back} title="রোপণের তারিখ" right={<ListenButton text={SPEECH} label="পড়ে শোনান" />} />
      <PlantingPicker back={back} />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
