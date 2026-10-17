import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays } from '@/lib/weather'
import type { HourlyForecast } from '@/lib/weather'
import { assessRisk, classifyDays, summarizeDays } from '@/lib/risk'

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
