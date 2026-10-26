import BottomNav from '@/components/BottomNav'
import LedgerView from '@/components/LedgerView'
import { getPlace } from '@/lib/place'

export const metadata = { title: 'মৌসুমের হিসাব — Crop Guardian' }

// The season ledger of one field (?field=boro, else the one Home showed), from this phone's
// planting date and logged sprays and the real weather.
export default async function LedgerPage({ searchParams }: PageProps<'/ledger'>) {
  const { field } = await searchParams
  const place = await getPlace()
  return (
    <div className="flex flex-1 flex-col">
      <LedgerView place={place.union?.nameBn ?? place.upazila.nameBn} start={typeof field === 'string' ? field : null} />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
