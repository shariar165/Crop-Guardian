import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bnWeekday } from '@/lib/bn'
import { assessBlast, BLAST_DECISION, BLAST_WET_HOURS, buildBlastReason, classifyBlastDays, summarizeBlastDays } from '@/lib/blast'
import type { BlastDaySummary } from '@/lib/blast'
import type { Risk } from '@/lib/data'
import { addDays } from '@/lib/dates'
import { buildDecision } from '@/lib/risk'
import type { HourlyForecast } from '@/lib/weather'

const START = '2026-10-18' // a Sunday

// `humid` hours at RH 95% and `temp`, the rest of the day dry at 30°C.
type DaySpec = { humid: number; temp: number }
const DRY: DaySpec = { humid: 0, temp: 24 }
const WET: DaySpec = { humid: 12, temp: 24 }

function makeHourly(days: DaySpec[], start = START): HourlyForecast {
  const hourly: HourlyForecast = { time: [], temperature: [], humidity: [] }
  days.forEach((day, d) => {
    const date = addDays(start, d)
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`${date}T${String(h).padStart(2, '0')}:00`)
      hourly.temperature.push(h < day.humid ? day.temp : 30)
      hourly.humidity.push(h < day.humid ? 95 : 60)
    }
  })
  return hourly
}

const risks = (r: { days: { risk: Risk }[] }) => r.days.map((d) => d.risk)

describe('summarizeBlastDays', () => {
  it('counts humid hours inside the 18–28°C band as wet', () => {
    const [day] = summarizeBlastDays(makeHourly([WET]))
    assert.deepEqual(day, { date: START, humidHours: 12, humidTemp: 24, wetHours: 12 })
  })

  it('includes both band edges and nothing outside them', () => {
    const hourly = makeHourly([DRY])
    ;[17.9, 18, 28, 28.1].forEach((t, i) => {
      hourly.temperature[i] = t
      hourly.humidity[i] = 90
    })
    const [day] = summarizeBlastDays(hourly)
    assert.equal(day.humidHours, 4)
    assert.equal(day.wetHours, 2)
  })

  it('ignores an hour with a missing reading and drops a day with none', () => {
    const hourly = makeHourly([WET, WET])
    hourly.humidity[0] = null
    for (let h = 24; h < 48; h++) hourly.temperature[h] = null
    const days = summarizeBlastDays(hourly)
    assert.equal(days.length, 1)
    assert.equal(days[0].wetHours, 11)
  })
})

describe('assessBlast', () => {
  it('is safe on dry days', () => {
    assert.deepEqual(risks(assessBlast(makeHourly([DRY, DRY, DRY]))), ['safe', 'safe', 'safe'])
  })

  it('needs two qualifying days in a row for danger', () => {
    assert.deepEqual(risks(assessBlast(makeHourly([WET, DRY, WET, WET, DRY]))), ['watch', 'safe', 'danger', 'danger', 'safe'])
  })

  it(`needs ${BLAST_WET_HOURS} wet hours to qualify, and calls 7 a near miss`, () => {
    const r = assessBlast(makeHourly([{ humid: BLAST_WET_HOURS - 1, temp: 24 }, { humid: 7, temp: 24 }, { humid: 6, temp: 24 }]))
    assert.deepEqual(risks(r), ['watch', 'watch', 'safe'])
  })

  it('keeps long humid spells safe when they are too cold or too hot for blast', () => {
    const cold = assessBlast(makeHourly([{ humid: 14, temp: 12 }, { humid: 14, temp: 12 }]))
    assert.deepEqual(risks(cold), ['safe', 'safe'])
    assert.equal(cold.reason, 'ভেজা সময়ে ১২°সে — ব্লাস্টের জন্য ঠান্ডা')
    const hot = assessBlast(makeHourly([{ humid: 14, temp: 31 }, DRY]))
    assert.equal(hot.reason, 'ভেজা সময়ে ৩১°সে — ব্লাস্টের জন্য বেশি গরম')
  })

  it('raises a safe today to watch for danger within 2 days, and names the day', () => {
    const r = assessBlast(makeHourly([DRY, DRY, WET, WET, DRY]))
    assert.equal(r.today, 'watch')
    assert.equal(r.reason, `${bnWeekday(addDays(START, 2))}বার থেকে ২ দিন রোজ ১২ ঘণ্টা আর্দ্রতা ৯০%-এর বেশি`)
  })

  it('drops past days after classifying', () => {
    const r = assessBlast(makeHourly([WET, WET, DRY]), addDays(START, 1))
    assert.deepEqual(risks(r), ['danger', 'safe'])
  })

  it('throws with no day from today on', () => {
    assert.throws(() => assessBlast(makeHourly([WET]), addDays(START, 5)))
  })
})

// Same limits as late blight's text (risk.test.ts): two lines on the Home header and decision card.
const MAX_REASON_CHARS = 56
const MAX_DECISION_CHARS = 66

describe('blast text', () => {
  it('fits two lines for every mix of days', () => {
    const kinds: Omit<BlastDaySummary, 'date'>[] = [
      { humidHours: 0, humidTemp: null, wetHours: 0 },
      { humidHours: 24, humidTemp: 24, wetHours: 24 },
      { humidHours: 8, humidTemp: 22, wetHours: 8 },
      { humidHours: 20, humidTemp: 9.6, wetHours: 0 },
      { humidHours: 20, humidTemp: 33, wetHours: 3 },
      { humidHours: 5, humidTemp: 24, wetHours: 5 },
    ]
    for (let n = 0; n < kinds.length ** 4; n++) {
      const days = classifyBlastDays(
        Array.from({ length: 4 }, (_, i) => ({ date: addDays(START, i), ...kinds[Math.floor(n / kinds.length ** i) % kinds.length] })),
      )
      const today = days[0].risk === 'safe' && days.slice(1, 3).some((d) => d.risk === 'danger') ? 'watch' : days[0].risk
      const reason = buildBlastReason(days, today)
      assert.ok(reason.length <= MAX_REASON_CHARS, reason)
      const decision = buildDecision(days, today, BLAST_DECISION)
      assert.ok(decision.length <= MAX_DECISION_CHARS, decision)
      assert.doesNotMatch(reason + decision, /[0-9]/)
    }
  })
})
