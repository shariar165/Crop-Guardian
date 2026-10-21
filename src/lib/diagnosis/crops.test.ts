import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CROP_IDS } from '@/lib/crops'
import { classesOf, cropOfRecord, PHOTO_CROPS, PHOTO_SPECS } from '@/lib/diagnosis/crops'
import { cropFromParam, defaultPhotoCrop } from '@/lib/diagnosis/pickCrop'
import { configOf, configPathOf, modelPathOf } from '@/lib/diagnosis/__fixtures__'

describe('each crop the camera can diagnose', () => {
  for (const crop of PHOTO_CROPS) {
    it(`${crop}: has its exported config and model in public/`, () => {
      const config = configOf(crop)
      assert.ok(config, `${configPathOf(crop)} is missing`)
      assert.ok(existsSync(modelPathOf(crop, config)), `${config.modelFile} is missing`)
    })

    it(`${crop}: the config names the classes and Bengali labels the advice was written for`, () => {
      const config = configOf(crop)!
      assert.deepEqual([...config.diseases].sort(), [...classesOf(crop)].sort())
      for (const id of config.diseases) assert.equal(config.labelsBn[id], PHOTO_SPECS[crop].labelsBn[id], id)
    })
  }

  it('lists every crop whose model has been exported', () => {
    for (const crop of CROP_IDS) {
      if (configOf(crop)) assert.ok(PHOTO_CROPS.includes(crop), `${crop}'s model is in public/: add it to PHOTO_CROPS`)
    }
  })
})

describe('the camera’s crop', () => {
  const TODAY = '2026-12-10'

  it('is potato when the farmer has no fields', () => {
    assert.equal(defaultPhotoCrop([], null, TODAY), 'potato')
  })

  it('skips crops without a model', () => {
    const paddyOnly = [{ season: 'aman' as const, planted: '2026-09-01' }]
    assert.equal(defaultPhotoCrop(paddyOnly, 'aman', TODAY), PHOTO_CROPS.includes('paddy') ? 'paddy' : 'potato')
  })

  it('takes the field Home last showed over others in season', () => {
    const fields = [
      { season: 'potato' as const, planted: '2026-11-20' },
      { season: 'boro' as const, planted: '2026-11-20' },
    ]
    assert.equal(defaultPhotoCrop(fields, 'potato', TODAY), 'potato')
  })

  it('accepts a crop in the link only if it can be diagnosed', () => {
    assert.equal(cropFromParam('potato'), 'potato')
    assert.equal(cropFromParam('wheat'), null)
    assert.equal(cropFromParam(null), null)
    assert.equal(cropFromParam('paddy'), PHOTO_CROPS.includes('paddy') ? 'paddy' : null)
  })
})

it('reads old diagnosis records, saved without a crop, as potato', () => {
  assert.equal(cropOfRecord({}), 'potato')
  assert.equal(cropOfRecord({ crop: 'paddy' }), 'paddy')
})
