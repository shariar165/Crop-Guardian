import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CLASS_CONTENT } from '@/lib/diagnosis/content'
import { knownList, photoLine, riskLine } from '@/lib/diagnosis/explain'
import { mockDiagnosis } from '@/lib/diagnosis/mock'
import { realConfig } from '@/lib/diagnosis/__fixtures__'

describe('class content', () => {
  it('has advice for every class the model can name', () => {
    for (const id of realConfig.diseases) assert.ok(CLASS_CONTENT[id], id)
  })

  it('never gives a dose, only the label', () => {
    for (const [id, c] of Object.entries(CLASS_CONTENT)) {
      for (const step of c.steps) assert.doesNotMatch(step, /[০-৯0-9]+\s*(মিলি|গ্রাম|ml|g\b)/i, id)
    }
  })
})

describe('photoLine', () => {
  it('says once when both photos agree', () => {
    const r = mockDiagnosis('confident', realConfig).result
    assert.equal(photoLine(r, realConfig), 'দুই ছবিতেই একই ফল: নাবি ধসা (নিশ্চিত)')
  })

  it('names each photo when they differ', () => {
    assert.equal(
      photoLine(mockDiagnosis('uncertain', realConfig).result, realConfig),
      'পাতার উপরের দিক: আগাম ধসা (নিশ্চিত) · নিচের দিক: নাবি ধসা (নিশ্চিত)',
    )
    assert.equal(
      photoLine(mockDiagnosis('unknown', realConfig).result, realConfig),
      'পাতার উপরের দিক: নাবি ধসা (নিশ্চিত) · নিচের দিক: চিনতে পারিনি',
    )
  })
})

describe('riskLine', () => {
  it("states today's risk and its reason", () => {
    assert.equal(riskLine({ today: 'danger', reason: 'আগামী ৩ দিন' }), 'আজ এলাকায় ধসার আবহাওয়া-ঝুঁকি: বিপদ। আগামী ৩ দিন')
  })

  it('says when the weather is unavailable instead of guessing', () => {
    assert.match(riskLine('unavailable'), /পাওয়া যায়নি/)
  })
})

it('lists the classes the model knows, without "other"', () => {
  assert.equal(knownList(realConfig), 'আগাম ধসা, সুস্থ, নাবি ধসা')
})
