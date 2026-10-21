import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { showcaseActive } from '@/lib/showcase'

describe('showcaseActive', () => {
  it('is off unless SHOWCASE_UNTIL is a real date', () => {
    for (const value of [undefined, '', 'yes', '2026-02-30', '25-10-2026']) {
      assert.equal(showcaseActive({ SHOWCASE_UNTIL: value }, '2026-10-20'), false, String(value))
    }
  })

  it('is on through the given day and off the day after', () => {
    const env = { SHOWCASE_UNTIL: '2026-10-25' }
    assert.equal(showcaseActive(env, '2026-10-20'), true)
    assert.equal(showcaseActive(env, '2026-10-25'), true)
    assert.equal(showcaseActive(env, '2026-10-26'), false)
  })
})
