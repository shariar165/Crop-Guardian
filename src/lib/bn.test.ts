import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bnDate, bnDayMonth, bnGenitive, bnWeekday } from '@/lib/bn'

describe('bnDate', () => {
  it('writes a date in Bangla without a leading zero', () => {
    assert.equal(bnDate('2026-01-04'), '৪ জানুয়ারি ২০২৬')
    assert.equal(bnDayMonth('2026-11-14'), '১৪ নভেম্বর')
  })

  it('makes the possessive of every diagnosis label', () => {
    const cases: [string, string][] = [
      ['নাবি ধসা', 'নাবি ধসার'], ['সুস্থ', 'সুস্থের'], ['ব্লাস্ট', 'ব্লাস্টের'], ['অন্য রোগ', 'অন্য রোগের'],
      ['বাদামি দাগ', 'বাদামি দাগের'], ['খোল পোড়া', 'খোল পোড়ার'], ['টুংরো', 'টুংরোর'],
    ]
    for (const [word, genitive] of cases) assert.equal(bnGenitive(word), genitive)
    assert.equal(bnDate('2025-12-25'), '২৫ ডিসেম্বর ২০২৫')
  })
})

describe('bnWeekday', () => {
  it('names the weekday of a calendar date', () => {
    assert.equal(bnWeekday('2026-01-14'), 'বুধ')
    assert.equal(bnWeekday('2026-10-18'), 'রবি')
  })
})
