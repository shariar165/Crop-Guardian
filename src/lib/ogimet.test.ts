import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rhFrom } from '@/lib/isd'
import { decodeSynop, dewFrom, parseOgimet } from '@/lib/ogimet'

// Real Rangpur reports from OGIMET, 7 Jan 2020.
const AT_00 = 'AAXX 07004 41859 01930 00000 10104 20090 30131 40171 70500 333 59004 70000=='
const AT_03 = 'AAXX 07034 41859 01305 80000 10115 20115 30145 40185 74244 8662/ 333 20095 59037 70000 83708 85616 88456=='

describe('decodeSynop', () => {
  it('reads temperature and dew point from section 1, and the 24-hour rain from section 3', () => {
    assert.deepEqual(decodeSynop(AT_00), { temp: 10.4, dew: 9, rain24: 0 })
  })

  it('takes the dew point from section 1, not the minimum temperature (2snTnTnTn) in section 3', () => {
    assert.deepEqual(decodeSynop(AT_03), { temp: 11.5, dew: 11.5, rain24: 0 })
  })

  it('reads negative values, rain in tenths, and a trace as none', () => {
    assert.deepEqual(decodeSynop('AAXX 07004 41859 01930 00000 11005 21012 333 70123=='), { temp: -0.5, dew: -1.2, rain24: 12.3 })
    assert.equal(decodeSynop('AAXX 07004 41859 01930 00000 10104 20090 333 79999==')!.rain24, 0)
  })

  it('skips the 00fff group after a wind of 99 units', () => {
    assert.deepEqual(decodeSynop('AAXX 07004 41859 01930 09999 00105 10104 20090=='), { temp: 10.4, dew: 9, rain24: null })
  })

  it('turns a 29UUU humidity into a dew point that gives the same humidity back', () => {
    const s = decodeSynop('AAXX 07004 41859 01930 00000 10150 29092==')!
    assert.ok(Math.abs(rhFrom(s.temp!, s.dew!) - 92) < 0.5, String(s.dew))
    assert.ok(Math.abs(rhFrom(15, dewFrom(15, 80)) - 80) < 1e-9)
  })

  it('returns null for NIL and for other report types', () => {
    assert.equal(decodeSynop('NIL=='), null)
    assert.equal(decodeSynop('AAXX 07004 41859 NIL=='), null)
    assert.equal(decodeSynop('BBXX 07004 41859 01930 00000 10104 20090=='), null)
  })
})

describe('parseOgimet', () => {
  it('reads the CSV into local-time readings with both values, and drops the rest', () => {
    const csv = [
      `41859,2020,01,07,03,00,${AT_03}`,
      `41859,2020,01,07,00,00,${AT_00}`,
      '41859,2020,01,07,06,00,AAXX 07064 41859 NIL==',
      '#Sorry, some message',
    ].join('\n')
    assert.deepEqual(parseOgimet(csv), [
      { time: '2020-01-07T06:00', temp: 10.4, dew: 9, rain24: 0 },
      { time: '2020-01-07T09:00', temp: 11.5, dew: 11.5, rain24: 0 },
    ])
  })
})
