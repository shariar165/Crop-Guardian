import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bnDate, bnWeekday } from '@/lib/bn'

describe('bnDate', () => {
  it('writes a date in Bangla without a leading zero', () => {
    assert.equal(bnDate('2026-01-04'), '৪ জানুয়ারি ২০২৬')
    assert.equal(bnDate('2025-12-25'), '২৫ ডিসেম্বর ২০২৫')
  })
})

describe('bnWeekday', () => {
  it('names the weekday of a calendar date', () => {
    assert.equal(bnWeekday('2026-01-14'), 'বুধ')
    assert.equal(bnWeekday('2026-10-18'), 'রবি')
  })
})
