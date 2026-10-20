import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Risk } from '@/lib/data'
import { addDays } from '@/lib/dates'
import { buildLedger, ledgerSpan } from '@/lib/ledger'

const PLANTED = '2026-09-01'
const EMERGED = '2026-09-16' // planting + 15
const COST = 800

// `risks[i]` is the risk on emergence + i.
const daysFrom = (risks: Risk[]) => risks.map((risk, i) => ({ date: addDays(EMERGED, i), risk }))
const week = (risk: Risk): Risk[] => Array(7).fill(risk)

describe('ledgerSpan', () => {
  it('starts at emergence and ends today or at harvest', () => {
    assert.equal(ledgerSpan(PLANTED, '2026-09-10'), null)
    assert.deepEqual(ledgerSpan(PLANTED, '2026-10-01'), { from: EMERGED, to: '2026-10-01' })
    assert.deepEqual(ledgerSpan(PLANTED, '2027-01-01'), { from: EMERGED, to: '2026-12-10' })
  })
})

describe('buildLedger', () => {
  it('counts a safe week without a spray as one calendar spray saved', () => {
    const today = addDays(EMERGED, 7)
    const l = buildLedger({ planting: PLANTED, today, days: daysFrom([...week('safe'), 'safe']), sprays: [], cost: COST })
    const [current, first] = l.weeks
    assert.equal(first.kind, 'saved')
    assert.equal(first.amount, COST)
    assert.deepEqual([first.dayFrom, first.dayTo], [15, 21])
    assert.equal(current.kind, 'ongoing')
    assert.equal(l.savedTotal, COST)
    assert.equal(l.savedCount, 1)
  })

  it('tells a spray in time from a missed danger week', () => {
    const today = addDays(EMERGED, 14)
    const days = daysFrom([...week('watch'), 'danger', 'danger', ...Array(5).fill('watch'), 'safe'])
    days[2].risk = 'danger'
    const sprayed = buildLedger({ planting: PLANTED, today, days, sprays: [addDays(EMERGED, 3)], cost: COST })
    assert.deepEqual(
      sprayed.weeks.map((w) => w.kind),
      ['ongoing', 'missed', 'onTime'],
    )
    assert.equal(sprayed.savedTotal, 0)
    assert.equal(sprayed.onTimeCount, 1)
    assert.equal(sprayed.missedCount, 1)
    assert.equal(sprayed.sprayCount, 1)
  })

  it('saves nothing for a spray without danger, or a week without weather', () => {
    const today = addDays(EMERGED, 14)
    const l = buildLedger({ planting: PLANTED, today, days: daysFrom(week('safe')), sprays: [EMERGED], cost: COST })
    assert.deepEqual(
      l.weeks.map((w) => w.kind),
      ['ongoing', 'noData', 'extra'],
    )
    assert.equal(l.savedTotal, 0)
  })

  it('closes the last week at harvest, even if it is short', () => {
    const today = '2027-01-01'
    // Emergence to harvest inclusive is 86 days.
    const all = daysFrom(Array(86).fill('safe'))
    const l = buildLedger({ planting: PLANTED, today, days: all, sprays: [], cost: COST })
    assert.equal(l.weeks[0].end, '2026-12-10')
    assert.equal(l.weeks[0].dayTo, 100)
    assert.ok(l.weeks.every((w) => w.kind === 'saved'))
    assert.equal(l.savedTotal, l.weeks.length * COST)
  })

  it('is empty before the crop emerges', () => {
    assert.deepEqual(buildLedger({ planting: PLANTED, today: '2026-09-05', days: [], sprays: [], cost: COST }).weeks, [])
  })
})
