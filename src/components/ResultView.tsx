'use client'

import { tealClass } from '@/components/Buttons'
import { Loading, NoDiagnosis, ValidationBadge, WhyCard } from '@/components/DiagnosisParts'
import { CheckIcon, DocIcon, HomeIcon, PersonIcon, WarnIcon } from '@/components/icons'
import ListenButton from '@/components/ListenButton'
import TopBar, { RoundLink } from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { ADVICE_SOURCE, CLASS_CONTENT } from '@/lib/diagnosis/content'
import { CONFIDENCE_WORD, labelOf } from '@/lib/diagnosis/explain'
import type { Mock } from '@/lib/diagnosis/mock'
import { useDiagnosis } from '@/lib/diagnosis/useDiagnosis'

const BANNER = {
  danger: 'bg-danger-soft text-[#7E2A1C]',
  watch: 'bg-amber-soft text-[#6B4A00]',
  ok: 'bg-leaf-soft text-[#24502C]',
}

export default function ResultView({ mock }: { mock?: Mock }) {
  const view = useDiagnosis(mock)
  if (view.status === 'loading') return <Loading />
  if (view.status === 'empty') return <NoDiagnosis />

  const { config, record } = view
  const id = record.result.candidates[0]
  const name = labelOf(id, config)
  const content = CLASS_CONTENT[id]
  const word = CONFIDENCE_WORD.confident
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
        <span className="flex h-8 items-center gap-1.5 self-start rounded-2xl bg-leaf px-3 text-[15px] font-bold text-white">
          <CheckIcon size={18} weight={2.8} />
          {word}
        </span>
        <h1 className="m-0 font-display text-[42px] leading-[1.05] font-extrabold">{name}</h1>
        <span className="text-[15px] font-medium text-muted">{content.en} · আলু</span>
        <div
          role={content.banner.tone === 'ok' ? 'status' : 'alert'}
          className={`mt-1 flex items-center gap-2 rounded-[14px] px-3 py-[9px] text-[15px] font-bold ${BANNER[content.banner.tone]}`}
        >
          {content.banner.tone === 'ok' ? <CheckIcon size={22} weight={2.4} /> : <WarnIcon size={22} weight={2.2} />}
          {content.banner.text}
        </div>
        <ValidationBadge className="mt-1" />
      </div>

      <WhyCard record={record} config={config} photos={!mock} />

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
      </section>

      <a
        href={ADVICE_SOURCE.href}
        target="_blank"
        rel="noreferrer"
        className="mx-4 mt-3.5 flex min-h-11 shrink-0 items-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-stitch px-3 text-sm font-semibold text-teal no-underline"
      >
        <DocIcon size={20} />
        {ADVICE_SOURCE.label}
      </a>

      <div className="min-h-4 flex-1" />

      <div className="grid shrink-0 grid-cols-[2fr_3fr] gap-2.5 px-4 pb-[18px]">
        <ListenButton text={speech} label="ফলাফল পড়ে শোনান" variant="outline" />
        <button type="button" className={`${tealClass} min-h-[66px] gap-2 px-2.5 text-[17px] font-bold`}>
          <PersonIcon size={24} />
          কৃষি কর্মকর্তাকে দেখান
        </button>
      </div>
    </div>
  )
}
