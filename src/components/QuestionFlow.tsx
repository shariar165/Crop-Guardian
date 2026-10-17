'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toBnDigits } from '@/lib/bn'
import { CANDIDATES, type CandidateId } from '@/lib/data'
import { primaryClass, tealClass } from './Buttons'
import { AnswerArt } from './illustrations'
import { BackIcon, CheckIcon, QuestionIcon, RestartIcon, WaveIcon } from './icons'
import ListenButton from './ListenButton'
import { RoundLink } from './TopBar'

type Answer = 'yes' | 'no' | 'unsure'
type State = { step: 0 | 1; out: Partial<Record<CandidateId, true>>; done: boolean }

const INITIAL: State = { step: 0, out: {}, done: false }

const QUESTIONS = [
  {
    text: 'দাগের ভেতরে কি চাকতির মতো গোল গোল রিং আছে?',
    yesArt: 'rings',
    noArt: 'plain',
  },
  {
    text: 'পাতা উল্টে দেখুন: নিচে কি সাদা তুলার মতো কিছু আছে?',
    yesArt: 'spores',
    noArt: 'noSpores',
  },
] as const

/* Each answer rules candidates out ("out"); same logic as the design prototype. */
function reduce(s: State, kind: Answer): State {
  const out = { ...s.out }
  if (s.step === 0) {
    if (kind === 'yes') {
      out.late = true
      out.nutri = true
      return { step: 0, out, done: true }
    }
    if (kind === 'no') out.early = true
    return { step: 1, out, done: false }
  }
  if (kind === 'yes') {
    out.early = true
    out.nutri = true
  } else if (kind === 'no') {
    out.late = true
  }
  return { step: 1, out, done: true }
}

export default function QuestionFlow() {
  const [state, setState] = useState<State>(INITIAL)
  const answer = (kind: Answer) => setState((s) => reduce(s, kind))

  const chips = CANDIDATES.map((c) => ({ ...c, gone: !!state.out[c.id] }))
  const left = chips.filter((c) => !c.gone)
  const one = state.done && left.length === 1
  const stepLabel = state.done ? 'শেষ' : state.step === 0 ? 'প্রশ্ন ১ / ২' : 'প্রশ্ন ২ / ২'
  const q = QUESTIONS[state.step]

  const speech = state.done
    ? one
      ? `তালিকা ছোট হয়ে একটায় এসেছে: ${left[0].name}`
      : 'এখনও নিশ্চিত নই। আন্দাজে ওষুধ না দিয়ে কৃষি কর্মকর্তাকে দেখানোই ভালো।'
    : q.text

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-4">
        <RoundLink href="/result/uncertain" label="ফিরে যান">
          <BackIcon />
        </RoundLink>
        <div className="flex flex-col items-center gap-1">
          <h1 className="m-0 font-display text-[19px] font-bold" aria-live="polite">
            {stepLabel}
          </h1>
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-[26px] rounded-[3px] bg-sun" />
            <span className={`h-1.5 w-[26px] rounded-[3px] ${state.step >= 1 || state.done ? 'bg-sun' : 'bg-line'}`} />
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
          {chips.map((c) => (
            <li
              key={c.id}
              className={`flex h-11 items-center gap-1.5 rounded-full border-2 px-3.5 text-base font-bold transition-all duration-300 ${
                c.gone ? 'border-line bg-sand/60 text-muted' : 'border-sun bg-sun-soft'
              }`}
            >
              <span className={c.gone ? 'line-through decoration-2' : ''}>{c.name}</span>
              {c.gone && (
                <span className="rounded-lg bg-danger-soft px-[7px] py-px text-xs font-bold text-[#8A3424]">বাদ</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {!state.done ? (
        <div key={state.step} className="flex flex-1 flex-col gap-3.5 px-4 py-[18px]">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal">
            <WaveIcon size={22} />
            প্রশ্নটা পড়ে শোনানো হচ্ছে
          </div>
          <h2 className="m-0 font-display text-[27px] leading-[1.2] font-extrabold">{q.text}</h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['yes', q.yesArt, 'হ্যাঁ, আছে'],
                ['no', q.noArt, 'না, নেই'],
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
            {one ? (
              <>
                <span className="flex size-[72px] items-center justify-center rounded-full bg-leaf-soft text-leaf">
                  <CheckIcon size={40} weight={2.6} />
                </span>
                <span className="text-base font-semibold text-muted">তালিকা ছোট হয়ে একটায় এসেছে</span>
                <span className="font-display text-[40px] leading-[1.1] font-extrabold">{left[0].name}</span>
                <span className="max-w-[280px] text-[15px] leading-[1.45]">ছবি, আবহাওয়া আর আপনার উত্তর মিলিয়ে নিশ্চিত হলাম।</span>
              </>
            ) : (
              <>
                <span className="flex size-[72px] items-center justify-center rounded-full bg-amber-soft text-amber">
                  <QuestionIcon size={40} weight={2.2} />
                </span>
                <span className="font-display text-[30px] leading-[1.15] font-extrabold">এখনও নিশ্চিত নই</span>
                <span className="max-w-[290px] text-[15px] leading-[1.45]">আন্দাজে ওষুধ না দিয়ে কৃষি কর্মকর্তাকে দেখানোই ভালো।</span>
              </>
            )}
          </div>
          {one ? (
            <Link href="/result" className={`${primaryClass} min-h-[70px] gap-2.5 font-display text-[22px] font-extrabold`}>
              ফলাফল ও করণীয় দেখুন
            </Link>
          ) : (
            <Link href="/unknown" className={`${tealClass} min-h-[70px] gap-2.5 font-display text-[22px] font-extrabold`}>
              কৃষি কর্মকর্তাকে পাঠান
            </Link>
          )}
          <button
            type="button"
            onClick={() => setState(INITIAL)}
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
