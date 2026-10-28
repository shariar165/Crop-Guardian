import assert from 'node:assert/strict'
import { test } from 'node:test'
import { historyMessages } from './answer'
import { BRAND_REFERRAL, checkQuestion, DOSE_LINE, hasBrand, hasDose, HISTORY_TURNS, MAX_ANSWER, MAX_QUESTION, PHONE_MASK, redactPhones, sanitizeAnswer, validSources } from './guard'
import { KB, searchText } from './kb'
import { ANSWER_INSTRUCTIONS, answerPrompt, REWRITE_INSTRUCTIONS } from './prompts'
import { keywordQuery, rrf } from './retrieve'
import { stemBn, stemmedText, wordsOf } from './tokens'

test('Bengali suffixes are stripped so inflected words find their root', () => {
  assert.equal(stemBn('আলুর'), 'আলু')
  assert.equal(stemBn('পাতায়'), 'পাতা')
  assert.equal(stemBn('রোগের'), 'রোগ')
  assert.equal(stemBn('জমিতে'), 'জমি')
  assert.equal(stemBn('কর্মকর্তাকে'), 'কর্মকর্তা')
  assert.equal(stemBn('কুয়াশায়'), 'কুয়াশা')
  // Too short to strip: "সার" (fertiliser) is a word of its own.
  assert.equal(stemBn('সার'), 'সার')
})

test('words split on spaces and Bengali punctuation, keeping vowel signs', () => {
  assert.deepEqual(wordsOf('নাবি ধসা, কুয়াশায়।'), ['নাবি', 'ধসা', 'কুয়াশায়'.normalize('NFC')])
  assert.equal(stemmedText('আলুর আলু'), 'আলু')
})

test('the keyword query ORs the stems and never passes raw syntax through', () => {
  assert.equal(keywordQuery('আলুর পাতায় দাগ'), 'আলু OR পাতা OR দাগ')
  assert.equal(keywordQuery('!!! ???'), '')
})

test('reciprocal rank fusion favours ids that rank high in several lists', () => {
  assert.deepEqual(rrf([['a', 'b', 'c'], ['b', 'a', 'd'], ['b']]), ['b', 'a', 'c', 'd'])
  assert.deepEqual(rrf([]), [])
})

test('questions are trimmed, limited and stripped of phone numbers', () => {
  assert.deepEqual(checkQuestion('  '), { ok: false, reason: 'empty' })
  assert.deepEqual(checkQuestion(42), { ok: false, reason: 'empty' })
  assert.deepEqual(checkQuestion('ক'.repeat(MAX_QUESTION + 1)), { ok: false, reason: 'long' })
  assert.deepEqual(checkQuestion(' আলুতে  দাগ '), { ok: true, text: 'আলুতে দাগ' })
  assert.equal(redactPhones('আমাকে ০১৭১২৩৪৫৬৭৮ নম্বরে ফোন দিন'), `আমাকে ${PHONE_MASK} নম্বরে ফোন দিন`)
  assert.equal(redactPhones('call +8801712345678 now'), `call ${PHONE_MASK} now`)
  // Not a phone number: a date and a percentage stay.
  assert.equal(redactPhones('২০২৬ সালে ৯০%'), '২০২৬ সালে ৯০%')
})

test('a dose is recognised in Bengali or English digits, but a percentage is not', () => {
  assert.ok(hasDose('২ গ্রাম মেশান'))
  assert.ok(hasDose('2.5 ml per litre'))
  assert.ok(hasDose('প্রতি লিটার পানিতে মেশান'))
  assert.ok(hasDose('১০ কেজি দিন'))
  assert.ok(!hasDose('৯০% আর্দ্রতা টানা দুই দিন'))
  assert.ok(!hasDose('ফলন ৩০% পর্যন্ত কমে'))
  assert.ok(!hasDose(DOSE_LINE))
})

test('a sentence with a dose is dropped and the label line added', () => {
  const { text, redacted } = sanitizeAnswer('আক্রান্ত গাছ তুলে ফেলুন। প্রতি লিটারে ২.৫ গ্রাম ছত্রাকনাশক দিন। ৫–৭ দিন পর আবার দেখুন।')
  assert.ok(redacted)
  assert.ok(!hasDose(text), text)
  assert.ok(text.includes('আক্রান্ত গাছ তুলে ফেলুন।') && text.includes('আবার দেখুন।') && text.includes(DOSE_LINE))
  assert.deepEqual(sanitizeAnswer('ঠিক আছে।'), { text: 'ঠিক আছে।', redacted: false, named: false })
})

test('a brand is recognised in English, Bengali and their variants, but a chemical group is not', () => {
  assert.ok(hasBrand('Ridomil Gold দিন'))
  assert.ok(hasBrand('DITHANE M-45'))
  assert.ok(hasBrand('melody  duo'))
  assert.ok(hasBrand('ডায়থেন দিন'))
  assert.ok(hasBrand('সিকিউর ভালো'))
  assert.ok(hasBrand('রিডো\u200cমিল দিন'), 'a zero-width non-joiner inside the name')
  assert.ok(!hasBrand('অনুমোদিত ছত্রাকনাশক স্প্রে করুন'))
  assert.ok(!hasBrand('ট্রাইসাইক্লাজোল বা স্ট্রোবিলুরিন গ্রুপের ছত্রাকনাশক'))
  assert.ok(!hasBrand('a secure score, a tilt'))
  assert.ok(!hasBrand(BRAND_REFERRAL))
})

test('an answer that names a brand becomes the officer referral', () => {
  assert.deepEqual(sanitizeAnswer('আক্রান্ত গাছ তুলে ফেলুন। রিডোমিল গোল্ড স্প্রে করুন।'), { text: BRAND_REFERRAL, redacted: false, named: true })
  assert.ok(!hasDose(BRAND_REFERRAL) && BRAND_REFERRAL.includes('লেবেল অনুযায়ী'))
})

test('a long answer is cut at a sentence, within the limit', () => {
  const { text } = sanitizeAnswer('পাতা দেখুন। '.repeat(200))
  assert.ok(text.length <= MAX_ANSWER)
  assert.ok(text.endsWith('।'))
})

test('only sources the model was shown can be cited', () => {
  assert.deepEqual(validSources(['potato.blight', 'made.up', 'potato.blight'], ['potato.blight', 'guide.risk']), ['potato.blight'])
})

test('only the last few turns go back to the model, phone numbers removed', () => {
  const turns = Array.from({ length: 6 }, (_, i) => ({ q: `প্রশ্ন ${i} ০১৭১২৩৪৫৬৭৮`, a: `উত্তর ${i}` }))
  const messages = historyMessages([...turns, { q: 5 }, 'x'])
  assert.equal(messages.length, HISTORY_TURNS * 2)
  assert.equal(messages[0].content, `প্রশ্ন 3 ${PHONE_MASK}`)
  assert.deepEqual(historyMessages('nope'), [])
})

test('the knowledge base has unique ids, a source and a screen for every chunk', () => {
  assert.equal(new Set(KB.map((c) => c.id)).size, KB.length)
  for (const c of KB) {
    assert.ok(c.title && c.text && c.source && c.context, c.id)
    assert.match(c.href, /^\//, c.id)
    assert.ok(searchText(c).includes(c.text))
  }
  for (const prefix of ['potato.', 'guide.', 'disease.', 'risk.']) assert.ok(KB.some((c) => c.id.startsWith(prefix)), prefix)
})

// The assistant can only repeat what it is given, so the knowledge base itself must hold no dose.
test('the knowledge base never gives a dose', () => {
  for (const c of KB) assert.ok(!hasDose(`${c.title} ${c.text}`), c.id)
})

// Built only from screen text, so this also covers the guides, diagnosis advice and crop decisions.
test('the knowledge base never names a medicine brand', () => {
  for (const c of KB) assert.ok(!hasBrand(`${c.title} ${c.text}`), c.id)
})

test('the prompts forbid doses, and their examples follow the rule', () => {
  assert.ok(ANSWER_INSTRUCTIONS.includes(DOSE_LINE))
  const examples = [...ANSWER_INSTRUCTIONS.matchAll(/<answer>([^<]+)<\/answer>/g)].map((m) => m[1])
  assert.ok(examples.length >= 3)
  for (const e of examples) assert.ok(!hasDose(e) && !hasBrand(e), e)
})

// Fixed text is what the provider caches; a date or place in it would break the cache every day.
test('the cached instructions hold nothing that changes per question', () => {
  for (const text of [ANSWER_INSTRUCTIONS, REWRITE_INSTRUCTIONS]) assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}|\$\{/)
  const prompt = answerPrompt({ question: 'প্রশ্ন', chunks: KB.slice(0, 2), place: 'কিচক, শিবগঞ্জ', today: '2026-12-20' })
  assert.ok(prompt.includes(`<source id="${KB[0].id}"`) && prompt.includes('কিচক, শিবগঞ্জ') && prompt.includes('2026-12-20'))
  assert.ok(answerPrompt({ question: 'q', chunks: [], place: 'p', today: 't' }).includes('(none found)'))
})

test('every eval case names chunks that exist, and ids are unique', async () => {
  const { EVAL_SET } = await import('./evalSet')
  assert.equal(new Set(EVAL_SET.map((c) => c.id)).size, EVAL_SET.length)
  const ids = new Set(KB.map((c) => c.id))
  for (const c of EVAL_SET) for (const s of c.sources ?? []) assert.ok(ids.has(s), `${c.id}: ${s}`)
})

test('a question is never mistaken for a greeting', async () => {
  const { looksLikeQuestion } = await import('./guard')
  for (const q of ['ছত্রাকনাশক প্রতি লিটারে কত গ্রাম দেব?', 'আলু কখন লাগাব', 'পাতায় দাগ কেন', 'নমস্কার, আমার আলুর পাতা সব হলুদ হয়ে যাচ্ছে দেখছি']) assert.ok(looksLikeQuestion(q), q)
  for (const g of ['আসসালামু আলাইকুম', 'নমস্কার', 'ধন্যবাদ', 'hello']) assert.ok(!looksLikeQuestion(g), g)
})
