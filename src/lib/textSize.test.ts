import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { TEXT_SIZE_KEY, TEXT_SIZE_SCRIPT, textSizeOf } from './textSize'

describe('text size', () => {
  it('is normal unless large was chosen', () => {
    assert.equal(textSizeOf(null), 'normal')
    assert.equal(textSizeOf('junk'), 'normal')
    assert.equal(textSizeOf('large'), 'large')
  })

  it('applies the saved size before the first paint, and never throws', () => {
    assert.ok(TEXT_SIZE_SCRIPT.includes(`'${TEXT_SIZE_KEY}'`))
    assert.ok(TEXT_SIZE_SCRIPT.startsWith('try{'))
  })
})
