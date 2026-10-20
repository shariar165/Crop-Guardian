import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseHourly, parseHourlyMany } from '@/lib/weather'

const point = (rh: number) => ({
  latitude: 25,
  longitude: 89.3,
  hourly: { time: ['2026-10-20T00:00', '2026-10-20T01:00'], temperature_2m: [18, 17.5], relative_humidity_2m: [rh, null] },
})

describe('Open-Meteo responses', () => {
  it('reads the hourly arrays', () => {
    assert.deepEqual(parseHourly(point(91)), {
      time: ['2026-10-20T00:00', '2026-10-20T01:00'],
      temperature: [18, 17.5],
      humidity: [91, null],
    })
  })

  it('refuses hourly arrays of different lengths', () => {
    const bad = point(91)
    bad.hourly.temperature_2m = [18]
    assert.throws(() => parseHourly(bad), /malformed/)
  })

  it('keeps one response per point, in order, for several points', () => {
    const many = parseHourlyMany([point(80), point(95)], 2)
    assert.deepEqual(
      many.map((h) => h.humidity[0]),
      [80, 95],
    )
  })

  it('accepts a single point as an object, and refuses a wrong count', () => {
    assert.equal(parseHourlyMany(point(80), 1).length, 1)
    assert.throws(() => parseHourlyMany([point(80)], 13), /expected 13/)
  })
})
