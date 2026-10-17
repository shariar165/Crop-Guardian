'use client'

import Link from 'next/link'
import { bnDate } from '@/lib/bn'
import { RISK_VIEW } from '@/lib/data'
import { usePlantingDate } from '@/lib/plantingDate'
import { offSeasonMessage, riskActive, seasonFor, type Season } from '@/lib/season'
import HomeHeader from './HomeHeader'

const OFF_SEASON_TITLE = 'এখন ধসা রোগের মৌসুম নয়'

/*
 * Shows Home's risk (rendered on the server) only while the crop is in the field, using the
 * planting date saved on this device. The server can't read it, so it renders as if none is
 * set; the real date takes over right after hydration.
 */
export default function SeasonGate({
  today,
  bypass,
  header,
  strip,
  demoNav,
  decision,
}: {
  today: string
  bypass: boolean
  header: React.ReactNode
  strip: React.ReactNode
  demoNav: React.ReactNode
  decision: React.ReactNode
}) {
  const planting = usePlantingDate()
  const season = seasonFor(today, planting)
  const note = bypass ? null : <PlantingNote planting={planting} />

  if (riskActive(season, bypass)) {
    return (
      <>
        {header}
        {strip}
        {demoNav}
        {note}
        {decision}
      </>
    )
  }
  return (
    <>
      <OffSeasonHeader season={season} />
      {demoNav}
      {note}
    </>
  )
}

function OffSeasonHeader({ season }: { season: Season }) {
  const message = offSeasonMessage(season)
  return (
    <HomeHeader view={RISK_VIEW.safe} speech={`বগুড়া, শিবগঞ্জ। ${OFF_SEASON_TITLE}। ${message}।`}>
      <h1 className="m-0 font-display text-[26px] leading-[1.15] font-extrabold">{OFF_SEASON_TITLE}</h1>
      <span className="text-[15px] leading-[1.4] font-medium">{message}</span>
    </HomeHeader>
  )
}

// Asks for the planting date, or shows it with a way to change it.
function PlantingNote({ planting }: { planting: string | null }) {
  if (!planting) {
    return (
      <Link
        href="/planting"
        className="mx-4 mt-2 flex shrink-0 items-center justify-between gap-2 rounded-[14px] bg-sun-soft px-3.5 py-2 text-[14px] leading-[1.35] font-semibold text-ink no-underline"
      >
        আলু কবে লাগিয়েছেন? তারিখ দিলে ঝুঁকি আরও ঠিক হবে
        <span className="shrink-0 text-teal">তারিখ দিন</span>
      </Link>
    )
  }
  return (
    <Link href="/planting" className="mx-4 mt-2 shrink-0 self-center text-[13px] font-semibold text-muted no-underline">
      রোপণ: {bnDate(planting)} · <span className="text-teal underline">বদলান</span>
    </Link>
  )
}
