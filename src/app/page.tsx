import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { outlineClass, PrimaryLink } from '@/components/Buttons'
import HomeHeader from '@/components/HomeHeader'
import { CameraIcon, CheckIcon, MicIcon, SprayIcon, WarnIcon } from '@/components/icons'
import { DayGlyph } from '@/components/illustrations'
import SeasonGate from '@/components/SeasonGate'
import { DAY_STATE, FORECAST, formatTaka, parseReplay, parseRiskOverride, REPLAY_DEMO_DATE, RISK_VIEW, RISKS, SAVED_COUNT, SAVED_TOTAL } from '@/lib/data'
import type { Risk } from '@/lib/data'
import { bnDate, bnWeekday, toBnDigits } from '@/lib/bn'
import { assessRisk, buildDecision, DECISION, summarizeDays } from '@/lib/risk'
import type { StripDay } from '@/lib/risk'
import { addDays, isIsoDate, todayIn } from '@/lib/dates'
import { DEFAULT_LOCATION, FORECAST_DAYS, fetchHourlyArchive, fetchHourlyForecast } from '@/lib/weather'

const STALE_NOTE = 'পুরনো তথ্য — নেট নেই'

type HomeData = { risk: Risk; days: StripDay[]; sub: string; stale: boolean }

function sampleData(risk: Risk): HomeData {
  const today = todayIn()
  return {
    risk,
    days: FORECAST[risk].map((r, i) => ({ date: addDays(today, i), risk: r })),
    sub: RISK_VIEW[risk].sub,
    stale: false,
  }
}

// Live forecast. If it can't be fetched, fall back to the "watch" sample and mark it stale.
async function loadLive(): Promise<HomeData> {
  try {
    const live = assessRisk(await fetchHourlyForecast(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon), todayIn())
    return { risk: live.today, days: live.days, sub: live.reason, stale: false }
  } catch (err) {
    console.error('Live risk unavailable, showing sample data:', err)
    return { ...sampleData('watch'), stale: true }
  }
}

// The same risk engine run on observed weather for the 5 days starting `date`.
// Never falls back to sample data: anything that goes wrong becomes an explicit error.
async function loadReplay(date: string): Promise<{ data: HomeData } | { error: string }> {
  if (!isIsoDate(date)) return { error: `তারিখটি ঠিক নেই। এভাবে লিখুন: ?replay=${REPLAY_DEMO_DATE}` }
  const end = addDays(date, FORECAST_DAYS - 1)
  if (end >= todayIn()) return { error: 'রিপ্লে শুধু অতীতের তারিখে চলে। আরো পুরনো তারিখ দিন।' }

  let hourly
  try {
    hourly = await fetchHourlyArchive(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, date, end)
  } catch (err) {
    console.error('Replay weather unavailable:', err)
    return { error: 'সেই দিনগুলোর আবহাওয়ার তথ্য আনা যায়নি — নেট নেই?' }
  }
  if (summarizeDays(hourly).length < FORECAST_DAYS) {
    return { error: 'এই তারিখগুলোর পুরো আবহাওয়ার তথ্য এখনো আর্কাইভে আসেনি।' }
  }
  const result = assessRisk(hourly, date)
  return { data: { risk: result.today, days: result.days, sub: result.reason, stale: false } }
}

type DemoMode = Risk | 'live' | 'replay'

const DEMOS: { mode: DemoMode; href: string; label: string }[] = [
  { mode: 'live', href: '/', label: 'লাইভ' },
  ...RISKS.map((r) => ({ mode: r, href: `/?risk=${r}`, label: DAY_STATE[r].word })),
  { mode: 'replay', href: `/?replay=${REPLAY_DEMO_DATE}`, label: 'রিপ্লে' },
]

function DemoNav({ current }: { current: DemoMode }) {
  return (
    <nav aria-label="ডেমো: ঝুঁকির অবস্থা বদলান" className="mx-4 mt-2 flex shrink-0 justify-center gap-1.5">
      {DEMOS.map((d) => (
        <Link
          key={d.mode}
          href={d.href}
          scroll={false}
          replace
          aria-current={d.mode === current ? 'true' : undefined}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold no-underline ${
            d.mode === current ? 'bg-ink text-cream' : 'bg-sand text-muted-2'
          }`}
        >
          {d.label}
        </Link>
      ))}
    </nav>
  )
}

// Marks a replayed day so it is never mistaken for today's forecast.
function ReplayChip({ date, bg, ink }: { date: string; bg: string; ink: string }) {
  return (
    <span className="self-start rounded-full px-2.5 text-[13px] leading-[22px] font-semibold" style={{ background: bg, color: ink }}>
      {`রিপ্লে: ${isIsoDate(date) ? bnDate(date) : date}`}
    </span>
  )
}

function ReplayUnavailable({ date, message }: { date: string; message: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <section role="alert" className="stitch-lg mx-4 mt-6 flex shrink-0 flex-col gap-2 rounded-[20px] p-4">
        <ReplayChip date={date} bg="var(--color-ink)" ink="var(--color-cream)" />
        <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">রিপ্লে দেখানো যাচ্ছে না</h1>
        <p className="m-0 text-[15px] leading-[1.45]">{message}</p>
        <Link href="/" className="text-[15px] font-semibold text-teal">
          আজকের আসল ঝুঁকি দেখুন
        </Link>
      </section>
      <DemoNav current="replay" />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}

// Live forecast by default, shown only in season (see SeasonGate). For demos, ?risk= forces a
// sample state and ?replay=YYYY-MM-DD replays past weather, both regardless of season;
// ?risk= wins if both are given.
export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = await searchParams
  const override = parseRiskOverride(params.risk)
  const replay = override ? undefined : parseReplay(params.replay)

  let data: HomeData
  if (override) {
    data = sampleData(override)
  } else if (replay !== undefined) {
    const result = await loadReplay(replay)
    if ('error' in result) return <ReplayUnavailable date={replay} message={result.error} />
    data = result.data
  } else {
    data = await loadLive()
  }

  const { risk, sub, stale } = data
  const view = RISK_VIEW[risk]
  const days = data.days.map((d, i) => ({ ...d, name: i === 0 && !replay ? 'আজ' : bnWeekday(d.date), ...DAY_STATE[d.risk] }))
  // Stale sample days are not a forecast, so the decision must not name a day from them.
  const decision = stale ? DECISION[risk] : buildDecision(data.days, risk)

  const speech = [
    replay ? `রিপ্লে, ${bnDate(replay)}। বগুড়া, শিবগঞ্জ। সেদিনের ধসা রোগের ঝুঁকি:` : 'বগুড়া, শিবগঞ্জ। আজকের ধসা রোগের ঝুঁকি:',
    view.word + '।',
    sub + '।',
    view.title + '।',
    decision,
    stale && STALE_NOTE + '।',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-1 flex-col">
      <SeasonGate
        today={todayIn()}
        bypass={override !== undefined || replay !== undefined}
        header={
          <HomeHeader
            view={view}
            speech={speech}
            locationNote={
              stale && <span className="ml-1 rounded-full border border-current px-1.5 text-[11px] leading-[18px]">{STALE_NOTE}</span>
            }
          >
            {replay ? (
              <ReplayChip date={replay} bg={view.ink} ink={view.sky} />
            ) : (
              <span className="text-[15px] font-medium">আজকের ধসা রোগের ঝুঁকি</span>
            )}
            <div
              className="flex items-center gap-2 self-start rounded-[14px] pt-1 pr-4 pb-0.5 pl-3"
              style={{ background: view.badgeBg, color: view.badgeInk }}
            >
              <WarnIcon size={26} weight={2.4} />
              <span className="font-display text-[34px] leading-[1.15] font-extrabold">{view.word}</span>
            </div>
            <span className="text-[15px] leading-[1.4] font-medium">{sub}</span>
          </HomeHeader>
        }
        strip={
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
        }
        demoNav={<DemoNav current={replay !== undefined ? 'replay' : (override ?? 'live')} />}
        decision={
          <section className="stitch-lg mx-4 mt-2 flex shrink-0 items-start gap-3.5 rounded-[20px] p-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full"
              style={{ background: view.accentSoft, color: view.accent }}
            >
              <SprayIcon size={32} crossed={view.noSpray} />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-semibold text-muted">{replay ? 'সেদিনের সিদ্ধান্ত' : 'আজকের সিদ্ধান্ত'}</span>
              <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">{view.title}</h1>
              <p className="m-0 text-[15px] leading-[1.45]">{decision}</p>
              <Link href="/map" className="mt-0.5 text-[15px] font-semibold text-teal">
                কেন এই পরামর্শ?
              </Link>
            </div>
          </section>
        }
      />

      <Link
        href="/ledger"
        className="mx-4 mt-2.5 flex min-h-[46px] shrink-0 items-center justify-between rounded-full bg-mist px-3.5 text-[15px] font-semibold text-teal-deep no-underline"
      >
        <span className="flex items-center gap-2">
          <CheckIcon size={20} />
          এই মৌসুমে {toBnDigits(SAVED_COUNT)}টা স্প্রে বাঁচিয়েছেন
        </span>
        <span className="font-display text-lg font-extrabold">{formatTaka(SAVED_TOTAL)}</span>
      </Link>

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2.5 px-4 pb-3.5">
        <PrimaryLink href="/camera" className="h-[70px] gap-3">
          <CameraIcon size={30} weight={2.2} />
          <span className="font-display text-[23px] font-extrabold">পাতার ছবি তুলুন</span>
        </PrimaryLink>
        <button type="button" className={`${outlineClass} h-[58px] gap-2.5 text-lg font-bold`}>
          <MicIcon size={24} weight={2.2} />
          বলে জিজ্ঞেস করুন
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
