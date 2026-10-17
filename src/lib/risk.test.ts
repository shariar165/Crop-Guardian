import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays } from '@/lib/weather'
import type { HourlyForecast } from '@/lib/weather'
import { bnWeekday } from '@/lib/bn'
import type { Risk } from '@/lib/data'
import { assessRisk, buildDecision, buildReason, classifyDays, DECISION, overallRisk, summarizeDays } from '@/lib/risk'
import type { StripDay } from '@/lib/risk'

const START = '2026-10-18' // a Sunday

const DRY = { minTemp: 14, humidHours: 0 }
const HUTTON = { minTemp: 12, humidHours: 8 }

// 24 hourly readings per day: the night low at 04:00, and RH 95% for the first `humidHours` hours.
function makeHourly(days: { minTemp: number; humidHours: number }[], start = START): HourlyForecast {
  const hourly: HourlyForecast = { time: [], temperature: [], humidity: [] }
  days.forEach((day, d) => {
    const date = addDays(start, d)
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`${date}T${String(h).padStart(2, '0')}:00`)
      hourly.temperature.push(h === 4 ? day.minTemp : day.minTemp + 6)
      hourly.humidity.push(h < day.humidHours ? 95 : 70)
    }
  })
  return hourly
}

const risks = (r: { days: { risk: string }[] }) => r.days.map((d) => d.risk)

describe('summarizeDays', () => {
  it('groups by local date with min temperature and RH >= 90% hours', () => {
    const days = summarizeDays(makeHourly([{ minTemp: 9.4, humidHours: 7 }, DRY]))
    assert.deepEqual(days, [
      { date: '2026-10-18', minTemp: 9.4, humidHours: 7 },
      { date: '2026-10-19', minTemp: 14, humidHours: 0 },
    ])
  })

  it('ignores missing readings', () => {
    const hourly = makeHourly([HUTTON])
    hourly.temperature[4] = null
    hourly.humidity[0] = null
    assert.deepEqual(summarizeDays(hourly), [{ date: START, minTemp: 18, humidHours: 7 }])
  })

  it('counts exactly 90% as humid', () => {
    const hourly = makeHourly([DRY])
    hourly.humidity[10] = 90
    hourly.humidity[11] = 89
    assert.equal(summarizeDays(hourly)[0].humidHours, 1)
  })
})

describe('assessRisk', () => {
  it('is safe when no day is humid', () => {
    const r = assessRisk(makeHourly([DRY, DRY, DRY, DRY, DRY]))
    assert.equal(r.today, 'safe')
    assert.deepEqual(risks(r), ['safe', 'safe', 'safe', 'safe', 'safe'])
  })

  it('is watch for a single qualifying day', () => {
    const r = assessRisk(makeHourly([HUTTON, DRY, DRY, DRY, DRY]))
    assert.equal(r.today, 'watch')
    assert.deepEqual(risks(r), ['watch', 'safe', 'safe', 'safe', 'safe'])
  })

  it('is danger for two consecutive qualifying days', () => {
    const r = assessRisk(makeHourly([HUTTON, HUTTON, DRY, DRY, DRY]))
    assert.equal(r.today, 'danger')
    assert.deepEqual(risks(r), ['danger', 'danger', 'safe', 'safe', 'safe'])
    assert.equal(r.reason, 'আগামী ২ দিন রোজ ৮ ঘণ্টা আর্দ্রতা ৯০%-এর বেশি')
  })

  it('upgrades a safe today to watch when danger falls within the next 2 days', () => {
    const r = assessRisk(makeHourly([DRY, DRY, HUTTON, HUTTON, DRY]))
    assert.equal(r.days[0].risk, 'safe')
    assert.equal(r.today, 'watch')
    assert.equal(r.reason, 'মঙ্গলবার থেকে ২ দিন রোজ ৮ ঘণ্টা আর্দ্রতা ৯০%-এর বেশি')
  })

  it('does not upgrade today for danger 3 or more days out', () => {
    const r = assessRisk(makeHourly([DRY, DRY, DRY, HUTTON, HUTTON]))
    assert.equal(r.today, 'safe')
    assert.deepEqual(risks(r), ['safe', 'safe', 'safe', 'danger', 'danger'])
  })

  it('drops days before the given today but keeps them for the Hutton check', () => {
    const r = assessRisk(makeHourly([HUTTON, HUTTON, DRY]), '2026-10-19')
    assert.deepEqual(r.days.map((d) => d.date), ['2026-10-19', '2026-10-20'])
    assert.equal(r.today, 'danger')
  })

  it('throws when no day is left from today onward', () => {
    assert.throws(() => assessRisk(makeHourly([DRY]), '2026-10-25'))
  })

  it('writes the reason in Bangla digits only', () => {
    for (const days of [[DRY], [HUTTON], [{ minTemp: 6, humidHours: 12 }], [{ minTemp: 11, humidHours: 3 }]]) {
      assert.doesNotMatch(assessRisk(makeHourly(days)).reason, /[0-9]/)
    }
  })
})

describe('classifyDays', () => {
  it('treats a warm day with 4–5 humid hours as watch', () => {
    const days = classifyDays([
      { date: START, minTemp: 11, humidHours: 4 },
      { date: addDays(START, 1), minTemp: 11, humidHours: 5 },
    ])
    assert.deepEqual(days.map((d) => d.risk), ['watch', 'watch'])
  })

  it('keeps cold days safe however humid they are', () => {
    const days = classifyDays([
      { date: START, minTemp: 9, humidHours: 10 },
      { date: addDays(START, 1), minTemp: 9.9, humidHours: 24 },
    ])
    assert.deepEqual(days.map((d) => d.risk), ['safe', 'safe'])
  })

  it('needs at least 6 humid hours to qualify', () => {
    const days = classifyDays([
      { date: START, minTemp: 12, humidHours: 5 },
      { date: addDays(START, 1), minTemp: 12, humidHours: 6 },
    ])
    assert.deepEqual(days.map((d) => d.risk), ['watch', 'watch'])
  })
})

// Longest strings measured in the browser to still fit two lines: the reason in the Home
// header (184 px) and the decision on the card (254 px). A cheap guard against longer copy.
const MAX_REASON_CHARS = 56
const MAX_DECISION_CHARS = 66

const RISK_LIST: Risk[] = ['safe', 'watch', 'danger']

// Every 5-day strip of risks, each starting on every weekday.
function* allStrips(): Generator<StripDay[]> {
  for (let start = 0; start < 7; start++) {
    for (let n = 0; n < 3 ** 5; n++) {
      yield Array.from({ length: 5 }, (_, i) => ({
        date: addDays(START, start + i),
        risk: RISK_LIST[Math.floor(n / 3 ** i) % 3],
      }))
    }
  }
}

const strip = (...risks: Risk[]): StripDay[] => risks.map((risk, i) => ({ date: addDays(START, i), risk }))

describe('buildDecision', () => {
  it('keeps the danger text when today is danger', () => {
    assert.equal(buildDecision(strip('danger', 'danger', 'safe', 'safe', 'safe'), 'danger'), DECISION.danger)
  })

  it('says tomorrow, and promises to check back this afternoon', () => {
    assert.equal(buildDecision(strip('watch', 'danger', 'danger', 'safe', 'safe'), 'watch'), 'কাল থেকে ঝুঁকি বাড়বে। আজ বিকেলে আবার জানাব।')
  })

  it('names the weekday of a danger day two days out', () => {
    assert.equal(
      buildDecision(strip('safe', 'watch', 'danger', 'danger', 'safe'), 'watch'),
      'মঙ্গলবার থেকে ঝুঁকি বাড়বে। কাল বিকেলে আবার জানাব।',
    )
  })

  it('warns about danger later in the week even on a safe day', () => {
    assert.equal(
      buildDecision(strip('safe', 'safe', 'safe', 'danger', 'danger'), 'safe'),
      'বুধবার থেকে ঝুঁকি বাড়বে। আগের দিন বিকেলে আবার জানাব।',
    )
  })

  it('uses the generic line when no danger day is ahead', () => {
    assert.equal(buildDecision(strip('watch', 'watch', 'safe', 'watch', 'safe'), 'watch'), DECISION.watch)
    assert.equal(buildDecision(strip('safe', 'safe', 'safe', 'safe', 'watch'), 'safe'), DECISION.safe)
  })

  it('only ever names the first danger day ahead, and fits two lines', () => {
    for (const days of allStrips()) {
      const today = overallRisk(days)
      const text = buildDecision(days, today)
      const next = days.findIndex((d, i) => i > 0 && d.risk === 'danger')
      const named = days.filter((d) => text.includes(bnWeekday(d.date) + 'বার'))
      if (today === 'danger' || next <= 1) assert.deepEqual(named, [], text)
      else assert.deepEqual(named, [days[next]], text)
      assert.ok(text.length <= MAX_DECISION_CHARS, text)
    }
  })
})

describe('buildReason', () => {
  it('fits two lines for every kind of day, however humid', () => {
    const kinds = [
      { minTemp: 5, humidHours: 24 },
      { minTemp: 12, humidHours: 0 },
      { minTemp: 12, humidHours: 5 },
      { minTemp: 12, humidHours: 24 },
      { minTemp: 28.4, humidHours: 19 },
    ]
    for (let start = 0; start < 7; start++) {
      for (let n = 0; n < kinds.length ** 5; n++) {
        const days = classifyDays(
          Array.from({ length: 5 }, (_, i) => ({ date: addDays(START, start + i), ...kinds[Math.floor(n / kinds.length ** i) % kinds.length] })),
        )
        const text = buildReason(days, overallRisk(days))
        assert.ok(text.length <= MAX_REASON_CHARS, text)
      }
    }
  })
})

describe('classifyDays with gaps', () => {
  it('does not join qualifying days across a missing date', () => {
    const days = classifyDays([
      { date: START, ...HUTTON },
      { date: addDays(START, 2), ...HUTTON },
    ])
    assert.deepEqual(days.map((d) => d.risk), ['watch', 'watch'])
  })
})
