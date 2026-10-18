import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { alertStats } from '@/lib/backtest'
import { addDays } from '@/lib/dates'
import type { Risk } from '@/lib/data'

const START = '2025-12-01'
// One letter per day from START: d = danger, w = watch, s = safe, - = missing from the data.
const days = (pattern: string) =>
  [...pattern].flatMap((c, i) => (c === '-' ? [] : [{ date: addDays(START, i), risk: ({ d: 'danger', w: 'watch', s: 'safe' } as Record<string, Risk>)[c] }]))

describe('alertStats', () => {
  it('has no alerts without danger', () => {
    assert.deepEqual(alertStats(days('swwss')), { dangerDays: 0, alerts: [], avgGapDays: null })
  })

  it('keeps one alert across a single quiet day', () => {
    const stats = alertStats(days('ddwdd'))
    assert.equal(stats.dangerDays, 4)
    assert.deepEqual(stats.alerts, ['2025-12-01'])
    assert.equal(stats.avgGapDays, null)
  })

  it('starts a new alert after two or more quiet days', () => {
    const stats = alertStats(days('ddssdwwwd'))
    assert.deepEqual(stats.alerts, ['2025-12-01', '2025-12-05', '2025-12-09'])
    assert.equal(stats.avgGapDays, 4)
  })

  it('counts days missing from the data as quiet', () => {
    assert.deepEqual(alertStats(days('d--d')).alerts, ['2025-12-01', '2025-12-04'])
  })
})
