import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays } from '@/lib/dates'
import { EMERGENCE_DAYS, HARVEST_DAYS, offSeasonMessage, riskActive, seasonFor } from '@/lib/season'

const PLANTED = '2025-11-01'

describe('seasonFor with a planting date', () => {
  it('is inactive before emergence and says when alerts start', () => {
    const s = seasonFor(addDays(PLANTED, EMERGENCE_DAYS - 1), PLANTED)
    assert.deepEqual(s, { phase: 'before', start: '2025-11-16', end: '2026-02-09', source: 'planting' })
    assert.equal(riskActive(s), false)
    assert.equal(offSeasonMessage(s), 'চারা গজালে, ১৬ নভেম্বর ২০২৫ থেকে ঝুঁকির খবর দেব')
  })

  it('is active from emergence through harvest, inclusive', () => {
    for (const day of [EMERGENCE_DAYS, 50, HARVEST_DAYS]) {
      assert.equal(riskActive(seasonFor(addDays(PLANTED, day), PLANTED)), true, `day ${day}`)
    }
  })

  it('is inactive after harvest', () => {
    const s = seasonFor(addDays(PLANTED, HARVEST_DAYS + 1), PLANTED)
    assert.equal(s.phase, 'after')
    assert.equal(riskActive(s), false)
    assert.match(offSeasonMessage(s), /নতুন আলু লাগালে তারিখ দিন/)
  })

  it('takes precedence over the fallback season', () => {
    // 1 Dec is inside the fallback season but before this crop emerges.
    assert.equal(seasonFor('2025-12-01', '2025-11-20').phase, 'before')
    // 1 Oct is outside the fallback season but this crop is up.
    assert.equal(seasonFor('2025-10-01', '2025-09-01').phase, 'during')
  })
})

describe('seasonFor without a planting date', () => {
  it('is active from 15 Nov to 15 Mar, inclusive, across the new year', () => {
    for (const today of ['2025-11-15', '2025-12-31', '2026-01-14', '2026-03-15']) {
      const s = seasonFor(today, null)
      assert.equal(riskActive(s), true, today)
      assert.equal(s.source, 'fallback')
    }
    assert.deepEqual(seasonFor('2026-01-14', null), { phase: 'during', start: '2025-11-15', end: '2026-03-15', source: 'fallback' })
  })

  it('is inactive between seasons and points at the next one', () => {
    for (const today of ['2026-03-16', '2026-07-01', '2026-11-14']) {
      const s = seasonFor(today, null)
      assert.deepEqual(s, { phase: 'before', start: '2026-11-15', end: '2027-03-15', source: 'fallback' }, today)
      assert.equal(riskActive(s), false)
    }
    assert.equal(offSeasonMessage(seasonFor('2026-10-18', null)), '১৫ নভেম্বর ২০২৬ থেকে ঝুঁকির খবর দেব')
  })
})

describe('seasonFor paddy', () => {
  it('runs from transplant + 15 to + 110 days', () => {
    const s = seasonFor('2026-01-20', '2026-01-10', 'boro')
    assert.deepEqual(s, { phase: 'before', start: '2026-01-25', end: '2026-04-30', source: 'planting' })
    assert.equal(offSeasonMessage(s, 'boro'), 'চারা লেগে গেলে, ২৫ জানুয়ারি ২০২৬ থেকে ঝুঁকির খবর দেব')
    assert.match(offSeasonMessage(seasonFor('2026-05-01', '2026-01-10', 'boro'), 'boro'), /নতুন ধান রুইলে তারিখ দিন/)
  })

  it('assumes Boro from 1 Jan to 15 May without a date, within one year', () => {
    assert.deepEqual(seasonFor('2026-03-01', null, 'boro'), { phase: 'during', start: '2026-01-01', end: '2026-05-15', source: 'fallback' })
    assert.deepEqual(seasonFor('2026-05-16', null, 'boro'), { phase: 'before', start: '2027-01-01', end: '2027-05-15', source: 'fallback' })
    assert.deepEqual(seasonFor('2026-12-31', null, 'boro'), { phase: 'before', start: '2027-01-01', end: '2027-05-15', source: 'fallback' })
  })

  it('assumes Aman from 15 Jul to 15 Nov without a date', () => {
    assert.equal(seasonFor('2026-10-20', null, 'aman').phase, 'during')
    assert.deepEqual(seasonFor('2026-11-16', null, 'aman'), { phase: 'before', start: '2027-07-15', end: '2027-11-15', source: 'fallback' })
    assert.equal(offSeasonMessage(seasonFor('2026-07-01', null, 'aman'), 'aman'), '১৫ জুলাই ২০২৬ থেকে ঝুঁকির খবর দেব')
  })
})
