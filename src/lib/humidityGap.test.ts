import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays } from '@/lib/dates'
import { fitThreshold, humidHoursByDay, monthlyMeans, sampledEvery3h, worstWeek } from '@/lib/humidityGap'
import type { HourlyForecast } from '@/lib/weather'

const START = '2024-01-30'
// `n` days of hourly RH from `rh(day, hour)`.
function series(n: number, rh: (day: number, hour: number) => number | null): HourlyForecast {
  const time: string[] = []
  const humidity: (number | null)[] = []
  for (let d = 0; d < n; d++)
    for (let h = 0; h < 24; h++) {
      time.push(`${addDays(START, d)}T${String(h).padStart(2, '0')}:00`)
      humidity.push(rh(d, h))
    }
  return { time, temperature: time.map(() => 12), humidity }
}

describe('humidHoursByDay', () => {
  it('counts hours at or above the threshold, and leaves out days with a missing hour', () => {
    const s = series(2, (d, h) => (d === 1 && h === 5 ? null : h < 8 ? 90 : 85))
    assert.deepEqual([...humidHoursByDay(s, 90)], [[START, 8]])
    assert.equal(humidHoursByDay(s, 85).get(START), 24)
  })
})

describe('sampledEvery3h', () => {
  it('lets the reading at 00, 03, … stand for the next two hours', () => {
    const s = sampledEvery3h(series(1, (_, h) => (h === 3 ? 95 : 50)))
    assert.deepEqual(s.humidity.slice(0, 7), [50, 50, 50, 95, 95, 95, 50])
  })
})

describe('monthlyMeans and worstWeek', () => {
  const byDay = new Map(Array.from({ length: 10 }, (_, i) => [addDays(START, i), i]))
  const dates = [...byDay.keys()]

  it('averages each month over the dates given', () => {
    assert.deepEqual(monthlyMeans(byDay, dates), [
      { month: '2024-01', days: 2, mean: 0.5 },
      { month: '2024-02', days: 8, mean: 5.5 },
    ])
  })

  it('finds the 7 straight days with the most humid hours, skipping windows with a gap', () => {
    assert.deepEqual(worstWeek(byDay, dates), { start: addDays(START, 3), hours: 3 + 4 + 5 + 6 + 7 + 8 + 9 })
    assert.equal(worstWeek(byDay, dates.filter((_, i) => i !== 5)), null)
  })
})

describe('fitThreshold', () => {
  it('finds the model threshold whose humid hours match the station at 90%', () => {
    // The model reads 5 points low: hours at RH ≥ 85 on the model are the station's hours at ≥ 90.
    const model = series(3, (_, h) => 70 + h)
    const station = humidHoursByDay(series(3, (_, h) => 75 + h), 90)
    const fit = fitThreshold([{ model, station, dates: [START, addDays(START, 1), addDays(START, 2)] }])
    assert.equal(fit.threshold, 85)
    assert.equal(fit.stationMean, 9)
    assert.equal(fit.modelMeanAt90, 4)
    assert.equal(fit.mae, 0)
  })

  it('pools several stations, keeping each station to its own days', () => {
    const dates = [START]
    const low = { model: series(1, (_, h) => 70 + h), station: humidHoursByDay(series(1, (_, h) => 75 + h), 90), dates }
    const exact = { model: series(1, (_, h) => 75 + h), station: humidHoursByDay(series(1, (_, h) => 75 + h), 90), dates }
    // Both stations have 9 h. At 87 the two models give 7 and 12 h (mean 9.5), at 87.5 and 88 they
    // give 6 and 11 (8.5): equally far, so the tie goes to 88, nearest 90.
    const fit = fitThreshold([low, exact])
    assert.equal(fit.days, 2)
    assert.equal(fit.stationMean, 9)
    assert.equal(fit.threshold, 88)
  })
})
