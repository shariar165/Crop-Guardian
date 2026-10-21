import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { caseSummary, uploadFields, whatsappUrl } from '@/lib/shareCase'
import { fixtureDiagnosis, realConfig } from '@/lib/diagnosis/__fixtures__'

const DATE = '2026-10-19'
const PLACE = 'কিচক, শিবগঞ্জ'

describe('caseSummary', () => {
  it('gives the date, place and a confident result', () => {
    assert.equal(
      caseSummary(fixtureDiagnosis('confident', realConfig), realConfig, DATE, PLACE),
      [
        'Crop Guardian — আলুর পাতা (পরীক্ষামূলক অ্যাপ)',
        'তারিখ: ১৯ অক্টোবর ২০২৬',
        'এলাকা: কিচক, শিবগঞ্জ',
        'অ্যাপের ফল: নিশ্চিত — নাবি ধসা',
        'দুই ছবিতেই একই ফল: নাবি ধসা (নিশ্চিত)',
        'দয়া করে দেখে পরামর্শ দিন।',
      ].join('\n'),
    )
  })

  it('lists the candidates and the farmer’s answers when uncertain', () => {
    const record = { ...fixtureDiagnosis('uncertain', realConfig), answers: [{ question: 'rings', answer: 'no' as const }] }
    const text = caseSummary(record, realConfig, DATE, PLACE)
    assert.match(text, /অ্যাপের ফল: নিশ্চিত নই — আগাম ধসা বা নাবি ধসা/)
    assert.match(text, /আপনার উত্তর: দাগের ভেতরে চাকতির মতো রিং নেই/)
    assert.match(text, /উত্তর মিলিয়ে বাকি: নাবি ধসা/)
  })

  it('says plainly when the app could not identify it', () => {
    assert.match(caseSummary(fixtureDiagnosis('unknown', realConfig), realConfig, DATE, PLACE), /অ্যাপের ফল: চিনতে পারিনি\n/)
  })
})

it('uploads the result, the final answer and the union, not the probabilities', () => {
  const diagnosis = { ...fixtureDiagnosis('uncertain', realConfig), answers: [{ question: 'rings', answer: 'no' as const }] }
  const fields = uploadFields({ sentAt: 1, diagnosis, photos: [], via: 'share', unionId: 'kichak' })
  assert.deepEqual(fields, {
    sentAt: 1,
    crop: 'potato',
    unionId: 'kichak',
    decision: 'uncertain',
    candidates: diagnosis.result.candidates,
    finalId: 'late_blight',
    answers: [{ question: 'rings', answer: 'no' }],
  })
})

it('titles a paddy case as paddy', () => {
  const record = { ...fixtureDiagnosis('confident', realConfig), crop: 'paddy' as const }
  assert.match(caseSummary(record, realConfig, DATE, PLACE), /^Crop Guardian — ধানের পাতা \(পরীক্ষামূলক অ্যাপ\)\n/)
  assert.equal(uploadFields({ sentAt: 1, diagnosis: record, photos: [], via: 'share' }).crop, 'paddy')
})

it('puts the whole summary in the WhatsApp link', () => {
  const url = whatsappUrl('নাবি ধসা\nলাইন ২')
  assert.ok(url.startsWith('https://wa.me/?text='))
  assert.equal(decodeURIComponent(url.slice('https://wa.me/?text='.length)), 'নাবি ধসা\nলাইন ২')
})
