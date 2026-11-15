import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { type IsdReading, parseIsd, rhFrom, stationHourly } from '@/lib/isd'

const HEADER = '"STATION","DATE","SOURCE","REPORT_TYPE","TMP","DEW","AA1","AA2"'
const row = (date: string, type: string, tmp: string, dew: string, aa1 = '', aa2 = '') =>
  [`"41883099999"`, `"${date}"`, '"4"', `"${type}"`, `"${tmp}"`, `"${dew}"`, aa1 ? `"${aa1}"` : '', aa2 ? `"${aa2}"` : ''].join(',')

describe('parseIsd', () => {
  it('reads SYNOP temperature and dew point in local time, and skips other reports and missing values', () => {
    const csv = [
      HEADER,
      row('2020-01-01T03:00:00', 'FM-12', '+0196,1', '+0160,1', '24,0028,3,1'),
      row('2020-01-01T00:00:00', 'FM-12', '+0155,1', '+0150,1', '24,0000,9,1'),
      row('2020-01-01T01:00:00', 'FM-15', '+0160,1', '+0150,1'),
      row('2020-01-01T06:00:00', 'FM-12', '+9999,9', '+0150,1'),
      row('2020-01-01T18:00:00', 'FM-12', '+0120,1', '+0115,3'),
    ].join('\n')
    assert.deepEqual(parseIsd(csv), [
      { time: '2020-01-01T06:00', temp: 15.5, dew: 15, rain24: 0 },
      { time: '2020-01-01T09:00', temp: 19.6, dew: 16, rain24: 2.8 },
    ])
  })

  it('reads an empty file (no ISD file for that year) as no readings', () => {
    assert.deepEqual(parseIsd(''), [])
  })
})

describe('rhFrom', () => {
  it('is 100% at saturation and about 90% with the dew point 1.5°C below', () => {
    assert.equal(Math.round(rhFrom(15, 15)), 100)
    const rh = rhFrom(15, 13.5)
    assert.ok(rh > 90 && rh < 91, String(rh))
  })
})

describe('stationHourly', () => {
  // A full day of 8 readings at 00, 03, … 21 local, all at 15°C.
  const day = (date: string, dew: (h: number) => number, skip: number[] = []): IsdReading[] =>
    [0, 3, 6, 9, 12, 15, 18, 21].filter((h) => !skip.includes(h)).map((h) => ({ time: `${date}T${String(h).padStart(2, '0')}:00`, temp: 15, dew: dew(h), rain24: null }))

  it('lets each reading stand for the 3 hours from its time', () => {
    const humid = (h: number) => (h === 6 ? 15 : 10)
    const s = stationHourly(day('2024-01-10', humid), '2024-01-10', '2024-01-10')
    assert.equal(s.time.length, 24)
    const saturated = s.time.filter((_, i) => s.humidity[i]! >= 99).map((t) => t.slice(11, 13))
    assert.deepEqual(saturated, ['06', '07', '08'])
  })

  it('lets the reading before a missing one stand for 6 hours, and drops days with longer gaps', () => {
    const one = stationHourly([...day('2024-01-10', () => 10, [12]), ...day('2024-01-11', () => 10, [9, 12])], '2024-01-10', '2024-01-11')
    assert.deepEqual([...new Set(one.time.map((t) => t.slice(0, 10)))], ['2024-01-10'])
  })

  it('puts the 24-hour rain reported at 09:00 on the day before', () => {
    const readings = [...day('2024-01-10', () => 10), ...day('2024-01-11', () => 10)]
    readings[8 + 3] = { ...readings[8 + 3], rain24: 3.2 } // 11 Jan, 09:00
    const s = stationHourly(readings, '2024-01-10', '2024-01-11')
    assert.deepEqual(
      s.time.filter((_, i) => s.precipitation![i] !== null),
      ['2024-01-10T12:00'],
    )
  })
})
