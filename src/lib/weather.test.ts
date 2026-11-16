import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseHourly, parseHourlyMany, parseNasaPower } from '@/lib/weather'

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

  it('reads hourly rain when the archive sends it, and refuses it at the wrong length', () => {
    const wet = { ...point(91), hourly: { ...point(91).hourly, precipitation: [0, 1.2] } }
    assert.deepEqual(parseHourly(wet).precipitation, [0, 1.2])
    assert.throws(() => parseHourly({ ...wet, hourly: { ...wet.hourly, precipitation: [0] } }), /malformed/)
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

describe('NASA POWER responses', () => {
  const body = {
    properties: {
      parameter: {
        T2M: { '2025010101': 12.94, '2025010100': 13.33, '2025010102': -999 },
        RH2M: { '2025010100': 87.82, '2025010101': 89.84, '2025010102': 92.23 },
      },
    },
  }

  it('reads the hourly series in time order, as local times, with fill values missing', () => {
    assert.deepEqual(parseNasaPower(body), {
      time: ['2025-01-01T00:00', '2025-01-01T01:00', '2025-01-01T02:00'],
      temperature: [13.33, 12.94, null],
      humidity: [87.82, 89.84, 92.23],
    })
  })

  it('reads hourly rain when it is asked for', () => {
    const rain = { PRECTOTCORR: { '2025010100': 0, '2025010101': 0.4, '2025010102': -999 } }
    const wet = { properties: { parameter: { ...body.properties.parameter, ...rain } } }
    assert.deepEqual(parseNasaPower(wet).precipitation, [0, 0.4, null])
  })

  it('refuses a response without both series', () => {
    assert.throws(() => parseNasaPower({ properties: { parameter: { T2M: {} } } }), /malformed/)
    assert.throws(() => parseNasaPower({ messages: ['error'] }), /malformed/)
  })
})
