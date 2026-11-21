'use client'

import { SectionRule, tealClass } from '@/components/Buttons'
import CapturedThumb from '@/components/CapturedThumb'
import { Loading, NoDiagnosis, ValidationBadge, WhyCard } from '@/components/DiagnosisParts'
import { CheckIcon, DocIcon, HomeIcon, PersonIcon, WarnIcon } from '@/components/icons'
import { CandidateThumb } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import OfficerShareButton from '@/components/OfficerShareButton'
import TopBar, { RoundLink } from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { useEffect } from 'react'
import { CROPS } from '@/lib/crops'
import { dateOf } from '@/lib/dates'
import { store } from '@/lib/deviceStore'
import { contentOf, sourceOf } from '@/lib/diagnosis/content'
import { CONFIDENCE_WORD, labelOf } from '@/lib/diagnosis/explain'
import { finalOf } from '@/lib/diagnosis/flow'
import { answerLine } from '@/lib/diagnosis/questions'
import { useDiagnosis } from '@/lib/diagnosis/useDiagnosis'
import { FOLLOW_UP_KEY } from '@/lib/followUp'

const BANNER = {
  danger: 'bg-danger-soft text-[#7E2A1C]',
  watch: 'bg-amber-soft text-[#6B4A00]',
  ok: 'bg-leaf-soft text-[#24502C]',
}

// A result that isn't healthy asks Home to remind the farmer to look again (src/lib/followUp.ts),
// dated from the diagnosis, so opening the result again later doesn't move the reminder.
function useFollowUp(view: ReturnType<typeof useDiagnosis>) {
  const ready = view.status === 'ready' ? view : null
  const final = ready ? finalOf(ready.record) : null
  const due = ready && final && contentOf(ready.crop, final.id)?.banner.tone !== 'ok'
  const value = due ? JSON.stringify({ crop: ready.crop, id: final.id, date: dateOf(ready.record.createdAt) }) : null
  useEffect(() => {
    if (value) store(FOLLOW_UP_KEY, value)
  }, [value])
  return due
}

export default function ResultView() {
  const view = useDiagnosis()
  const followUp = useFollowUp(view)
  if (view.status === 'loading') return <Loading />
  if (view.status === 'empty') return <NoDiagnosis />

  const { crop, config, record } = view
  // useDiagnosis only shows this screen when there is a final answer.
  const final = finalOf(record)!
  const name = labelOf(final.id, config)
  // The tests check every class of every diagnosable crop has advice.
  const content = contentOf(crop, final.id)!
  const source = sourceOf(crop, final.id)
  // Narrowing by the farmer's answers isn't calibrated like the model, so it isn't called "sure".
  const word = final.via === 'model' ? CONFIDENCE_WORD.confident : 'ছবি আর আপনার উত্তর মিলিয়ে'
  const speech =
    `${word}: ${name}। ${content.banner.text}। এখন কী করবেন: ` +
    content.steps.map((s, i) => `${toBnDigits(i + 1)}. ${s}।`).join(' ')

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        back="/camera"
        title="ফলাফল"
        height={60}
        right={
          <RoundLink href="/" label="হোমে যান">
            <HomeIcon size={22} weight={2.2} />
          </RoundLink>
        }
      />

      <div className="flex shrink-0 flex-col gap-1.5 px-[18px]">
        <span
          className={`flex h-8 items-center gap-1.5 self-start rounded-2xl px-3 text-[15px] font-bold ${
            final.via === 'model' ? 'bg-leaf text-white' : 'bg-sun text-ink'
          }`}
        >
          <CheckIcon size={18} weight={2.8} />
          {word}
        </span>
        <h1 className="m-0 font-display text-[42px] leading-[1.05] font-extrabold">{name}</h1>
        <span className="text-[15px] font-medium text-muted">{content.en} · {CROPS[crop].nameBn}</span>
        <div
          role={content.banner.tone === 'ok' ? 'status' : 'alert'}
          className={`mt-1 flex items-center gap-2 rounded-[14px] px-3 py-[9px] text-[15px] font-bold ${BANNER[content.banner.tone]}`}
        >
          {content.banner.tone === 'ok' ? <CheckIcon size={22} weight={2.4} /> : <WarnIcon size={22} weight={2.2} />}
          {content.banner.text}
        </div>
        <ValidationBadge crop={crop} sample={record.sample} className="mt-1" />
      </div>

      {/* The farmer's leaf next to a drawing of the disease, so they can compare for themselves. */}
      <section className="mx-4 mt-4 flex shrink-0 flex-col gap-2">
        <SectionRule label="এমন দেখায়" />
        <div className="flex items-start gap-3">
          <figure className="m-0 flex flex-col items-center gap-1">
            <div className="stitch relative flex size-24 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[18px] bg-[#1F2A17]!">
              <CapturedThumb />
            </div>
          </figure>
          <figure className="m-0 flex flex-col items-center gap-1">
            <CandidateThumb crop={crop} id={final.id} className="size-24" />
            <figcaption className="text-sm font-semibold text-muted">আঁকা ছবি: {name}</figcaption>
          </figure>
        </div>
        <p className="m-0 text-[15px] leading-[1.4]">{content.sign}</p>
      </section>

      <WhyCard
        crop={crop}
        record={record}
        config={config}
        answers={record.answers.flatMap((a) => answerLine(a, crop) ?? [])}
      />

      <section className="mx-4 mt-4 flex shrink-0 flex-col gap-2.5">
        <h2 className="m-0 font-display text-lg font-bold">এখন কী করবেন</h2>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {content.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sun font-display text-[17px] font-extrabold">
                {toBnDigits(i + 1)}
              </span>
              <span className="pt-[3px] text-base leading-[1.4]">{s}</span>
            </li>
          ))}
        </ol>
        {followUp && <p className="m-0 text-[15px] font-semibold text-teal">৫ দিন পর হোমে মনে করিয়ে দেব।</p>}
      </section>

      <a
        href={source.href}
        target="_blank"
        rel="noreferrer"
        className="mx-4 mt-3.5 flex min-h-11 shrink-0 items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-stitch px-3 text-sm font-semibold text-teal no-underline"
      >
        <DocIcon size={20} />
        {source.label}
      </a>

      <div className="min-h-4 flex-1" />

      <div className="grid shrink-0 grid-cols-[2fr_3fr] gap-2.5 px-4 pb-[18px]">
        <ListenButton text={speech} label="ফলাফল পড়ে শোনান" variant="outline" />
        <OfficerShareButton
          record={record}
          config={config}
          className={`${tealClass} min-h-[66px] gap-2 px-2.5 text-[17px] font-bold`}
        >
          <PersonIcon size={24} />
          কৃষি কর্মকর্তাকে দেখান
        </OfficerShareButton>
      </div>
    </div>
  )
}
