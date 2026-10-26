import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { alertMessage, cropsToAlert, nextAlert, SMS_MAX_CHARS } from '@/lib/alerts'
import { CROP_IDS } from '@/lib/crops'
import type { Risk } from '@/lib/data'
import { addDays } from '@/lib/dates'
import type { StripDay } from '@/lib/risk'

const START = '2026-12-06' // a Sunday

const strip = (from: string, ...risks: Risk[]): StripDay[] => risks.map((risk, i) => ({ date: addDays(from, i), risk }))

describe('cropsToAlert', () => {
  it('assumes the usual potato season when no field is given', () => {
    assert.deepEqual(cropsToAlert([], '2026-12-06'), ['potato'])
    assert.deepEqual(cropsToAlert([], '2026-07-01'), [])
  })

  it('only names crops in the field today', () => {
    const fields = [
      { season: 'potato' as const, planted: '2026-11-10' },
      { season: 'boro' as const, planted: '2027-01-20' },
    ]
    assert.deepEqual(cropsToAlert(fields, '2026-12-06'), ['potato'])
    assert.deepEqual(cropsToAlert(fields, '2027-02-15'), ['potato', 'paddy'])
    assert.deepEqual(cropsToAlert(fields, '2026-11-12'), [])
  })
})

describe('nextAlert', () => {
  it('stays quiet without danger today or tomorrow', () => {
    assert.equal(nextAlert(strip(START, 'watch', 'safe', 'danger', 'danger', 'safe'), null), null)
  })

  it('warns the afternoon before a danger day', () => {
    assert.deepEqual(nextAlert(strip(START, 'watch', 'danger', 'danger', 'safe', 'safe'), null), {
      send: 1,
      lastDanger: addDays(START, 1),
    })
  })

  it('warns the same day when danger came without notice', () => {
    assert.deepEqual(nextAlert(strip(START, 'danger', 'danger', 'safe', 'safe', 'safe'), null), {
      send: 0,
      lastDanger: addDays(START, 1),
    })
  })

  it('sends one SMS for a run of danger days', () => {
    // Yesterday warned about today and tomorrow; the run goes on.
    const run = nextAlert(strip(START, 'danger', 'danger', 'danger', 'safe', 'safe'), addDays(START, 0))
    assert.deepEqual(run, { send: -1, lastDanger: addDays(START, 1) })
  })

  it('warns again after enough quiet days, as the backtest counts alerts', () => {
    const tomorrow = strip(START, 'safe', 'danger', 'safe', 'safe', 'safe')
    assert.equal(nextAlert(tomorrow, addDays(START, -1))?.send, -1) // one quiet day between
    assert.equal(nextAlert(tomorrow, addDays(START, -2))?.send, 1) // two quiet days
  })

  it('never forgets a later danger day it already warned about', () => {
    const later = addDays(START, 3)
    assert.deepEqual(nextAlert(strip(START, 'danger', 'safe', 'safe', 'danger', 'safe'), later), { send: -1, lastDanger: later })
  })
})

describe('alertMessage', () => {
  it('names the day and fits one Bengali SMS for every crop', () => {
    for (const crop of CROP_IDS) {
      for (const index of [0, 1]) {
        const text = alertMessage(crop, strip(START, 'danger', 'danger', 'safe', 'safe', 'safe'), index)
        assert.ok(text.includes(index === 0 ? 'আজ থেকে' : 'কাল থেকে'), text)
        assert.ok(text.length <= SMS_MAX_CHARS, `${text.length}: ${text}`)
      }
    }
  })

  it('marks the paddy warning as experimental', () => {
    assert.match(alertMessage('paddy', strip(START, 'safe', 'danger'), 1), /পরীক্ষামূলক/)
    assert.equal(alertMessage('potato', strip(START, 'safe', 'danger'), 1), 'Crop Guardian: কাল থেকে আলুতে নাবি ধসার ঝুঁকি। আজই পাতা দেখুন।')
  })
})
