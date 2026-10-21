import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CROP_IDS } from '@/lib/crops'
import { CLASS_CONTENT, sourceOf } from '@/lib/diagnosis/content'
import { classesOf } from '@/lib/diagnosis/crops'
import { knownList, photoLine, riskLine } from '@/lib/diagnosis/explain'
import { fixtureDiagnosis, realConfig } from '@/lib/diagnosis/__fixtures__'

describe('class content', () => {
  it("has advice for every class of every crop's model, and nothing else", () => {
    for (const crop of CROP_IDS) assert.deepEqual(Object.keys(CLASS_CONTENT[crop]).sort(), classesOf(crop).sort(), crop)
    for (const id of realConfig.diseases) assert.ok(CLASS_CONTENT.potato[id], id)
  })

  it('never gives a dose, only the label or the officer', () => {
    for (const crop of CROP_IDS) {
      for (const [id, c] of Object.entries(CLASS_CONTENT[crop])) {
        for (const step of c.steps) {
          assert.doesNotMatch(step, /[০-৯0-9]+\s*(মিলি|গ্রাম|কেজি|ml|g\b|kg)/i, `${crop} ${id}`)
          // A step that names something to apply says who sets the amount.
          if (/ছত্রাকনাশক|ট্রাইসাইক্লাজোল|স্ট্রোবিলুরিন|পটাশ|জিপসাম/.test(step) && !/দেবেন না/.test(step)) {
            assert.match(step, /লেবেল অনুযায়ী|কর্মকর্তা/, `${crop} ${id}: ${step}`)
          }
        }
      }
    }
  })

  it('cites a source for every class, over https', () => {
    for (const crop of CROP_IDS) {
      for (const id of classesOf(crop)) assert.match(sourceOf(crop, id).href, /^https:\/\//, `${crop} ${id}`)
    }
  })
})

describe('photoLine', () => {
  it('says once when both photos agree', () => {
    const r = fixtureDiagnosis('confident', realConfig).result
    assert.equal(photoLine(r, realConfig, 'potato'), 'দুই ছবিতেই একই ফল: নাবি ধসা (নিশ্চিত)')
  })

  it('names each photo when they differ', () => {
    assert.equal(
      photoLine(fixtureDiagnosis('uncertain', realConfig).result, realConfig, 'potato'),
      'পাতার উপরের দিক: আগাম ধসা (নিশ্চিত) · নিচের দিক: নাবি ধসা (নিশ্চিত)',
    )
    assert.equal(
      photoLine(fixtureDiagnosis('unknown', realConfig).result, realConfig, 'potato'),
      'পাতার উপরের দিক: নাবি ধসা (নিশ্চিত) · নিচের দিক: চিনতে পারিনি',
    )
  })
})

it('names the paddy photos as two leaves, not top and underside', () => {
  const r = fixtureDiagnosis('uncertain', realConfig).result
  assert.match(photoLine(r, realConfig, 'paddy'), /^প্রথম পাতা: .* · দ্বিতীয় পাতা: /)
})

describe('riskLine', () => {
  it("states today's risk and its reason", () => {
    assert.equal(riskLine({ today: 'danger', reason: 'আগামী ৩ দিন' }, 'potato'), 'আজ এলাকায় ধসার আবহাওয়া-ঝুঁকি: বিপদ। আগামী ৩ দিন')
  })

  it('labels the paddy blast risk as experimental', () => {
    assert.match(riskLine({ today: 'watch', reason: 'r' }, 'paddy'), /^আজ এলাকায় ব্লাস্টের আবহাওয়া-ঝুঁকি \(পরীক্ষামূলক\): সতর্ক।/)
  })

  it('says when the weather is unavailable instead of guessing', () => {
    assert.match(riskLine('unavailable', 'potato'), /পাওয়া যায়নি/)
  })
})

it('lists the classes the model knows, without "other"', () => {
  assert.equal(knownList(realConfig), 'আগাম ধসা, সুস্থ, নাবি ধসা')
})
