import { tealClass } from '@/components/Buttons'
import { ChatCheckIcon, CheckIcon, DocIcon, HomeIcon, MistCloudIcon, PersonIcon, WarnIcon } from '@/components/icons'
import { PhotoLeafMarked } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar, { RoundLink } from '@/components/TopBar'

export const metadata = { title: 'চূড়ান্ত ফলাফল — নাবি ধসা · Crop Guardian' }

const STEPS = [
  'আক্রান্ত পাতা ও গাছ তুলে মাটিতে পুঁতে ফেলুন',
  'অনুমোদিত ছত্রাকনাশক স্প্রে করুন। মাত্রা: বোতলের লেবেল অনুযায়ী',
  '৫–৭ দিন পর আবার পাতার ছবি তুলুন',
]

const BN_NUM = ['১', '২', '৩']

const SPEECH =
  'নিশ্চিত: নাবি ধসা। দ্রুত ছড়ায়, আজই ব্যবস্থা নিন। এখন কী করবেন: ' +
  STEPS.map((s, i) => `${BN_NUM[i]}. ${s}।`).join(' ')

export default function DiagnosisPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        back="/questions"
        title="ফলাফল"
        height={60}
        right={
          <RoundLink href="/" label="হোমে যান">
            <HomeIcon size={22} weight={2.2} />
          </RoundLink>
        }
      />

      <div className="flex shrink-0 flex-col gap-1.5 px-[18px]">
        <span className="flex h-8 items-center gap-1.5 self-start rounded-2xl bg-leaf px-3 text-[15px] font-bold text-white">
          <CheckIcon size={18} weight={2.8} />
          নিশ্চিত
        </span>
        <h1 className="m-0 font-display text-[42px] leading-[1.05] font-extrabold">নাবি ধসা</h1>
        <span className="text-[15px] font-medium text-muted">Late blight · আলু · ডায়মন্ড জাত</span>
        <div role="alert" className="mt-1 flex items-center gap-2 rounded-[14px] bg-danger-soft px-3 py-[9px] text-[15px] font-bold text-[#7E2A1C]">
          <WarnIcon size={22} weight={2.2} />
          দ্রুত ছড়ায় — আজই ব্যবস্থা নিন
        </div>
      </div>

      <section className="stitch-lg mx-4 mt-3.5 flex shrink-0 flex-col gap-2.5 rounded-[20px] px-4 py-3.5">
        <h2 className="m-0 font-display text-lg font-bold">কেন মনে হলো?</h2>
        <div className="flex items-center gap-3">
          <PhotoLeafMarked />
          <span className="text-[15px] leading-[1.4]">ছবিতে ২টা পানিভেজা দাগ, কিনারায় ফ্যাকাশে বলয়</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-mist text-teal">
            <MistCloudIcon size={26} />
          </span>
          <span className="text-[15px] leading-[1.4]">৩ দিন ধরে ভোরে কুয়াশা, বাতাসে আর্দ্রতা বেশি</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-sun-soft text-amber">
            <ChatCheckIcon size={26} />
          </span>
          <span className="text-[15px] leading-[1.4]">আপনার উত্তর: পাতার নিচে সাদা তুলার মতো আছে</span>
        </div>
      </section>

      <section className="mx-4 mt-4 flex shrink-0 flex-col gap-2.5">
        <h2 className="m-0 font-display text-lg font-bold">এখন কী করবেন</h2>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sun font-display text-[17px] font-extrabold">
                {BN_NUM[i]}
              </span>
              <span className="pt-[3px] text-base leading-[1.4]">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <a
        href="https://dae.gov.bd"
        target="_blank"
        rel="noreferrer"
        className="mx-4 mt-3.5 flex min-h-11 shrink-0 items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-stitch px-3 text-sm font-semibold text-teal no-underline"
      >
        <DocIcon size={20} />
        সূত্র: কৃষি সম্প্রসারণ অধিদপ্তরের নির্দেশিকা
      </a>

      <div className="min-h-4 flex-1" />

      <div className="grid shrink-0 grid-cols-[2fr_3fr] gap-2.5 px-4 pb-[18px]">
        <ListenButton text={SPEECH} label="ফলাফল পড়ে শোনান" variant="outline" />
        <button type="button" className={`${tealClass} min-h-[66px] gap-2 px-2.5 text-[17px] font-bold`}>
          <PersonIcon size={24} />
          কৃষি কর্মকর্তাকে দেখান
        </button>
      </div>
    </div>
  )
}
