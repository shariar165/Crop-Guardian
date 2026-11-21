import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

const saved = process.env.SHOWCASE_UNTIL

describe('proxy', () => {
  afterEach(() => {
    if (saved === undefined) delete process.env.SHOWCASE_UNTIL
    else process.env.SHOWCASE_UNTIL = saved
  })

  it('sends a signed-out visitor to sign-in, coming back to the page', () => {
    delete process.env.SHOWCASE_UNTIL
    const res = proxy(new NextRequest('http://localhost/officer'))
    assert.equal(res.status, 307)
    assert.equal(res.headers.get('location'), 'http://localhost/sign-in?next=%2Fofficer')
  })

  // Otherwise requireUser/requireOfficer never get to hand out the showcase officer.
  it('lets a signed-out visitor through in showcase mode', () => {
    process.env.SHOWCASE_UNTIL = '2999-12-31'
    const res = proxy(new NextRequest('http://localhost/account'))
    assert.equal(res.headers.get('location'), null)
    assert.equal(res.headers.get('x-middleware-next'), '1')
  })

  it('redirects again once showcase mode has ended', () => {
    process.env.SHOWCASE_UNTIL = '2000-01-01'
    assert.equal(proxy(new NextRequest('http://localhost/account')).status, 307)
  })
})
