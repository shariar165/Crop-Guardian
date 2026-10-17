import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addDays, isIsoDate } from '@/lib/weather'

describe('isIsoDate', () => {
  it('accepts real calendar dates', () => {
    for (const d of ['2026-01-14', '2024-02-29', '1999-12-31']) assert.ok(isIsoDate(d), d)
  })

  it('rejects impossible dates and other formats', () => {
    for (const d of ['2025-02-29', '2025-02-30', '2025-13-01', '2025-1-14', '14-01-2025', '', 'today']) {
      assert.equal(isIsoDate(d), false, d)
    }
  })
})

describe('addDays', () => {
  it('crosses month and year ends', () => {
    assert.equal(addDays('2025-12-31', 1), '2026-01-01')
    assert.equal(addDays('2024-03-01', -1), '2024-02-29')
  })
})
