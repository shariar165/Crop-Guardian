import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isJpeg, parseCaseUpload } from '@/lib/cases'

const NOW = Date.parse('2026-10-20T06:00:00Z')
const GOOD = {
  sentAt: NOW - 60_000,
  unionId: 'kichak',
  decision: 'uncertain',
  candidates: ['early_blight', 'late_blight'],
  finalId: 'late_blight',
  answers: [{ question: 'rings', answer: 'no', extra: 'dropped' }],
}

describe('parseCaseUpload', () => {
  it('accepts a real case and keeps only the known fields', () => {
    const c = parseCaseUpload(GOOD, NOW)
    assert.ok(!('error' in c))
    assert.equal(c.sentAt.getTime(), GOOD.sentAt)
    assert.deepEqual(c.answers, [{ question: 'rings', answer: 'no' }])
  })

  it('stores the union by its full id, also from an old bare Shibganj one', () => {
    const old = parseCaseUpload(GOOD, NOW)
    assert.ok(!('error' in old))
    assert.equal(old.unionId, 'bogura-shibganj.kichak')
    const full = parseCaseUpload({ ...GOOD, unionId: 'bogura-shibganj.kichak' }, NOW)
    assert.ok(!('error' in full))
    assert.equal(full.unionId, 'bogura-shibganj.kichak')
  })

  it('takes a case without a crop, from an older phone, as potato', () => {
    const c = parseCaseUpload(GOOD, NOW)
    assert.ok(!('error' in c))
    assert.equal(c.crop, 'potato')
    const paddy = parseCaseUpload({ ...GOOD, crop: 'paddy' }, NOW)
    assert.ok(!('error' in paddy))
    assert.equal(paddy.crop, 'paddy')
    assert.deepEqual(parseCaseUpload({ ...GOOD, crop: 'wheat' }, NOW), { error: 'bad crop' })
  })

  it('allows no union and no final answer', () => {
    assert.ok(!('error' in parseCaseUpload({ ...GOOD, unionId: null, finalId: null }, NOW)))
  })

  it('refuses what the app would never send', () => {
    for (const bad of [
      null,
      { ...GOOD, unionId: 'atlantis' },
      { ...GOOD, decision: 'maybe' },
      { ...GOOD, candidates: ['<script>'] },
      { ...GOOD, finalId: 'healthy' },
      { ...GOOD, answers: [{ question: 'rings', answer: 'perhaps' }] },
      { ...GOOD, sentAt: NOW + 2 * 86_400_000 },
      { ...GOOD, sentAt: NOW - 200 * 86_400_000 },
    ]) {
      assert.ok('error' in parseCaseUpload(bad, NOW), JSON.stringify(bad))
    }
  })
})

it('recognises a JPEG by its first bytes', () => {
  assert.ok(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])))
  assert.ok(!isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47])))
})
