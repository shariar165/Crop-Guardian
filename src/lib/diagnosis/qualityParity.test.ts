// The camera's photo check must not turn away the notebook's own photos: every parity image of
// every crop passes it, with that crop's "too far" line, as a gallery upload would.
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { isAcceptable } from '@/lib/imageQuality'
import { qualityOfFile } from '@/lib/imageQualityNode'
import { leafNearOf, PHOTO_CROPS } from './crops'
import { parityDirOf, parityFixturesOf } from './__fixtures__'

for (const crop of PHOTO_CROPS) {
  const fixtures = parityFixturesOf(crop)
  describe(`the camera check on the ${crop} parity images`, () => {
    it('passes every one', { skip: fixtures.length === 0 && `${crop} parity fixtures not exported yet` }, async () => {
      for (const f of fixtures) {
        const r = await qualityOfFile(join(parityDirOf(crop), f.file), leafNearOf(crop))
        assert.ok(isAcceptable(r), `${crop}/${f.file}: ${JSON.stringify(r)}`)
      }
    })
  })
}
