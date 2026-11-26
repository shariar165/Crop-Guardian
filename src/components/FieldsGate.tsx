'use client'

import Link from 'next/link'
import { createContext, useContext, useEffect } from 'react'
import { bnDate } from '@/lib/bn'
import { type CropId, CROPS, cropOf, SEASONS, type SeasonId } from '@/lib/crops'
import { type Risk, RISK_VIEW } from '@/lib/data'
import { useHydrated } from '@/lib/deviceStore'
import { canDiagnose } from '@/lib/diagnosis/crops'
import { chooseSeason, type Field, mainField, useChosenSeason, useFields } from '@/lib/fields'
import { rememberPlaceName } from '@/lib/placeCookies'
import { offSeasonMessage, riskActive, seasonFor } from '@/lib/season'
import HomeHeader from './HomeHeader'
import { PinIcon } from './icons'
import LedgerPill from './LedgerPill'

// Home's parts for one crop, rendered on the server from that crop's rule.
export type CropPanels = { risk: Risk; header: React.ReactNode; strip: React.ReactNode; decision: React.ReactNode }

// The season whose risk Home is showing, for the spray button inside the server-rendered decision.
const ShownSeason = createContext<SeasonId>('potato')
export const useShownSeason = () => useContext(ShownSeason)

type Candidate = { season: SeasonId; planted: string | null }

const RANK: Record<Risk, number> = { safe: 0, watch: 1, danger: 2 }

/*
 * Shows Home's risk (rendered on the server for every crop) for the fields on this device that are
 * in the field today. Several in season get a chip each; the farmer's last choice is kept, else the
 * riskiest is shown. The server can't read the fields, so it renders as if none is set (the usual
 * potato season, as before fields); the real fields take over right after hydration.
 */
export default function FieldsGate({
  today,
  place,
  hasUnion,
  panels,
}: {
  today: string
  place: string
  hasUnion: boolean
  panels: Record<CropId, CropPanels>
}) {
  const hydrated = useHydrated()
  const fields = useFields()
  // Lets a case sent from the phone name the place (src/lib/shareCase.ts).
  useEffect(() => {
    if (hasUnion) rememberPlaceName(place)
  }, [hasUnion, place])
  const chosen = useChosenSeason()
  const candidates: Candidate[] = fields.length ? fields : [{ season: 'potato', planted: null }]
  const active = candidates.filter((f) => riskActive(seasonFor(today, f.planted, f.season)))
  const riskOf = (f: Candidate) => RANK[panels[SEASONS[f.season].crop].risk]
  const shown = active.find((f) => f.season === chosen) ?? [...active].sort((a, b) => riskOf(b) - riskOf(a))[0]

  if (shown) {
    const p = panels[SEASONS[shown.season].crop]
    const field = fields.find((f) => f.season === shown.season) ?? null
    return (
      <ShownSeason.Provider value={shown.season}>
        {p.header}
        {!hasUnion && <SetupCard hasField={field !== null} />}
        {hydrated && active.length > 1 && <FieldChips seasons={active.map((f) => f.season)} shown={shown.season} />}
        {p.strip}
        {hasUnion && <FieldNote field={field} many={fields.length > 1} />}
        {p.decision}
        <LedgerPill field={field} hidePlantingPrompt={!hasUnion} />
      </ShownSeason.Provider>
    )
  }
  const main = mainField(fields, today, chosen)
  const off: Candidate = main ?? candidates[0]
  return (
    <>
      <OffSeasonHeader season={off.season} planted={off.planted} today={today} place={place} />
      {hasUnion ? <FieldNote field={main} many={fields.length > 1} /> : <SetupCard hasField={main !== null} />}
      <LedgerPill field={main} hidePlantingPrompt={!hasUnion} />
    </>
  )
}

function FieldChips({ seasons, shown }: { seasons: SeasonId[]; shown: SeasonId }) {
  return (
    <div role="group" aria-label="কোন জমির ঝুঁকি দেখবেন" className="mx-4 mt-3 flex shrink-0 gap-2">
      {seasons.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={s === shown}
          onClick={() => chooseSeason(s)}
          className={`h-11 flex-1 rounded-full border-2 px-3 text-base font-bold ${
            s === shown ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'
          }`}
        >
          {SEASONS[s].nameBn}
        </button>
      ))}
    </div>
  )
}

function OffSeasonHeader({ season: id, planted, today, place }: { season: SeasonId; planted: string | null; today: string; place: string }) {
  const title = cropOf(id).offSeasonTitle
  const message = offSeasonMessage(seasonFor(today, planted, id), id)
  return (
    <HomeHeader view={RISK_VIEW.safe} place={place} speech={`${place}। ${title}। ${message}।`}>
      <h1 className="m-0 font-display text-[26px] leading-[1.15] font-extrabold">{title}</h1>
      <span className="text-[15px] leading-[1.4] font-medium">{message}</span>
    </HomeHeader>
  )
}

// Until a union is chosen, the one prompt for setup, right under the header: the risk above it is
// only the default upazila's, shown as an example.
function SetupCard({ hasField }: { hasField: boolean }) {
  return (
    <Link
      href="/planting"
      className="mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-[18px] border-2 border-sun bg-sun-soft px-4 py-3 text-ink no-underline"
    >
      <PinIcon size={28} weight={2.2} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-[17px] leading-[1.3] font-extrabold">
          {hasField ? 'আপনার এলাকা জানান' : 'আপনার এলাকা আর ফসল জানান'} <span className="whitespace-nowrap">— ১ মিনিট</span>
        </span>
        <span className="text-[14px] leading-[1.35] font-medium">ওপরের ঝুঁকি শুধু উদাহরণ</span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-2xl font-bold text-teal">
        ›
      </span>
    </Link>
  )
}

// Asks for a field, or shows the field's date with a way to change it.
function FieldNote({ field, many }: { field: Field | null; many: boolean }) {
  if (!field) {
    return (
      <Link
        href="/planting"
        className="mx-4 mt-2 flex shrink-0 items-center justify-between gap-2 rounded-[14px] bg-sun-soft px-3.5 py-2 text-base leading-[1.35] font-semibold text-ink no-underline"
      >
        কোন ফসল কবে লাগিয়েছেন? জানালে ঝুঁকি আরও ঠিক হবে
        <span className="shrink-0 text-teal">জানান</span>
      </Link>
    )
  }
  return (
    <Link href="/planting" className="mx-4 mt-2 shrink-0 self-center text-base font-semibold text-muted no-underline">
      {many ? `${SEASONS[field.season].nameBn} ` : ''}রোপণ: {bnDate(field.planted)} · <span className="text-teal underline">বদলান</span>
    </Link>
  )
}

// Under a decision: "পরীক্ষামূলক" while the crop's rule is not checked against real outbreaks, and
// a word that leaf photos can't diagnose this crop yet.
export function ExperimentalNote({ crop }: { crop: CropId }) {
  const { experimental, diseaseOfBn } = CROPS[crop]
  const photoNote = canDiagnose(crop) ? null : CROPS[crop].photoNote
  if (!experimental && !photoNote) return null
  return (
    <p className="m-0 text-sm leading-[1.4] font-semibold text-amber">
      {experimental && `পরীক্ষামূলক: ${diseaseOfBn} এই হিসাব এখনো মাঠে যাচাই হয়নি। `}
      {photoNote}
    </p>
  )
}
