import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { followUpState, parseFollowUp } from '@/lib/followUp'

const f = { crop: 'potato' as const, id: 'late_blight', date: '2026-11-10' }

describe('followUp', () => {
  it('waits until day 5, shows through day 14, then expires', () => {
    assert.deepEqual(followUpState(f, '2026-11-14'), { show: false, expired: false })
    assert.deepEqual(followUpState(f, '2026-11-15'), { show: true, days: 5 })
    assert.deepEqual(followUpState(f, '2026-11-24'), { show: true, days: 14 })
    assert.deepEqual(followUpState(f, '2026-11-25'), { show: false, expired: true })
  })

  it('reads only a well-formed follow-up', () => {
    assert.deepEqual(parseFollowUp(JSON.stringify(f)), f)
    assert.equal(parseFollowUp(null), null)
    assert.equal(parseFollowUp('not json'), null)
    assert.equal(parseFollowUp(JSON.stringify({ ...f, crop: 'maize' })), null)
    assert.equal(parseFollowUp(JSON.stringify({ ...f, date: '10 Nov' })), null)
  })
})
