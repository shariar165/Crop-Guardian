import BottomNav from '@/components/BottomNav'
import ListenButton from '@/components/ListenButton'
import MapView from '@/components/MapView'

export const metadata = { title: 'এলাকার ঝুঁকি ম্যাপ — Crop Guardian' }

const SPEECH =
  'শিবগঞ্জ উপজেলায় এই সপ্তাহে ১২টা নিশ্চিত কেস। কিচক আর শিবগঞ্জ ইউনিয়নে বিপদ, আটমূল আর মোকামতলায় সতর্ক, ময়দানহাট্টা আর দেউলীতে নিরাপদ।'

export default function MapPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between pt-4 pr-4 pl-[18px]">
        <div className="flex flex-col leading-[1.2]">
          <h1 className="m-0 font-display text-[25px] font-extrabold">আশেপাশের ঝুঁকি</h1>
          <span className="text-sm font-medium text-muted">শিবগঞ্জ উপজেলা, বগুড়া</span>
        </div>
        <ListenButton text={SPEECH} label="ম্যাপের সারাংশ শোনান" />
      </header>

      <MapView />

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
