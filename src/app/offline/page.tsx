import { PrimaryLink } from '@/components/Buttons'
import { CameraIcon, OfflineIcon } from '@/components/icons'

export const metadata = { title: 'নেট নেই — Crop Guardian' }

// Served by the service worker for screens that need the internet (Home's weather risk) when offline.
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-mist text-teal">
        <OfflineIcon size={40} />
      </span>
      <h1 className="m-0 font-display text-[30px] leading-[1.15] font-extrabold">নেট নেই</h1>
      <p className="m-0 text-base leading-[1.45] text-muted">
        আবহাওয়ার ঝুঁকি দেখা যাচ্ছে না। নেট ফিরলে আবার খুলুন।
      </p>
      <p className="m-0 text-base leading-[1.45]">
        আগে একবার নেট থাকতে ছবি দেখানো হয়ে থাকলে, পাতার ছবি নেট ছাড়াও দেখা যাবে।
      </p>
      <PrimaryLink href="/camera" className="mt-2 min-h-[64px] w-full gap-2.5 font-display text-xl font-extrabold">
        <CameraIcon size={26} weight={2.2} />
        পাতার ছবি তুলুন
      </PrimaryLink>
    </div>
  )
}
