'use client'

import Link from 'next/link'
import { Loading, NoDiagnosis } from '@/components/DiagnosisParts'
import { toBnDigits } from '@/lib/bn'
import { type Answer, saveDiagnosis } from '@/lib/captureStore'
import { labelOf } from '@/lib/diagnosis/explain'
import { withMock } from '@/lib/diagnosis/flow'
import type { Mock } from '@/lib/diagnosis/mock'
import { nextQuestion, questionCount, remainingAfter } from '@/lib/diagnosis/questions'
import { useDiagnosisState } from '@/lib/diagnosis/useDiagnosis'
import { primaryClass, tealClass } from './Buttons'
import { AnswerArt } from './illustrations'
import { BackIcon, CheckIcon, QuestionIcon, RestartIcon, WarnIcon, WaveIcon } from './icons'
import ListenButton from './ListenButton'
import { RoundLink } from './TopBar'

export default function QuestionFlow({ mock, answers: mockAnswers }: { mock?: Mock; answers?: string }) {
  const [view, setRecord] = useDiagnosisState(mock, mockAnswers)
  if (view.status === 'loading') return <Loading />
  if (view.status === 'empty') return <NoDiagnosis />

  const { config, record } = view
  const candidates = record.result.candidates
  const answers = record.answers
  const left = remainingAfter(candidates, answers)
  const q = nextQuestion(candidates, answers)
  const total = questionCount(candidates, answers)
  const outcome = q ? null : left.length === 1 ? 'one' : left.length === 0 ? 'none' : 'many'
  const stepLabel = q ? `প্রশ্ন ${toBnDigits(answers.length + 1)} / ${toBnDigits(total)}` : 'শেষ'

  // Demos keep their answers in the URL; real answers are saved with the diagnosis.
  const update = (next: typeof answers) => {
    const updated = { ...record, answers: next }
    setRecord(updated)
    if (!mock) saveDiagnosis(updated).catch((err) => console.error('Could not save the answer', err))
  }
  const answer = (kind: Answer) => q && update([...answers, { question: q.id, answer: kind }])

  const name = outcome === 'one' ? labelOf(left[0], config) : ''
  const speech = q
    ? q.text
    : outcome === 'one'
      ? `তালিকা ছোট হয়ে একটায় এসেছে: ${name}`
      : outcome === 'none'
        ? 'আপনার উত্তর ছবির সাথে মিলছে না। কৃষি কর্মকর্তাকে দেখানোই ভালো।'
        : 'এখনও নিশ্চিত নই। আন্দাজে ওষুধ না দিয়ে কৃষি কর্মকর্তাকে দেখানোই ভালো।'

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-4">
        <RoundLink href={withMock('/result/uncertain', mock)} label="ফিরে যান">
          <BackIcon />
        </RoundLink>
        <div className="flex flex-col items-center gap-1">
          <h1 className="m-0 font-display text-[19px] font-bold" aria-live="polite">
            {stepLabel}
          </h1>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: Math.max(total, 1) }, (_, i) => (
              <span key={i} className={`h-1.5 w-[26px] rounded-[3px] ${i <= answers.length || !q ? 'bg-sun' : 'bg-line'}`} />
            ))}
          </div>
        </div>
        <ListenButton text={speech} label="প্রশ্নটি আবার শোনান" />
      </header>

      <section className="stitch-lg mx-4 flex shrink-0 flex-col gap-2.5 rounded-[20px] px-3.5 pt-3.5 pb-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-muted">সম্ভাব্য তালিকা</span>
          <span className="text-sm font-bold text-teal" aria-live="polite">
            বাকি {toBnDigits(left.length)}টা
          </span>
        </div>
        <ul className="m-0 flex min-h-[52px] list-none flex-wrap gap-2 p-0">
          {candidates.map((id) => {
            const gone = !left.includes(id)
            return (
              <li
                key={id}
                className={`flex h-11 items-center gap-1.5 rounded-full border-2 px-3.5 text-base font-bold transition-all duration-300 ${
                  gone ? 'border-line bg-sand/60 text-muted' : 'border-sun bg-sun-soft'
                }`}
              >
                <span className={gone ? 'line-through decoration-2' : ''}>{labelOf(id, config)}</span>
                {gone && <span className="rounded-lg bg-danger-soft px-[7px] py-px text-xs font-bold text-[#8A3424]">বাদ</span>}
              </li>
            )
          })}
        </ul>
      </section>

      {q ? (
        <div key={q.id} className="flex flex-1 flex-col gap-3.5 px-4 py-[18px]">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal">
            <WaveIcon size={22} />
            প্রশ্নটা পড়ে শোনানো হচ্ছে
          </div>
          <h2 className="m-0 font-display text-[27px] leading-[1.2] font-extrabold">{q.text}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['yes', q.art.yes, 'হ্যাঁ, আছে'],
                ['no', q.art.no, 'না, নেই'],
              ] as const
            ).map(([kind, art, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => answer(kind)}
                className="flex flex-col items-center gap-2.5 rounded-[20px] border-2 border-ink bg-paper px-2.5 pt-2.5 pb-3.5 text-ink active:bg-sun-soft"
              >
                <AnswerArt kind={art} />
                <span className="font-display text-[21px] font-extrabold">{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => answer('unsure')}
            className="min-h-12 self-center rounded-3xl border-2 border-dashed border-stitch bg-transparent px-[22px] text-base font-bold text-muted-2"
          >
            জানি না
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3.5 px-4 py-[18px]">
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-3xl border-[1.5px] border-line bg-paper px-5 py-[22px] text-center outline-[1.5px] outline-offset-[-9px] outline-stitch outline-dashed">
            {outcome === 'one' ? (
              <>
                <span className="flex size-[72px] items-center justify-center rounded-full bg-leaf-soft text-leaf">
                  <CheckIcon size={40} weight={2.6} />
                </span>
                <span className="text-base font-semibold text-muted">তালিকা ছোট হয়ে একটায় এসেছে</span>
                <span className="font-display text-[40px] leading-[1.1] font-extrabold">{name}</span>
                <span className="max-w-[280px] text-[15px] leading-[1.45]">ছবি আর আপনার উত্তর মিলিয়ে বাছাই করলাম।</span>
              </>
            ) : (
              <>
                <span className="flex size-[72px] items-center justify-center rounded-full bg-amber-soft text-amber">
                  {outcome === 'none' ? <WarnIcon size={40} weight={2.2} /> : <QuestionIcon size={40} weight={2.2} />}
                </span>
                <span className="font-display text-[30px] leading-[1.15] font-extrabold">
                  {outcome === 'none' ? 'উত্তর ছবির সাথে মিলছে না' : 'এখনও নিশ্চিত নই'}
                </span>
                <span className="max-w-[290px] text-[15px] leading-[1.45]">আন্দাজে ওষুধ না দিয়ে কৃষি কর্মকর্তাকে দেখানোই ভালো।</span>
              </>
            )}
          </div>
          {outcome === 'one' ? (
            <Link
              href={withMock('/result', mock, answers)}
              className={`${primaryClass} min-h-[70px] gap-2.5 font-display text-[22px] font-extrabold`}
            >
              ফলাফল ও করণীয় দেখুন
            </Link>
          ) : (
            <button type="button" className={`${tealClass} min-h-[70px] gap-2.5 font-display text-[22px] font-extrabold`}>
              কৃষি কর্মকর্তাকে পাঠান
            </button>
          )}
          <button
            type="button"
            onClick={() => update([])}
            className="flex min-h-12 items-center gap-1.5 self-center border-0 bg-transparent px-5 text-base font-bold text-teal"
          >
            <RestartIcon size={20} weight={2.2} />
            আবার শুরু করুন
          </button>
        </div>
      )}
    </div>
  )
}
