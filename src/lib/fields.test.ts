import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inSeason, mainField, parseFields } from '@/lib/fields'
import { spraysKey } from '@/lib/sprayLog'

describe('parseFields', () => {
  it('turns the old planting date into the potato field when nothing else is stored', () => {
    assert.deepEqual(parseFields(null, '2025-11-01'), [{ season: 'potato', planted: '2025-11-01' }])
    assert.deepEqual(parseFields(null, null), [])
    assert.deepEqual(parseFields(null, '2025-02-30'), [])
  })

  it('prefers the stored fields over the old date, even when none are left', () => {
    assert.deepEqual(parseFields('[]', '2025-11-01'), [])
    assert.deepEqual(parseFields('[{"season":"boro","planted":"2026-01-10"}]', '2025-11-01'), [{ season: 'boro', planted: '2026-01-10' }])
  })

  it('keeps valid fields only, one per season, in season order', () => {
    const raw = JSON.stringify([
      { season: 'aman', planted: '2026-07-20' },
      { season: 'potato', planted: '2025-11-01' },
      { season: 'potato', planted: '2025-12-01' },
      { season: 'wheat', planted: '2025-12-01' },
      { season: 'boro', planted: 'soon' },
      null,
      'boro',
    ])
    assert.deepEqual(parseFields(raw, null), [
      { season: 'potato', planted: '2025-11-01' },
      { season: 'aman', planted: '2026-07-20' },
    ])
  })

  it('treats broken JSON as no fields', () => {
    assert.deepEqual(parseFields('{', '2025-11-01'), [])
    assert.deepEqual(parseFields('{"season":"potato"}', null), [])
  })
})

describe('mainField', () => {
  const potato = { season: 'potato' as const, planted: '2025-11-01' }
  const boro = { season: 'boro' as const, planted: '2026-01-10' }

  it('follows the season chosen on Home, else the first in season, else the first', () => {
    assert.equal(mainField([potato, boro], '2026-02-01', 'boro'), boro)
    // On 1 Mar potato (to 9 Feb) is over and Boro is in the field.
    assert.equal(mainField([potato, boro], '2026-03-01', null), boro)
    assert.equal(mainField([potato, boro], '2026-06-01', null), potato)
    assert.equal(mainField([], '2026-06-01', 'boro'), null)
  })

  it('tells which fields are in season', () => {
    assert.equal(inSeason(potato, '2025-12-01'), true)
    assert.equal(inSeason(boro, '2025-12-01'), false)
  })
})

describe('spraysKey', () => {
  it('keeps potato on the key from before fields', () => {
    assert.equal(spraysKey('potato'), 'crop-guardian:sprays')
    assert.equal(spraysKey('boro'), 'crop-guardian:sprays:boro')
  })
})
