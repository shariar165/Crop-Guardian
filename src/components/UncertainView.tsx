'use client'

import { PrimaryLink, SectionRule } from '@/components/Buttons'
import CapturedThumb from '@/components/CapturedThumb'
import { Loading, NoDiagnosis, ValidationBadge, WhyCard } from '@/components/DiagnosisParts'
import { ChatQuestionIcon, QuestionIcon, SendIcon } from '@/components/icons'
import { CandidateThumb } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import OfficerShareButton from '@/components/OfficerShareButton'
import TopBar from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { CLASS_CONTENT } from '@/lib/diagnosis/content'
import { CONFIDENCE_WORD, labelOf } from '@/lib/diagnosis/explain'
import { withMock } from '@/lib/diagnosis/flow'
import type { Mock } from '@/lib/diagnosis/mock'
import { questionCount } from '@/lib/diagnosis/questions'
import { useDiagnosis } from '@/lib/diagnosis/useDiagnosis'

export default function UncertainView({ mock }: { mock?: Mock }) {
  const view = useDiagnosis(mock)
  if (view.status === 'loading') return <Loading />
  if (view.status === 'empty') return <NoDiagnosis />

  const { config, record } = view
  const candidates = record.result.candidates
  const heading = `${toBnDigits(candidates.length)}টার যেকোনোটা হতে পারে`
  const asks = questionCount(candidates, [])
  const speech =
    `${CONFIDENCE_WORD.uncertain}। ${heading}: ` +
    candidates.map((id) => labelOf(id, config)).join(', ') +
    '। ভুল ওষুধ এড়াতে আমি আন্দাজে একটা নাম বলব না।' +
    (asks ? ` বাছাই করতে ${toBnDigits(asks)}টা প্রশ্নের উত্তর দিন।` : ' কৃষি কর্মকর্তাকে দেখান।')

  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/camera" title="ফলাফল" right={<ListenButton text={speech} label="ফলাফল পড়ে শোনান" />} />

      <div className="flex shrink-0 items-start gap-3.5 px-4">
        <div className="stitch relative flex h-28 w-[92px] shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[18px] bg-[#1F2A17]!">
          <CapturedThumb enabled={!mock} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex h-8 items-center gap-1.5 self-start rounded-2xl bg-sun px-3 text-[15px] font-bold text-ink">
            <QuestionIcon size={18} weight={2.4} />
            {CONFIDENCE_WORD.uncertain}
          </span>
          <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">{heading}</h1>
          <p className="m-0 text-[15px] leading-[1.45]">ভুল ওষুধ এড়াতে আমি আন্দাজে একটা নাম বলব না।</p>
        </div>
      </div>
      <ValidationBadge className="mx-4 mt-2.5" />

      <SectionRule label="সম্ভাব্য তালিকা" className="mx-4 mt-4 mb-2.5" />

      <ul className="m-0 flex shrink-0 list-none flex-col gap-2.5 px-4">
        {candidates.map((id) => (
          <li key={id} className="stitch flex items-center gap-3 rounded-[18px] px-3.5 py-3">
            <CandidateThumb id={id} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-display text-xl font-extrabold">{labelOf(id, config)}</span>
                <span className="text-[13px] text-muted" lang="en">
                  {CLASS_CONTENT[id]?.en}
                </span>
              </div>
              <span className="text-sm leading-[1.4]">{CLASS_CONTENT[id]?.sign}</span>
            </div>
          </li>
        ))}
      </ul>

      <WhyCard record={record} config={config} title="ছবি আর আবহাওয়া" photos={!mock} />

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2 px-4 pb-[18px]">
        {asks > 0 && (
          <PrimaryLink href={withMock('/questions', mock)} className="min-h-[72px] gap-3 px-4 py-2">
            <ChatQuestionIcon size={30} weight={2.2} />
            <span className="flex flex-col leading-[1.2]">
              <span className="font-display text-[22px] font-extrabold">{toBnDigits(asks)}টা প্রশ্নের উত্তর দিন</span>
              <span className="text-sm font-medium">পাতা দেখে হ্যাঁ বা না বলুন</span>
            </span>
          </PrimaryLink>
        )}
        <OfficerShareButton
          record={record}
          config={config}
          demo={!!mock}
          className="flex min-h-12 items-center justify-center gap-2 border-0 bg-transparent text-base font-bold text-teal"
        >
          <SendIcon size={20} />
          সরাসরি কৃষি কর্মকর্তাকে পাঠান
        </OfficerShareButton>
      </div>
    </div>
  )
}
