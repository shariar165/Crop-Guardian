import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SEASON_IDS } from '@/lib/crops'
import { addMonths } from '@/lib/dates'
import { plantingChips } from '@/lib/plantingChips'

describe('plantingChips', () => {
  it('offers today back to a month ago, never a future date', () => {
    const chips = plantingChips('2026-11-21', 'potato')
    assert.deepEqual(
      chips.map((c) => c.date),
      ['2026-11-21', '2026-11-14', '2026-11-07', '2026-10-31', '2026-10-21'],
    )
    for (const id of SEASON_IDS) for (const c of plantingChips('2026-11-21', id)) assert.ok(c.date <= '2026-11-21')
  })

  it('keeps every chip inside the year range the dropdowns offer', () => {
    for (const c of plantingChips('2026-01-05', 'boro')) assert.ok(c.date >= '2025-01-01', c.date)
  })
})

describe('addMonths', () => {
  it('moves by calendar months and clamps to the month end', () => {
    assert.equal(addMonths('2026-03-31', -1), '2026-02-28')
    assert.equal(addMonths('2026-01-15', -1), '2025-12-15')
    assert.equal(addMonths('2025-12-31', 2), '2026-02-28')
  })
})
