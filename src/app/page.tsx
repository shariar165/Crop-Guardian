import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { outlineClass, PrimaryLink } from '@/components/Buttons'
import FieldsGate, { type CropPanels, ExperimentalNote } from '@/components/FieldsGate'
import FirstRunIntro from '@/components/FirstRunIntro'
import HomeHeader from '@/components/HomeHeader'
import { BookIcon, CameraIcon, OfflineIcon, SprayIcon, WarnIcon } from '@/components/icons'
import { DayGlyph } from '@/components/illustrations'
import LedgerPill from '@/components/LedgerPill'
import SprayButton from '@/components/SprayButton'
import { CROP_IDS, type CropId, CROPS } from '@/lib/crops'
import { DAY_STATE, RISK_VIEW } from '@/lib/data'
import { viewerHasAlerts } from '@/lib/alertDb'
import { bnWeekday } from '@/lib/bn'
import { todayIn } from '@/lib/dates'
import { getPlace } from '@/lib/place'
import { buildDecision, type RiskAssessment } from '@/lib/risk'
import { fetchHourlyForecast, type HourlyForecast } from '@/lib/weather'

// The live forecast at the farmer's place, or null when it can't be fetched. Never a made-up one.
async function loadForecast(lat: number, lon: number): Promise<HourlyForecast | null> {
  try {
    return await fetchHourlyForecast(lat, lon)
  } catch (err) {
    console.error('Live risk unavailable:', err)
    return null
  }
}

// Every crop's risk from the one forecast, or null if any rule can't read it.
function assessAll(hourly: HourlyForecast): Record<CropId, RiskAssessment> | null {
  try {
    const today = todayIn()
    return Object.fromEntries(CROP_IDS.map((c) => [c, CROPS[c].assess(hourly, today)])) as Record<CropId, RiskAssessment>
  } catch (err) {
    console.error('Live risk unavailable:', err)
    return null
  }
}

// Shown in place of the risk when the forecast can't be fetched.
function NoForecast({ place }: { place: string }) {
  return (
    <section role="alert" className="stitch-lg mx-4 mt-4 flex shrink-0 flex-col gap-2 rounded-[20px] p-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-muted">
        <OfflineIcon size={20} />
        {place}
      </span>
      <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">আবহাওয়ার তথ্য আনা যায়নি</h1>
      <p className="m-0 text-[15px] leading-[1.45]">
        নেট নেই, বা আবহাওয়ার খবর এখন আসছে না। তাই আজকের ঝুঁকি বলতে পারছি না। পাতার ছবি তুলে রোগ চেনা নেট ছাড়াও চলে।
      </p>
      <Link href="/" className="text-[15px] font-semibold text-teal">
        আবার চেষ্টা করুন
      </Link>
    </section>
  )
}

// Home's header, 5-day strip and decision for one crop. `alerts`: the viewer gets SMS alerts.
function cropPanels(crop: CropId, live: RiskAssessment, place: string, alerts: boolean): CropPanels {
  const spec = CROPS[crop]
  const { today: risk, reason } = live
  const view = RISK_VIEW[risk]
  const days = live.days.map((d, i) => ({ ...d, name: i === 0 ? 'আজ' : bnWeekday(d.date), ...DAY_STATE[d.risk] }))
  const decision = buildDecision(live.days, risk, spec.decision, alerts)
  // A danger day ahead asks the farmer to look again; SMS alerts would save them the trouble.
  const offerAlerts = !alerts && decision !== spec.decision[risk]
  const speech = [`${place}। ${spec.riskTitle}:`, view.word + '।', reason + '।', view.title + '।', decision].join(' ')

  return {
    risk,
    header: (
      <HomeHeader view={view} place={place} speech={speech}>
        <span className="text-[15px] font-medium">{spec.riskTitle}</span>
        <div
          className="flex items-center gap-2 self-start rounded-[14px] pt-1 pr-4 pb-0.5 pl-3"
          style={{ background: view.badgeBg, color: view.badgeInk }}
        >
          <WarnIcon size={26} weight={2.4} />
          <span className="font-display text-[34px] leading-[1.15] font-extrabold">{view.word}</span>
        </div>
        <span className="text-[15px] leading-[1.4] font-medium">{reason}</span>
      </HomeHeader>
    ),
    strip: (
      <section aria-label="৫ দিনের পূর্বাভাস" className="stitch mx-4 mt-3.5 grid shrink-0 grid-cols-5 gap-1 rounded-[18px] px-2.5 py-3">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-[3px]">
            <span className="text-[13px] font-semibold">{d.name}</span>
            <DayGlyph risk={d.risk} />
            <span className="text-xs font-bold" style={{ color: d.color }}>
              {d.word}
            </span>
          </div>
        ))}
      </section>
    ),
    decision: (
      <section className="stitch-lg mx-4 mt-2 flex shrink-0 items-start gap-3.5 rounded-[20px] p-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full"
          style={{ background: view.accentSoft, color: view.accent }}
        >
          <SprayIcon size={32} crossed={view.noSpray} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-semibold text-muted">আজকের সিদ্ধান্ত</span>
          <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">{view.title}</h1>
          <p className="m-0 text-[15px] leading-[1.45]">{decision}</p>
          <ExperimentalNote crop={crop} />
          {offerAlerts && (
            <Link href="/account" className="mt-0.5 text-[15px] font-semibold text-teal">
              SMS-এ খবর পেতে চাইলে →
            </Link>
          )}
          <Link href="/guide#risk" className="mt-0.5 text-[15px] font-semibold text-teal">
            কেন এই পরামর্শ?
          </Link>
          {risk === 'danger' && <SprayButton className="mt-1.5 self-start" />}
        </div>
      </section>
    ),
  }
}

// Today's live risk at the farmer's union (or the upazila) for each field in season (see FieldsGate).
export default async function Home() {
  const [place, alerts] = await Promise.all([getPlace(), viewerHasAlerts()])
  const hourly = await loadForecast(place.lat, place.lon)
  const live = hourly && assessAll(hourly)

  let gate: React.ReactNode
  if (!live) {
    gate = (
      <>
        <NoForecast place={place.name} />
        <LedgerPill />
      </>
    )
  } else {
    const panels = Object.fromEntries(CROP_IDS.map((c) => [c, cropPanels(c, live[c], place.name, alerts)])) as Record<CropId, CropPanels>
    gate = <FieldsGate today={todayIn()} place={place.name} hasUnion={place.union !== null} panels={panels} />
  }

  return (
    <div className="flex flex-1 flex-col">
      {gate}

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2.5 px-4 pb-3.5">
        <PrimaryLink href="/camera" className="h-[70px] gap-3">
          <CameraIcon size={30} weight={2.2} />
          <span className="font-display text-[23px] font-extrabold">পাতার ছবি তুলুন</span>
        </PrimaryLink>
        <Link href="/guide" className={`${outlineClass} h-[58px] gap-2.5 text-lg font-bold`}>
          <BookIcon size={24} weight={2.2} />
          কীভাবে ব্যবহার করবেন
        </Link>
        <div className="flex justify-center gap-5">
          <Link href="/potato" className="text-[15px] font-bold text-teal">
            আলু চাষের পরামর্শ →
          </Link>
          <Link href="/ask" className="text-[15px] font-bold text-teal">
            প্রশ্ন করুন →
          </Link>
        </div>
      </div>

      <BottomNav />
      <FirstRunIntro />
    </div>
  )
}
