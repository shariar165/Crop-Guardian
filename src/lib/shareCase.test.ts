import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mockDiagnosis } from '@/lib/diagnosis/mock'
import { caseSummary, whatsappUrl } from '@/lib/shareCase'
import { realConfig } from '@/lib/diagnosis/__fixtures__'

const DATE = '2026-10-19'

describe('caseSummary', () => {
  it('gives the date, place and a confident result', () => {
    assert.equal(
      caseSummary(mockDiagnosis('confident', realConfig), realConfig, DATE),
      [
        'Crop Guardian — আলুর পাতা (পরীক্ষামূলক অ্যাপ)',
        'তারিখ: ১৯ অক্টোবর ২০২৬',
        'এলাকা: শিবগঞ্জ, বগুড়া',
        'অ্যাপের ফল: নিশ্চিত — নাবি ধসা',
        'দুই ছবিতেই একই ফল: নাবি ধসা (নিশ্চিত)',
        'দয়া করে দেখে পরামর্শ দিন।',
      ].join('\n'),
    )
  })

  it('lists the candidates and the farmer’s answers when uncertain', () => {
    const record = { ...mockDiagnosis('uncertain', realConfig), answers: [{ question: 'rings', answer: 'no' as const }] }
    const text = caseSummary(record, realConfig, DATE)
    assert.match(text, /অ্যাপের ফল: নিশ্চিত নই — আগাম ধসা বা নাবি ধসা/)
    assert.match(text, /আপনার উত্তর: দাগের ভেতরে চাকতির মতো রিং নেই/)
    assert.match(text, /উত্তর মিলিয়ে বাকি: নাবি ধসা/)
  })

  it('says plainly when the app could not identify it', () => {
    assert.match(caseSummary(mockDiagnosis('unknown', realConfig), realConfig, DATE), /অ্যাপের ফল: চিনতে পারিনি\n/)
  })
})

it('puts the whole summary in the WhatsApp link', () => {
  const url = whatsappUrl('নাবি ধসা\nলাইন ২')
  assert.ok(url.startsWith('https://wa.me/?text='))
  assert.equal(decodeURIComponent(url.slice('https://wa.me/?text='.length)), 'নাবি ধসা\nলাইন ২')
})
