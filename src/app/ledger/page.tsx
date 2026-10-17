import BottomNav from '@/components/BottomNav'
import { SectionRule } from '@/components/Buttons'
import { CameraIcon, CheckIcon, SprayBottleIcon, WarnIcon } from '@/components/icons'
import ListenButton from '@/components/ListenButton'
import { toBnDigits } from '@/lib/bn'
import { formatTaka, LEDGER, type LedgerEntry, SAVED_COUNT, SAVED_TOTAL, SPRAY_COST, SPRAYED_COUNT } from '@/lib/data'

export const metadata = { title: 'মৌসুমের হিসাব — Crop Guardian' }

const ICONS: Record<LedgerEntry['icon'], React.ReactNode> = {
  check: <CheckIcon size={18} weight={2.6} />,
  spray: <SprayBottleIcon size={18} weight={2.2} />,
  warn: <WarnIcon size={18} weight={2.2} />,
  camera: <CameraIcon size={18} weight={2.2} />,
}

const SPEECH =
  `এই মৌসুমে বাঁচিয়েছেন ${SAVED_TOTAL} টাকা। ${SAVED_COUNT}টা অপ্রয়োজনীয় স্প্রে এড়ানো, ` +
  `${SPRAYED_COUNT}টা সময়মতো স্প্রে করেছেন।`

export default function LedgerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between pt-4 pr-4 pl-[18px]">
        <div className="flex flex-col leading-[1.2]">
          <h1 className="m-0 font-display text-[25px] font-extrabold">মৌসুমের হিসাব</h1>
          <span className="text-sm font-medium text-muted">আলু · ডায়মন্ড জাত · রোপণের ৫২ দিন</span>
        </div>
        <ListenButton text={SPEECH} label="হিসাব পড়ে শোনান" />
      </header>

      <section className="mx-4 mt-3.5 flex shrink-0 flex-col gap-1 rounded-[22px] bg-ink px-[18px] pt-[18px] pb-4 text-cream outline-[1.5px] outline-offset-[-8px] outline-sun outline-dashed">
        <span className="text-[15px] font-medium text-line">এই মৌসুমে বাঁচিয়েছেন</span>
        <span className="font-display text-[50px] leading-[1.05] font-extrabold text-sun">{formatTaka(SAVED_TOTAL)}</span>
        <div className="mt-2 grid grid-cols-2 gap-3 border-t-[1.5px] border-dashed border-[#6E5A45] pt-2.5">
          <div className="flex flex-col">
            <span className="font-display text-2xl font-extrabold text-[#BFE3B4]">{toBnDigits(SAVED_COUNT)}টা</span>
            <span className="text-sm text-line">অপ্রয়োজনীয় স্প্রে এড়ানো</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-extrabold text-cream">{toBnDigits(SPRAYED_COUNT)}টা</span>
            <span className="text-sm text-line">সময়মতো স্প্রে করেছেন</span>
          </div>
        </div>
      </section>

      <SectionRule label="কী কী হলো" className="mx-[18px] mt-4 mb-2" />

      <ol className="m-0 flex shrink-0 list-none flex-col px-[18px]">
        {LEDGER.map((e, i) => {
          const last = i === LEDGER.length - 1
          const saved = e.kind === 'saved'
          return (
            <li key={e.day} className="flex gap-3">
              <div className="flex w-[30px] shrink-0 flex-col items-center">
                <span
                  className={`flex size-[30px] items-center justify-center rounded-full ${
                    saved ? 'bg-leaf-soft text-leaf' : 'bg-danger-soft text-danger-deep'
                  }`}
                >
                  {ICONS[e.icon]}
                </span>
                {!last && <span className="my-[3px] flex-1 border-l-2 border-dashed border-stitch" />}
              </div>
              <div className={`flex flex-1 justify-between gap-2 ${last ? 'pb-1.5' : 'pb-3'}`}>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-muted">
                    দিন {toBnDigits(e.day)} · {e.note}
                  </span>
                  <span className="text-base font-bold">{e.action}</span>
                </div>
                {e.amount ? (
                  <span className="font-display text-[17px] font-extrabold text-leaf">+{formatTaka(e.amount)}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mx-[18px] mt-1.5 flex shrink-0 flex-wrap gap-1.5 text-[13px] text-muted">
        <span>প্রতি স্প্রের খরচ ধরা হয়েছে {formatTaka(SPRAY_COST)} (ওষুধ + মজুরি)</span>
        <button type="button" className="border-0 bg-transparent p-0 text-[13px] font-bold text-teal underline">
          বদলান
        </button>
      </div>

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
