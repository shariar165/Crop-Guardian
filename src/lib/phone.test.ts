import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatBdPhone, normalizeBdPhone } from '@/lib/phone'

describe('normalizeBdPhone', () => {
  it('accepts the ways a number is written in Bangladesh', () => {
    for (const input of ['01712345678', '+8801712345678', '8801712345678', '1712345678', '017 1234 5678', '01712-345678', '+880 1712-345678']) {
      assert.equal(normalizeBdPhone(input), '+8801712345678', input)
    }
  })

  it('reads Bengali digits', () => {
    assert.equal(normalizeBdPhone('০১৯১২৩৪৫৬৭৮'), '+8801912345678')
  })

  it('accepts every mobile operator prefix 013–019', () => {
    for (const p of [3, 4, 5, 6, 7, 8, 9]) assert.equal(normalizeBdPhone(`01${p}12345678`), `+8801${p}12345678`)
  })

  it('rejects landlines, other countries and wrong lengths', () => {
    for (const input of ['', '01212345678', '0171234567', '017123456789', '+911712345678', '0171234567a', '+88+01712345678']) {
      assert.equal(normalizeBdPhone(input), null, input)
    }
  })

  it('is idempotent, so the server can check the client already normalized', () => {
    assert.equal(normalizeBdPhone('+8801712345678'), '+8801712345678')
  })
})

describe('formatBdPhone', () => {
  it('writes the local number in Bengali digits', () => {
    assert.equal(formatBdPhone('+8801712345678'), '০১৭১২-৩৪৫৬৭৮')
  })
})
