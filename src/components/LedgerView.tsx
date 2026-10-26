'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PrimaryLink, SectionRule } from '@/components/Buttons'
import { CameraIcon, CheckIcon, ClockIcon, OfflineIcon, SprayBottleIcon, WarnIcon } from '@/components/icons'
import ListenButton from '@/components/ListenButton'
import PlantingDays from '@/components/PlantingDays'
import SprayButton from '@/components/SprayButton'
import { bnDate, toBnDigits } from '@/lib/bn'
import { getCases } from '@/lib/captureStore'
import { cropOf, isSeasonId, SEASONS, type SeasonId } from '@/lib/crops'
import { DAY_STATE, formatTaka } from '@/lib/data'
import { LOCAL_TZ, todayIn } from '@/lib/dates'
import { cropOfRecord, PHOTO_SPECS } from '@/lib/diagnosis/crops'
import { mainField, useChosenSeason, useFields } from '@/lib/fields'
import type { Ledger, LedgerWeek, WeekKind } from '@/lib/ledger'
import { caseVerdict } from '@/lib/shareCase'
import { MAX_SPRAY_COST, saveSprayCost } from '@/lib/sprayLog'
import { type LedgerState, useLedger } from '@/lib/useLedger'

const KIND: Record<WeekKind, { icon: React.ReactNode; tone: 'good' | 'bad' | 'plain' }> = {
  saved: { icon: <CheckIcon size={18} weight={2.6} />, tone: 'good' },
  calm: { icon: <CheckIcon size={18} weight={2.6} />, tone: 'plain' },
  onTime: { icon: <SprayBottleIcon size={18} weight={2.2} />, tone: 'good' },
  missed: { icon: <WarnIcon size={18} weight={2.2} />, tone: 'bad' },
  extra: { icon: <SprayBottleIcon size={18} weight={2.2} />, tone: 'plain' },
  ongoing: { icon: <ClockIcon size={18} weight={2.2} />, tone: 'plain' },
  noData: { icon: <OfflineIcon size={18} weight={2.2} />, tone: 'plain' },
}

const TONE = { good: 'bg-leaf-soft text-leaf', bad: 'bg-danger-soft text-danger-deep', plain: 'bg-sand text-muted-2' }

function weekText(w: LedgerWeek): { note: string; action: string } {
  const worst = w.worst ? `ঝুঁকি ${DAY_STATE[w.worst].word}` : 'আবহাওয়ার তথ্য নেই'
  const danger = `${toBnDigits(w.dangerDays)} দিন বিপদ ছিল`
  const sprays = w.sprays.map((d) => bnDate(d).replace(/ \S+$/, '')).join(', ')
  switch (w.kind) {
    case 'saved':
    case 'calm':
      return { note: worst, action: 'স্প্রে লাগেনি' }
    case 'onTime':
      return { note: danger, action: `সময়মতো স্প্রে করেছেন (${sprays})` }
    case 'missed':
      return { note: danger, action: 'স্প্রে করা হয়নি' }
    case 'extra':
      return { note: worst, action: `স্প্রে করেছেন (${sprays}), বিপদ ছিল না` }
    case 'ongoing':
      return { note: `এই সপ্তাহ · ${worst}`, action: 'চলছে' }
    case 'noData':
      return { note: worst, action: 'হিসাব করা গেল না' }
  }
}

const dangerWeeks = (ledger: Ledger) => ledger.onTimeCount + ledger.missedCount

function speechFor(ledger: Ledger, season: SeasonId): string {
  if (!cropOf(season).calendarBaseline) {
    const parts = [`এই মৌসুমে ${toBnDigits(dangerWeeks(ledger))} সপ্তাহে ${cropOf(season).diseaseBn}ের বিপদ ছিল।`]
    parts.push(`${toBnDigits(ledger.onTimeCount)} সপ্তাহে সময়মতো স্প্রে করেছেন, মোট ${toBnDigits(ledger.sprayCount)}টা স্প্রে লেখা আছে।`)
    if (ledger.missedCount) parts.push(`${toBnDigits(ledger.missedCount)} সপ্তাহে বিপদ ছিল কিন্তু স্প্রে লেখা নেই।`)
    return parts.join(' ')
  }
  const parts = [`এই মৌসুমে বাঁচিয়েছেন ${toBnDigits(ledger.savedTotal)} টাকা।`]
  parts.push(`${toBnDigits(ledger.savedCount)}টা অপ্রয়োজনীয় স্প্রে এড়ানো, ${toBnDigits(ledger.onTimeCount)}টা সময়মতো স্প্রে করেছেন।`)
  if (ledger.missedCount) parts.push(`${toBnDigits(ledger.missedCount)} সপ্তাহে বিপদ ছিল কিন্তু স্প্রে লেখা নেই।`)
  return parts.join(' ')
}

function SprayCost({ cost }: { cost: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(cost))
  const n = Number(value)
  const valid = Number.isInteger(n) && n > 0 && n <= MAX_SPRAY_COST

  if (!editing) {
    return (
      <div className="mx-[18px] mt-1.5 flex shrink-0 flex-wrap gap-1.5 text-[13px] text-muted">
        <span>প্রতি স্প্রের খরচ ধরা হয়েছে {formatTaka(cost)} (ওষুধ + মজুরি)</span>
        <button
          type="button"
          onClick={() => {
            setValue(String(cost))
            setEditing(true)
          }}
          className="border-0 bg-transparent p-0 text-[13px] font-bold text-teal underline"
        >
          বদলান
        </button>
      </div>
    )
  }
  return (
    <form
      className="mx-[18px] mt-1.5 flex shrink-0 items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && saveSprayCost(n)) setEditing(false)
      }}
    >
      <label className="flex flex-1 flex-col gap-1 text-[13px] font-semibold text-muted">
        এক বার স্প্রের খরচ (টাকা)
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_SPRAY_COST}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 rounded-[12px] border-2 border-line bg-paper px-3 text-lg font-semibold text-ink"
        />
      </label>
      <button type="submit" disabled={!valid} className="h-12 rounded-[12px] border-0 bg-teal px-4 text-base font-bold text-white disabled:opacity-50">
        রাখুন
      </button>
    </form>
  )
}

type SentCase = { id: number; date: string; verdict: string; uploaded: boolean | undefined }

// The cases this phone sent to the officer, newest first.
function useSentCases(): SentCase[] {
  const [cases, setCases] = useState<SentCase[]>([])
  useEffect(() => {
    let cancelled = false
    getCases()
      .then((records) => {
        if (cancelled) return
        const day = new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL_TZ })
        setCases(
          records
            .map((r) => ({ id: r.id ?? r.sentAt, date: day.format(new Date(r.sentAt)), verdict: caseVerdict(r.diagnosis, PHOTO_SPECS[cropOfRecord(r.diagnosis)]), uploaded: r.uploaded }))
            .reverse(),
        )
      })
      .catch((err) => console.error('Could not read the sent cases', err))
    return () => {
      cancelled = true
    }
  }, [])
  return cases
}

function Prompt({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <section className="stitch-lg mx-4 mt-3.5 flex shrink-0 flex-col gap-2.5 rounded-[20px] p-4">
      <h2 className="m-0 font-display text-[22px] leading-[1.2] font-extrabold">{title}</h2>
      <p className="m-0 text-[15px] leading-[1.45]">{text}</p>
      <PrimaryLink href={href} className="h-14 font-display text-lg font-extrabold">
        {action}
      </PrimaryLink>
    </section>
  )
}

function Weeks({ ledger }: { ledger: Ledger }) {
  return (
    <>
      <SectionRule label="সপ্তাহে সপ্তাহে" className="mx-[18px] mt-4 mb-2" />

      <ol className="m-0 flex shrink-0 list-none flex-col px-[18px]">
        {ledger.weeks.map((w, i) => {
          const last = i === ledger.weeks.length - 1
          const { note, action } = weekText(w)
          return (
            <li key={w.start} className="flex gap-3">
              <div className="flex w-[30px] shrink-0 flex-col items-center">
                <span className={`flex size-[30px] items-center justify-center rounded-full ${TONE[KIND[w.kind].tone]}`}>{KIND[w.kind].icon}</span>
                {!last && <span className="my-[3px] flex-1 border-l-2 border-dashed border-stitch" />}
              </div>
              <div className={`flex flex-1 justify-between gap-2 ${last ? 'pb-1.5' : 'pb-3'}`}>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-muted">
                    দিন {toBnDigits(w.dayFrom)}–{toBnDigits(w.dayTo)} · {note}
                  </span>
                  <span className="text-base font-bold">{action}</span>
                </div>
                {w.amount > 0 && <span className="font-display text-[17px] font-extrabold text-leaf">+{formatTaka(w.amount)}</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

const TOTALS = 'mx-4 mt-3.5 flex shrink-0 flex-col gap-1 rounded-[22px] bg-ink px-[18px] pt-[18px] pb-4 text-cream outline-[1.5px] outline-offset-[-8px] outline-sun outline-dashed'

// For a crop with no calendar habit to compare with (paddy), what the weather asked for and what
// the farmer did, with no money figure.
function DangerTotals({ ledger, season }: { ledger: Ledger; season: SeasonId }) {
  return (
    <section className={TOTALS}>
      <span className="text-[15px] font-medium text-line">এই মৌসুমে {cropOf(season).diseaseBn}ের বিপদ ছিল</span>
      <span className="font-display text-[50px] leading-[1.05] font-extrabold text-sun">{toBnDigits(dangerWeeks(ledger))} সপ্তাহে</span>
      <div className="mt-2 grid grid-cols-2 gap-3 border-t-[1.5px] border-dashed border-[#6E5A45] pt-2.5">
        <div className="flex flex-col">
          <span className="font-display text-2xl font-extrabold text-[#BFE3B4]">{toBnDigits(ledger.onTimeCount)} সপ্তাহ</span>
          <span className="text-sm text-line">সময়মতো স্প্রে করেছেন</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-2xl font-extrabold text-cream">{toBnDigits(ledger.sprayCount)}টা</span>
          <span className="text-sm text-line">মোট স্প্রে লেখা আছে</span>
        </div>
      </div>
    </section>
  )
}

function Body({ state, season }: { state: LedgerState; season: SeasonId }) {
  const crop = cropOf(season)
  if (state.status === 'loading') {
    return <p className="mx-4 mt-6 text-center text-[15px] text-muted">হিসাব করছি…</p>
  }
  if (state.status === 'noPlanting') {
    return (
      <Prompt
        title="হিসাব শুরু করতে রোপণের তারিখ দিন"
        text="কোন ফসল কবে লাগিয়েছেন জানালে, চারা থেকে প্রতি সপ্তাহের আসল আবহাওয়া দেখে হিসাব করব: কোন সপ্তাহে স্প্রে লাগেনি, কোনটায় লেগেছে।"
        href="/planting?from=ledger"
        action="তারিখ দিন"
      />
    )
  }
  if (state.status === 'notYet') {
    return (
      <section className="stitch-lg mx-4 mt-3.5 flex shrink-0 flex-col gap-2 rounded-[20px] p-4">
        <h2 className="m-0 font-display text-[22px] leading-[1.2] font-extrabold">{crop.startPhrase} হিসাব শুরু হবে</h2>
        <p className="m-0 text-[15px] leading-[1.45]">{bnDate(state.from)} থেকে প্রতি সপ্তাহের হিসাব এখানে দেখাব।</p>
      </section>
    )
  }
  if (state.status === 'error') {
    return (
      <p role="alert" className="mx-4 mt-3.5 mb-0 rounded-[16px] bg-amber-soft px-4 py-3 text-[15px] leading-[1.45] font-semibold text-[#6B4A00]">
        আবহাওয়ার তথ্য আনা যায়নি — নেট নেই? নেট এলে হিসাব দেখাব। স্প্রে লিখে রাখা চলবে।
      </p>
    )
  }

  const { ledger, cost } = state
  if (!crop.calendarBaseline) {
    return (
      <>
        <DangerTotals ledger={ledger} season={season} />
        <Weeks ledger={ledger} />
        <p className="mx-[18px] mt-2 mb-0 text-[13px] leading-[1.45] text-muted">
          {crop.nameBn}ে প্রতি সপ্তাহে স্প্রে করার চল নেই, তাই কত টাকা বাঁচল তা হিসাব করি না। শুধু দেখাই কোন সপ্তাহে বিপদ ছিল আর আপনি স্প্রে করেছেন কি না।
        </p>
      </>
    )
  }
  return (
    <>
      <section className={TOTALS}>
        <span className="text-[15px] font-medium text-line">এই মৌসুমে বাঁচিয়েছেন</span>
        <span className="font-display text-[50px] leading-[1.05] font-extrabold text-sun">{formatTaka(ledger.savedTotal)}</span>
        <div className="mt-2 grid grid-cols-2 gap-3 border-t-[1.5px] border-dashed border-[#6E5A45] pt-2.5">
          <div className="flex flex-col">
            <span className="font-display text-2xl font-extrabold text-[#BFE3B4]">{toBnDigits(ledger.savedCount)}টা</span>
            <span className="text-sm text-line">অপ্রয়োজনীয় স্প্রে এড়ানো</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-extrabold text-cream">{toBnDigits(ledger.onTimeCount)}টা</span>
            <span className="text-sm text-line">সময়মতো স্প্রে করেছেন</span>
          </div>
        </div>
      </section>

      <Weeks ledger={ledger} />

      <SprayCost cost={cost} />
      <p className="mx-[18px] mt-2 mb-0 text-[13px] leading-[1.45] text-muted">
        অনেকে প্রতি সপ্তাহে একবার স্প্রে করেন। যে সপ্তাহে বিপদ ছিল না আর আপনি স্প্রে করেননি, সেই সপ্তাহে একটা স্প্রের খরচ বাঁচল।{' '}
        <Link href="/guide#ledger" className="font-semibold text-teal">
          বিস্তারিত
        </Link>
      </p>
    </>
  )
}

function SentCases() {
  const cases = useSentCases()
  if (!cases.length) return null
  return (
    <>
      <SectionRule label="কর্মকর্তাকে পাঠানো ছবি" className="mx-[18px] mt-4 mb-2" />
      <ul className="m-0 flex shrink-0 list-none flex-col gap-2 px-[18px]">
        {cases.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-mist text-teal">
              <CameraIcon size={18} weight={2.2} />
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-muted">
                {bnDate(c.date)}
                {c.uploaded === false && ' · কর্মকর্তার তালিকায় এখনো যায়নি'}
              </span>
              <span className="text-base font-bold">{c.verdict}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

// One field's ledger: `start` (?field=) picks it, else the field Home last showed; a chip per field switches.
export default function LedgerView({ place, start }: { place: string; start: string | null }) {
  const fields = useFields()
  const chosen = useChosenSeason()
  const [picked, setPicked] = useState<SeasonId | null>(isSeasonId(start) ? start : null)
  const field = fields.find((f) => f.season === picked) ?? mainField(fields, todayIn(), chosen)
  const season = field?.season ?? 'potato'
  const state = useLedger(field)
  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2 pt-4 pr-4 pl-[18px]">
        <div className="flex min-w-0 flex-col leading-[1.2]">
          <h1 className="m-0 font-display text-[25px] font-extrabold">মৌসুমের হিসাব</h1>
          <span className="text-sm font-medium text-muted">
            {SEASONS[season].nameBn} · {place} · <PlantingDays field={field} />
          </span>
        </div>
        {state.status === 'ready' && <ListenButton text={speechFor(state.ledger, season)} label="হিসাব পড়ে শোনান" />}
      </header>

      {fields.length > 1 && (
        <div role="group" aria-label="কোন জমির হিসাব" className="mx-4 mt-3 flex shrink-0 gap-2">
          {fields.map((f) => (
            <button
              key={f.season}
              type="button"
              aria-pressed={f.season === season}
              onClick={() => setPicked(f.season)}
              className={`h-11 flex-1 rounded-full border-2 px-3 text-base font-bold ${
                f.season === season ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'
              }`}
            >
              {SEASONS[f.season].nameBn}
            </button>
          ))}
        </div>
      )}

      <Body state={state} season={season} />

      {state.status !== 'noPlanting' && state.status !== 'loading' && (
        <div className="mx-4 mt-3 shrink-0">
          <SprayButton season={season} className="w-full" />
        </div>
      )}

      <SentCases />
    </>
  )
}
