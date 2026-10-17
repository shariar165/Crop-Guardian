import CameraControls from '@/components/CameraControls'
import { CheckIcon, ClockIcon, OfflineIcon, RestartIcon } from '@/components/icons'
import { ViewfinderBackdrop, ViewfinderLeaf } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'

export const metadata = { title: 'পাতার ছবি তোলা — Crop Guardian' }

const CHECKS = [
  { label: 'আলো ভালো', ok: true },
  { label: 'দূরত্ব ঠিক', ok: true },
  { label: 'ফোকাস করছি…', ok: false },
]

export default function CameraPage() {
  return (
    <div className="flex flex-1 flex-col bg-night text-cream">
      <TopBar
        back="/"
        title="পাতার ছবি"
        height={72}
        dark
        right={
          <ListenButton
            variant="glass"
            label="নির্দেশনা পড়ে শোনান"
            text="এবার পাতার নিচের দিকটা তুলুন। দাগ চিনতে নিচের দিকটা জরুরি। ছবি ১ এর ২, উপরের দিক তোলা হয়েছে।"
          />
        }
      />

      <div className="relative mx-3 h-[540px] shrink-0 overflow-hidden rounded-3xl bg-[#1F2A17]">
        <ViewfinderBackdrop />
        <ViewfinderLeaf className="absolute top-[104px] left-1/2 h-[380px] w-[300px] -translate-x-1/2" />

        <div className="absolute top-3.5 right-3.5 left-3.5 flex items-center gap-2.5 rounded-2xl bg-sun px-3.5 py-3 text-ink">
          <RestartIcon size={30} weight={2.2} />
          <div className="flex flex-col leading-[1.3]">
            <span className="font-display text-lg font-extrabold">এবার পাতার নিচের দিকটা তুলুন</span>
            <span className="text-sm font-medium">দাগ চিনতে নিচের দিকটা জরুরি</span>
          </div>
        </div>

        <ul className="absolute right-3.5 bottom-3.5 left-3.5 m-0 flex list-none flex-wrap gap-2 p-0" aria-live="polite">
          {CHECKS.map((c) => (
            <li
              key={c.label}
              className={`flex h-9 items-center gap-[5px] rounded-full bg-[rgba(23,18,14,0.82)] px-3 text-sm font-semibold ${
                c.ok ? 'text-[#BFE3B4]' : 'text-[#F3CE5B]'
              }`}
            >
              {c.ok ? <CheckIcon size={18} weight={2.6} /> : <ClockIcon size={18} weight={2.2} className="animate-spin [animation-duration:3s]" />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 px-6 pt-3 pb-2.5">
        <div className="flex items-center justify-center gap-2 text-[15px] font-semibold">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-sun" />
          <span aria-hidden="true" className="box-border size-2.5 rounded-full border-2 border-sun" />
          <span>ছবি ১ / ২ · উপরের দিক তোলা হয়েছে</span>
        </div>
        <CameraControls />
        <div className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#CDBFA9]">
          <OfflineIcon size={16} />
          নেট ছাড়াও চলবে · পরে সিঙ্ক হবে
        </div>
      </div>
    </div>
  )
}
