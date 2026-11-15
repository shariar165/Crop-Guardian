import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays } from '@/lib/dates'
import { classifyJhulsaDays, type JhulsaDay, movingSums, summarizeJhulsaDays } from '@/lib/jhulsacast'

const START = '2025-12-01'
// `n` days from START, each with the same hours, and rain from `rain` (0 when not given).
const days = (n: number, humidHours: number, mildHours: number, rain: number[] = []): JhulsaDay[] =>
  Array.from({ length: n }, (_, i) => ({ date: addDays(START, i), humidHours, mildHours, rainMm: rain[i] ?? 0 }))
const firing = (d: JhulsaDay[], key: 'sevenDay' | 'fiveDay') =>
  classifyJhulsaDays(d)
    .filter((r) => r[key])
    .map((r) => r.date)

describe('summarizeJhulsaDays', () => {
  it('counts hours at RH ≥ 90%, hours at 7.2–26.6°C (both ends in), and the rain', () => {
    const time = ['T00', 'T01', 'T02', 'T03'].map((h) => `${START}${h}:00`)
    const [day] = summarizeJhulsaDays({ time, temperature: [7.2, 26.6, 7.1, null], humidity: [90, 89.9, null, 95], precipitation: [0.5, null, 1, 0] })
    assert.deepEqual(day, { date: START, humidHours: 2, mildHours: 2, rainMm: 1.5 })
  })

  it('leaves rain unknown when the source has none', () => {
    const [day] = summarizeJhulsaDays({ time: [`${START}T00:00`], temperature: [12], humidity: [95] })
    assert.equal(day.rainMm, null)
  })
})

describe('the 7-day condition', () => {
  // 15 h × 7 = 105 and 22 h × 7 = 154: exactly at the humidity threshold.
  it('fires once the 7-day sums have held for 7 consecutive days, so on the 13th day of data', () => {
    assert.deepEqual(firing(days(14, 15, 22), 'sevenDay'), [addDays(START, 12), addDays(START, 13)])
  })

  it('needs both sums: 104 humid hours, or 147 mild ones, is not enough', () => {
    // Every window holding day 6 (those ending on days 6–12) sums to 104, so the 7-day run of
    // holding windows starts on day 13 and first completes on day 19.
    const humid = days(20, 15, 22)
    humid[6] = { ...humid[6], humidHours: 14 }
    assert.deepEqual(firing(humid, 'sevenDay'), [addDays(START, 19)])
    assert.deepEqual(firing(days(14, 15, 21), 'sevenDay'), [])
  })

  it('does not sum across a missing day', () => {
    const gap = days(14, 24, 24).filter((_, i) => i !== 3)
    assert.deepEqual(firing(gap, 'sevenDay'), [])
  })
})

describe('the 5-day condition', () => {
  // 13 h × 5 = 65 and 21 h × 5 = 105, on the 9th day of data; rain only on days 7 and 8.
  it('fires when the 5-day sums held for 5 days and two consecutive days had ≥ 2.5 mm', () => {
    const rain = [0, 0, 0, 0, 0, 0, 0, 1.5, 1.0]
    assert.deepEqual(firing(days(9, 13, 21, rain), 'fiveDay'), [addDays(START, 8)])
  })

  it('does not fire on 2.4 mm, or on rain split across days that are not consecutive', () => {
    assert.deepEqual(firing(days(9, 13, 21, [0, 0, 0, 0, 0, 0, 0, 1.4, 1.0]), 'fiveDay'), [])
    assert.deepEqual(firing(days(9, 13, 21, [0, 0, 0, 0, 0, 1.5, 0, 1.5, 0]), 'fiveDay'), [])
  })

  it('does not count rain that fell before the 5 days', () => {
    assert.deepEqual(firing(days(9, 13, 21, [0, 0, 0, 1.5, 1.0]), 'fiveDay'), [])
  })

  it('cannot fire without rain data', () => {
    const dry = days(9, 24, 24).map((d) => ({ ...d, rainMm: null }))
    assert.deepEqual(firing(dry, 'fiveDay'), [])
  })
})

describe('classifyJhulsaDays', () => {
  it('calls a day danger when either condition fires, and safe otherwise', () => {
    const risks = classifyJhulsaDays(days(14, 15, 22)).map((d) => d.risk)
    assert.deepEqual(risks, [...Array(12).fill('safe'), 'danger', 'danger'])
  })
})

describe('movingSums', () => {
  it('sums the n days ending on each day, and leaves out windows with a gap', () => {
    const d = days(9, 10, 20).filter((_, i) => i !== 7)
    const sums = movingSums(d, 7)
    assert.deepEqual([...sums.keys()], [addDays(START, 6)])
    assert.deepEqual(sums.get(addDays(START, 6)), { humidHours: 70, mildHours: 140 })
  })
})
