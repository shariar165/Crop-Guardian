import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { DIVISIONS, districtById, fullName, placeOf, unionById, upazilaById } from '@/lib/areas'

const districts = DIVISIONS.flatMap((v) => v.districts)
const upazilas = districts.flatMap((d) => d.upazilas)
const unions = upazilas.flatMap((u) => u.unions)

describe('areas', () => {
  it('covers every district of the Rangpur and Rajshahi divisions, and Munshiganj', () => {
    const rangpur = ['rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha']
    const rajshahi = ['rajshahi', 'chapainawabganj', 'naogaon', 'natore', 'bogura', 'joypurhat', 'sirajganj', 'pabna']
    const ids = (v: string) => DIVISIONS.find((d) => d.id === v)!.districts.map((d) => d.id).sort()
    assert.deepEqual(ids('rangpur'), [...rangpur].sort())
    assert.deepEqual(ids('rajshahi'), [...rajshahi].sort())
    assert.deepEqual(ids('dhaka'), ['munshiganj'])
  })

  it('gives every place a unique id and a Bengali name', () => {
    const all = [...districts, ...upazilas, ...unions]
    assert.equal(new Set(all.map((x) => x.id)).size, all.length)
    for (const x of all) assert.match(x.nameBn, /^[ঀ-৿][ঀ-৿\s-]*$/, x.id)
  })

  it('puts every union and upazila inside Bangladesh', () => {
    for (const x of [...upazilas, ...unions]) {
      assert.ok(x.lat > 20.5 && x.lat < 26.7 && x.lon > 88 && x.lon < 92.7, x.id)
    }
  })

  it('keeps the two Shibganj upazilas apart', () => {
    assert.equal(districtById(upazilaById('bogura-shibganj')!.districtId)!.nameBn, 'বগুড়া')
    assert.equal(districtById(upazilaById('chapainawabganj-shibganj')!.districtId)!.nameBn, 'চাঁপাইনবাবগঞ্জ')
  })

  it('still knows the old bare Shibganj union ids', () => {
    assert.equal(unionById('kichak')?.id, 'bogura-shibganj.kichak')
    assert.equal(unionById('shibganj-pourashava')?.nameBn, 'শিবগঞ্জ পৌরসভা')
    assert.equal(unionById('atlantis'), undefined)
    assert.equal(unionById('bogura-shibganj.atlantis'), undefined)
  })

  it('names a place by union and upazila, and in full for the officer', () => {
    const kichak = unionById('kichak')!
    assert.equal(placeOf(kichak).name, 'কিচক, শিবগঞ্জ')
    assert.equal(fullName(kichak), 'কিচক, শিবগঞ্জ, বগুড়া')
    assert.equal(placeOf(null).upazila.id, 'bogura-shibganj')
  })

  it('has a map for every upazila, with the same unions', () => {
    const index = readFileSync('src/lib/geo/shapes/index.ts', 'utf8')
    for (const u of upazilas) {
      const path = `src/lib/geo/shapes/${u.id}.json`
      assert.ok(existsSync(path) && index.includes(`'${u.id}'`), u.id)
      const shapes = JSON.parse(readFileSync(path, 'utf8')) as { unions: { id: string }[] }
      assert.deepEqual(shapes.unions.map((s) => s.id).sort(), u.unions.map((x) => x.id).sort(), u.id)
    }
  })
})
