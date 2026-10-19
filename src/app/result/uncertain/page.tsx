import { PrimaryLink, SectionRule } from '@/components/Buttons'
import { ChatQuestionIcon, FogCloudIcon, QuestionIcon, SendIcon } from '@/components/icons'
import CapturedThumb from '@/components/CapturedThumb'
import { CandidateThumb } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'
import { CANDIDATES } from '@/lib/data'

export const metadata = { title: 'ফলাফল — নিশ্চিত নই · Crop Guardian' }

const SPEECH =
  'নিশ্চিত নই। ৩টা সমস্যার যেকোনোটা হতে পারে: ' +
  CANDIDATES.map((c) => c.name).join(', ') +
  '। ভুল ওষুধ এড়াতে আমি আন্দাজে একটা নাম বলব না। নিশ্চিত হতে ২টা প্রশ্নের উত্তর দিন।'

export default function UncertainPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/camera" title="ফলাফল" right={<ListenButton text={SPEECH} label="ফলাফল পড়ে শোনান" />} />

      <div className="flex shrink-0 items-start gap-3.5 px-4">
        <div className="stitch relative flex h-28 w-[92px] shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[18px] bg-[#1F2A17]!">
          <CapturedThumb />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex h-8 items-center gap-1.5 self-start rounded-2xl bg-sun px-3 text-[15px] font-bold text-ink">
            <QuestionIcon size={18} weight={2.4} />
            নিশ্চিত নই
          </span>
          <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">৩টা সমস্যার যেকোনোটা হতে পারে</h1>
          <p className="m-0 text-[15px] leading-[1.45]">ভুল ওষুধ এড়াতে আমি আন্দাজে একটা নাম বলব না।</p>
        </div>
      </div>

      <SectionRule label="সম্ভাব্য তালিকা" className="mx-4 mt-4 mb-2.5" />

      <ul className="m-0 flex shrink-0 list-none flex-col gap-2.5 px-4">
        {CANDIDATES.map((c) => (
          <li key={c.id} className="stitch flex items-center gap-3 rounded-[18px] px-3.5 py-3">
            <CandidateThumb id={c.id} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-display text-xl font-extrabold">{c.name}</span>
                <span className="text-[13px] text-muted" lang="en">
                  {c.en}
                </span>
              </div>
              <span className="text-sm leading-[1.4]">{c.sign}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-4 mt-3 flex shrink-0 items-center gap-2.5 rounded-2xl bg-mist px-3.5 py-2.5 text-teal-deep">
        <FogCloudIcon size={26} />
        <span className="text-sm leading-[1.4] font-medium">
          আপনার এলাকায় এখন কুয়াশা চলছে, তাই <b>নাবি ধসার</b> সম্ভাবনা বেশি ধরা হয়েছে
        </span>
      </div>

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2 px-4 pb-[18px]">
        <PrimaryLink href="/questions" className="min-h-[72px] gap-3 px-4 py-2">
          <ChatQuestionIcon size={30} weight={2.2} />
          <span className="flex flex-col leading-[1.2]">
            <span className="font-display text-[22px] font-extrabold">২টা প্রশ্নের উত্তর দিন</span>
            <span className="text-sm font-medium">নিশ্চিত হতে ৩০ সেকেন্ড লাগবে</span>
          </span>
        </PrimaryLink>
        <button
          type="button"
          className="flex min-h-12 items-center justify-center gap-2 border-0 bg-transparent text-base font-bold text-teal"
        >
          <SendIcon size={20} />
          সরাসরি কৃষি কর্মকর্তাকে পাঠান
        </button>
      </div>
    </div>
  )
}
