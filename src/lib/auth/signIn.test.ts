import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_NEXT, safeNext, signInError } from '@/lib/auth/signIn'

describe('safeNext', () => {
  it('keeps a path on this site', () => {
    assert.equal(safeNext('/officer'), '/officer')
    assert.equal(safeNext('/account?x=1'), '/account?x=1')
  })

  it('never sends the farmer to another site', () => {
    for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', 'account', '', undefined, ['/a', '/b']]) {
      assert.equal(safeNext(value), DEFAULT_NEXT, String(value))
    }
  })
})

describe('signInError', () => {
  it('maps Better Auth errors to what the farmer can do', () => {
    assert.equal(signInError({ code: 'INVALID_PHONE_NUMBER', status: 400 }), 'phone')
    assert.equal(signInError({ code: 'INVALID_OTP', status: 400 }), 'wrongCode')
    assert.equal(signInError({ code: 'OTP_EXPIRED', status: 400 }), 'expired')
    assert.equal(signInError({ code: 'OTP_NOT_FOUND', status: 400 }), 'expired')
    assert.equal(signInError({ code: 'TOO_MANY_ATTEMPTS', status: 403 }), 'tooMany')
    assert.equal(signInError({ status: 429 }), 'slowDown')
    assert.equal(signInError({ status: 500 }), 'failed')
    assert.equal(signInError(null), 'offline')
  })
})
