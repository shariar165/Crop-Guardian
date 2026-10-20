import BottomNav from '@/components/BottomNav'
import LedgerView from '@/components/LedgerView'
import { getPlace } from '@/lib/place'

export const metadata = { title: 'মৌসুমের হিসাব — Crop Guardian' }

// The season ledger, from this phone's planting date and logged sprays and the real weather.
export default async function LedgerPage() {
  const place = await getPlace()
  return (
    <div className="flex flex-1 flex-col">
      <LedgerView place={place.union?.nameBn ?? 'শিবগঞ্জ'} />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
