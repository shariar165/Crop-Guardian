import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rateOf, RATE, speechChunks } from './speech'

describe('speechChunks', () => {
  it('splits at Bengali sentence ends', () => {
    assert.deepEqual(speechChunks('আজ বিপদ। পাতা দেখুন। কী করবেন?'), ['আজ বিপদ।', 'পাতা দেখুন।', 'কী করবেন?'])
  })

  it('cuts a long sentence at spaces, never over the limit', () => {
    const text = Array.from({ length: 80 }, () => 'পাতা').join(' ') + '।'
    const chunks = speechChunks(text, 50)
    assert.ok(chunks.length > 1)
    assert.ok(chunks.every((c) => c.length <= 50))
    assert.equal(chunks.join(' '), text)
  })

  it('drops empty pieces', () => {
    assert.deepEqual(speechChunks('  \n।  '), ['।'])
    assert.deepEqual(speechChunks(''), [])
  })
})

describe('rateOf', () => {
  it('is normal unless slow was chosen', () => {
    assert.equal(rateOf(null), RATE.normal)
    assert.equal(rateOf('junk'), RATE.normal)
    assert.equal(rateOf('slow'), RATE.slow)
  })
})
