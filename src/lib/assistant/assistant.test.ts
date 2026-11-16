import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { ask, historyMessages } from './answer'
import { answerKey, KB_VERSION, normalizeQuestion } from './cache'
import { aboutMedicine, answerProblem, ASK_CROP, BRAND_REFERRAL, checkQuestion, DOSE_LINE, hasBrand, hasBrokenBengali, hasDose, hasForeignText, HISTORY_TURNS, MAX_ANSWER, MAX_HISTORY_ANSWER, MAX_QUESTION, NO_SOURCE, neverOffTopic, PASSAGE_INTRO, PHONE_MASK, redactPhones, OUT_OF_SCOPE, sanitizeAnswer, validSources } from './guard'
import { idsInScope, KB, questionScope, RULE_CHUNK, searchText } from './kb'
import { MODELS, withFallback } from './models'
import { ANSWER_INSTRUCTIONS, answerPrompt, REWRITE_INSTRUCTIONS } from './prompts'
import { keywordQuery, rrf, searchKb } from './retrieve'
import { stemBn, stemmedText, wordsOf } from './tokens'
import { PHOTO_SPECS } from '@/lib/diagnosis/crops'
import { fieldCrop } from '@/lib/fieldList'
import { GUIDE, RISK_RULE } from '@/lib/guide'

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
  assert.equal(messages[0].content, `প্রশ্ন ${6 - HISTORY_TURNS} ${PHONE_MASK}`)
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

// Each of these came out of a real eval run, and the judge model passed all but the garbled one.
test('an answer in another script or with prompt words is refused', () => {
  assert.ok(hasForeignText('পৌষ-মাঘ মাসে,也就 ডিসেম্বর-জানুয়ারি।'))
  assert.ok(hasForeignText('সOURCES-এ লাল রঙের কোনো বর্ণনা দেওয়া নেই।'))
  assert.ok(!hasForeignText('«আমার অ্যাকাউন্ট»-এ SMS চালু করুন, ছবি WhatsApp-এ পাঠান।'))
  assert.ok(!hasForeignText('বারি আলু-৭৭ সবচেয়ে ভালো।'))
})

test('garbled Bengali is found by its spelling, never in text the app itself shows', () => {
  for (const s of ['নতুনটা দেখিতে গেলে চিত্র তিুলুন।', 'শুুয কেবল দেখুন।', 'বেরকরাে ছচায়ায় রাথবং।']) assert.ok(hasBrokenBengali(s), s)
  for (const s of ['পৌষ-মাঘের কৌশল, বোতল আর মৌসুম।', 'পৌষ-মাঘের কৌশল, বোতল আর মৌসুম।'.normalize('NFD')]) assert.ok(!hasBrokenBengali(s), s)
  for (const c of KB) assert.ok(!hasBrokenBengali(`${c.title} ${c.text}`), c.id)
})

test('an answer may not say photos are uploaded unless a source does', () => {
  assert.equal(answerProblem('ধানের পাতা আপলোড করে রোগ চেনা যায়।', 'ফোনেই রোগ চেনা যায়।'), 'unsupported_claim')
  assert.equal(answerProblem('ছবি আপলোড হবে।', 'নেট এলে ছবি আপলোড হয়।'), null)
})

test('a question about medicine is never turned away as off topic', () => {
  for (const q of ['ডাইথেন না সিকিউর, কোনটা ভালো?', 'দোকানদার রিডোমিল দিতে চায়, এটা কি ভালো?', 'কোন কোম্পানির ওষুধ সবচেয়ে ভালো?', 'Which fungicide is best?']) assert.ok(aboutMedicine(q), q)
  for (const q of ['আজ ঢাকায় আলুর দাম কত?', 'শেয়ার বাজারে কোন শেয়ার কিনব?']) assert.ok(!aboutMedicine(q), q)
})

test("the app's own words are never off topic, and everyday questions still can be", () => {
  for (const q of ['হোমে লাল রং মানে কী?', 'আজ ঝুঁকি কেমন?', 'অ্যাপ কীভাবে চালাব?']) assert.ok(neverOffTopic(q), q)
  for (const q of ['আজ ঢাকায় আলুর দাম কত?', 'শেয়ার বাজারে কোন শেয়ার কিনব?']) assert.ok(!neverOffTopic(q), q)
})

// Every model the keys allow refuses or is refused: this is what a day of used-up free tiers looks
// like, and the farmer must get the officer, not an error.
function fakeGroq(answer: object | string, kind = 'question', crop: string | null = null, plan: object = {}) {
  process.env.GROQ_API_KEY = 'test'
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  delete process.env.OPENROUTER_API_KEY
  delete process.env.COHERE_API_KEY
  mock.method(console, 'error', () => {})
  return mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const rewrite = String(init.body).includes('You prepare a Bangladeshi')
    const content = rewrite ? JSON.stringify({ kind, queries: ['ওষুধ'], crop, disease: null, wantsRisk: false, wantsRule: false, ...plan }) : typeof answer === 'string' ? answer : JSON.stringify(answer)
    return Response.json({ id: 'x', created: 1, model: 'm', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
  })
}
// Every provider says no, as on a day of used-up free tiers. `rewriteWorks` keeps the reading step up.
function outOfQuota(rewriteWorks = false) {
  const reply = fakeGroq({})
  reply.mock.mockImplementation(async (_url: string, init: RequestInit) => {
    if (rewriteWorks && String(init.body).includes('You prepare a Bangladeshi')) {
      const content = JSON.stringify({ kind: 'question', queries: [], crop: null, disease: null, wantsRisk: false, wantsRule: false })
      return Response.json({ id: 'x', created: 1, model: 'm', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
    }
    return Response.json({ error: { message: 'Rate limit reached', code: 'rate_limit_exceeded' } }, { status: 429 })
  })
}
const askDeps = { query: async () => ({ rows: [] }), risk: async () => { throw new Error('unused') } }
const today = '2026-11-05'
const askIt = (question: string) => ask({ question, today }, askDeps as never)

afterEach(() => mock.restoreAll())

// Stands in for Postgres: every query that limits its ids is answered from KB within that limit.
const fakeDb = async (_sql: string, params: unknown[] = []) => {
  const ids = params.find(Array.isArray) as string[]
  return { rows: KB.filter((c) => ids.includes(c.id)) }
}

test('every chunk knows its crop: the rules and photo steps of one crop are never tagged for both', () => {
  const tag = (id: string) => KB.find((c) => c.id === id)!
  for (const id of ['guide.risk', 'risk.potato', 'photo.potato', 'potato.blight', 'disease.late_blight']) assert.equal(tag(id).crop, 'potato', id)
  for (const id of ['guide.paddy', 'risk.paddy', 'photo.paddy', 'disease.paddy.blast']) assert.equal(tag(id).crop, 'paddy', id)
  for (const c of KB.filter((k) => k.id.startsWith('potato.') || k.id.startsWith('disease.paddy.'))) assert.notEqual(c.crop, null, c.id)
})

test("each crop's photo chunk stands alone, with the two photos from PHOTO_SPECS and the guide's tips", () => {
  const text = (id: string) => KB.find((c) => c.id === id)!.text
  assert.equal(KB.find((c) => c.id === 'guide.photo'), undefined)
  for (const crop of ['potato', 'paddy'] as const) {
    const { top, under } = PHOTO_SPECS[crop].photos
    for (const s of [top.title, top.sub, under.title, under.sub, 'পাতার ছবি তুলুন', 'দিনের আলোয়']) assert.ok(text(`photo.${crop}`).includes(s), s)
    // The steps come first, so a short answer can't keep the tips and lose them.
    assert.ok(text(`photo.${crop}`).indexOf(under.title) < text(`photo.${crop}`).indexOf('দিনের আলোয়'))
  }
  assert.doesNotMatch(text('photo.paddy'), /নিচের দিক|উল্টে/)
  assert.doesNotMatch(text('photo.potato'), /আরেকটা আক্রান্ত/)
})

test('the SMS line holds for every crop, so it is not tagged with potato\'s rule', () => {
  const chunk = (id: string) => KB.find((c) => c.id === id)!
  assert.equal(chunk('guide.sms').crop, null)
  assert.match(chunk('guide.sms').text, /SMS চালু/)
  assert.doesNotMatch(chunk('guide.risk').text, /SMS চালু/)
})

test('no passage holds a brand, since one can reach a farmer word for word', () => {
  for (const c of KB) assert.ok(!hasBrand(`${c.title} ${c.text}`), c.id)
})

test('the rules the assistant quotes are the ones the guide shows, with their numbers', () => {
  for (const crop of ['potato', 'paddy'] as const) {
    assert.ok(GUIDE.some((s) => s.lines.includes(RISK_RULE[crop])), crop)
    assert.ok(KB.find((c) => c.id === RULE_CHUNK[crop])!.text.includes(RISK_RULE[crop]), crop)
  }
  assert.match(RISK_RULE.potato, /১০°সে.*৬ ঘণ্টা.*৯০%/)
  assert.match(RISK_RULE.paddy, /১৮–২৮°সে.*১০ ঘণ্টা.*৯০%/)
})

test("the farmer's own words set the crop, and the model only fills in what they leave open", () => {
  assert.equal(questionScope('ধানের পাতায় দাগ', { crop: 'potato' }).crop, 'paddy')
  assert.equal(questionScope('আলুর পাতায় দাগ', { crop: 'paddy' }).crop, 'potato')
  assert.equal(questionScope('পাতায় দাগ, কী করব?', { crop: 'paddy' }).crop, 'paddy')
  assert.equal(questionScope('পাতায় দাগ, কী করব?').crop, null)
  // Then the farmer's field; a crop in the words still wins over it.
  assert.equal(questionScope('পাতায় দাগ, কী করব?', {}, 'paddy').crop, 'paddy')
  assert.equal(questionScope('আলুর পাতায় দাগ', {}, 'paddy').crop, 'potato')
  // Things only one crop has name it too.
  assert.equal(questionScope('হিমাগারে রাখলে কি ওজন কমে?').crop, 'potato')
  assert.equal(questionScope('শীষের গোড়া কালো হয়েছে').crop, 'paddy')
  // Both crops named, and words that only contain ধান or আমন.
  assert.equal(questionScope('আলু আর ধানে কী তফাত?', { crop: 'paddy' }).crop, null)
  assert.equal(questionScope('এর সমাধান প্রধান সমস্যা, আমন্ত্রণ').crop, null)
  // A model's disease of the other crop is ignored.
  assert.deepEqual(questionScope('আলুর পাতায় দাগ', { disease: 'blast' }), { crop: 'potato', disease: null })
})

test('one named disease narrows the search, and comparing two keeps both', () => {
  assert.equal(questionScope('নাবি ধসা হলে পাতা কেমন হয়?').disease, 'late_blight')
  assert.equal(questionScope('আগাম ধসা চিনব কীভাবে?').disease, 'early_blight')
  assert.equal(questionScope('ধানের খোল পোড়া কেমন?').disease, 'sheath_blight')
  assert.equal(questionScope('নাবি ধসা আর আগাম ধসার তফাত কী?').disease, null)
  const late = idsInScope(questionScope('নাবি ধসা হলে পাতা কেমন হয়?'))
  assert.ok(late.includes('disease.late_blight') && !late.includes('disease.early_blight') && late.includes('potato.soil'))
})

test('a paddy question is never searched, or shown, a potato chunk', async () => {
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  delete process.env.COHERE_API_KEY
  mock.method(console, 'error', () => {})
  const scope = questionScope('ধানের পাতার ছবি কীভাবে তুলব?')
  const seen: string[][] = []
  const spy = async (sql: string, params: unknown[] = []) => {
    seen.push(params.find(Array.isArray) as string[])
    return fakeDb(sql, params)
  }
  const found = await searchKb(spy as never, 'ধানের পাতার ছবি কীভাবে তুলব?', ['পাতা ছবি', 'ফসল'], scope)
  assert.ok(found.length > 0 && idsInScope(scope).includes('photo.paddy'))
  const potato = KB.filter((c) => c.crop === 'potato').map((c) => c.id)
  for (const ids of seen) for (const id of potato) assert.ok(!ids.includes(id), id)
  for (const c of found) assert.ok(!potato.includes(c.id), c.id)
})

test('a rewrite model that misreads the crop still cannot show a paddy farmer potato advice', async () => {
  fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false }, 'question', 'potato')
  const r = await ask({ question: 'ধানের ব্লাস্ট রোগ কেমন?', today }, { ...askDeps, query: fakeDb } as never)
  assert.ok(r.meta.shown.length > 0)
  for (const id of r.meta.shown) assert.notEqual(KB.find((c) => c.id === id)!.crop, 'potato', id)
})

test('gpt-oss writes the answers first, and an interval must come from a cited passage', () => {
  assert.equal(MODELS.answer, 'groq/openai/gpt-oss-120b')
  assert.equal(MODELS.rewrite, 'groq/qwen/qwen3.8-27b')
  assert.match(ANSWER_INSTRUCTIONS, /spray interval only if it appears in a <source> you cite/)
})

const withDb = { ...askDeps, query: fakeDb } as never

test('models that read the passages and cite none mean the officer, not a passage they turned down', async () => {
  fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false })
  const r = await ask({ question: 'পাতা হলুদ হচ্ছে কেন?', today, field: 'potato' }, withDb)
  assert.equal(r.answer, NO_SOURCE)
  assert.equal(r.escalate, true)
  assert.equal(r.meta.fallback, 'referral')
  assert.deepEqual(r.meta.rejected, ['no_source', 'no_source'])
})

test('a medicine question with nothing found goes to the officer, with no answer model called', async () => {
  const calls = fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false })
  assert.equal((await askIt('কোন কোম্পানির ওষুধ সবচেয়ে ভালো?')).answer, BRAND_REFERRAL)
  assert.equal(calls.mock.callCount(), 1)
})

test('with every model out of quota the farmer reads the closest passage, labelled, with its source', async () => {
  outOfQuota()
  const r = await ask({ question: 'আলুর পাতায় দাগ, কী করব?', today }, withDb)
  assert.equal(r.meta.fallback, 'passage')
  assert.ok(r.answer.startsWith(PASSAGE_INTRO), r.answer)
  assert.equal(r.sources.length, 1)
  const passage = KB.find((c) => c.id === r.sources[0].id)!
  assert.equal(passage.crop, 'potato')
  // Word for word, up to the length the screen allows.
  assert.ok(r.answer.includes(passage.text.slice(0, 80)), r.answer)
  assert.ok(r.answer.length <= MAX_ANSWER)
  assert.equal(r.meta.readBy, null)
  assert.equal(r.meta.writtenBy, null)
})

test('a working reader with no writer also ends on the passage, not an error', async () => {
  outOfQuota(true)
  const r = await ask({ question: 'আলুর পাতায় দাগ, কী করব?', today }, withDb)
  assert.equal(r.meta.fallback, 'passage')
  assert.notEqual(r.meta.readBy, null)
})

test('answers refused for how they are written also end on the passage', async () => {
  fakeGroq({ answer: 'এটা 也就 ভালো।', sources: ['potato.soil'], escalate: false })
  const r = await ask({ question: 'আলুর মাটি কেমন হবে?', today }, withDb)
  assert.equal(r.meta.fallback, 'passage')
  assert.deepEqual(r.meta.rejected, ['foreign_text', 'foreign_text'])
})

test('a medicine question stays with the officer when the models are down, whatever was found', async () => {
  outOfQuota()
  assert.equal((await ask({ question: 'আলুতে কোন ওষুধ দেব?', today }, withDb)).answer, BRAND_REFERRAL)
})

test("with no crop in the words, the field in season decides, and no other crop's passage is shown", async () => {
  fakeGroq({ answer: 'লাল মানে বিপদ।', sources: ['risk.paddy'], escalate: false })
  const r = await ask({ question: 'হোমে লাল রং মানে কী?', today, field: 'paddy' }, withDb)
  assert.equal(r.askCrop, false)
  assert.ok(r.meta.shown.length > 0)
  for (const id of r.meta.shown) assert.notEqual(KB.find((c) => c.id === id)!.crop, 'potato', id)
})

test('with no crop in the words and no field, one crop\'s advice is not guessed: the farmer is asked', async () => {
  const calls = fakeGroq({ answer: 'never', sources: [], escalate: false })
  const r = await ask({ question: 'হোমে লাল রং মানে কী?', today }, withDb)
  assert.equal(r.answer, ASK_CROP)
  assert.equal(r.askCrop, true)
  assert.equal(r.meta.writtenBy, null)
  assert.equal(calls.mock.callCount(), 1)
})

test("a first question's crop is never the model's guess, and a follow-up's can be", async () => {
  fakeGroq({ answer: 'কিছু একটা।', sources: ['risk.paddy'], escalate: false }, 'question', 'paddy')
  assert.equal((await ask({ question: 'হোমে লাল রং মানে কী?', today }, withDb)).askCrop, true)

  mock.restoreAll()
  fakeGroq({ answer: 'লাল মানে বিপদ।', sources: ['risk.paddy'], escalate: false }, 'question', 'paddy')
  const history = [{ q: 'ধানের ব্লাস্ট কী?', a: 'ধানের একটি রোগ।' }]
  const r = await ask({ question: 'লাল রং মানে কী?', history, today }, withDb)
  assert.equal(r.askCrop, false)
  for (const id of r.meta.shown) assert.notEqual(KB.find((c) => c.id === id)!.crop, 'potato', id)
})

test('advice for every crop needs no crop, and another crop\'s passage is kept from the model', async () => {
  fakeGroq({ answer: 'নেট ছাড়াও চলে।', sources: ['guide.offline'], escalate: false })
  const neutralFirst = async (sql: string, params: unknown[] = []) => {
    const { rows } = await fakeDb(sql, params)
    return { rows: [...rows].sort((a, b) => Number(b.id === 'guide.offline') - Number(a.id === 'guide.offline')) }
  }
  const r = await ask({ question: 'নেট না থাকলে অ্যাপ চলবে?', today }, { ...askDeps, query: neutralFirst } as never)
  assert.equal(r.askCrop, false)
  assert.equal(r.answer, 'নেট ছাড়াও চলে।')
  for (const id of r.meta.shown) assert.equal(KB.find((c) => c.id === id)!.crop, null, id)
})

test('a question about the rule is answered with the rule itself, with no answer model', async () => {
  for (const crop of ['potato', 'paddy'] as const) {
    mock.restoreAll()
    const calls = fakeGroq({ answer: 'never', sources: [], escalate: false }, 'question', null, { wantsRule: true })
    const r = await ask({ question: 'অ্যাপ কীভাবে বোঝে কবে বিপদ?', today, field: crop }, withDb)
    assert.equal(r.answer, RISK_RULE[crop])
    assert.deepEqual(r.sources.map((s) => s.id), [RULE_CHUNK[crop]])
    assert.ok(r.note)
    assert.equal(calls.mock.callCount(), 1)
  }
})

test('a question about the rule with no crop known asks which', async () => {
  fakeGroq({ answer: 'never', sources: [], escalate: false }, 'question', null, { wantsRule: true })
  assert.equal((await ask({ question: 'অ্যাপ কীভাবে বোঝে কবে বিপদ?', today }, withDb)).askCrop, true)
})

test('a risk question gets the forecast in one model call, and its numbers count as sources', async () => {
  const calls = fakeGroq({ answer: '৫ নভেম্বর সতর্ক থাকুন।', sources: [], escalate: false }, 'question', null, { wantsRisk: true })
  const risk = async () => ({ place: 'কিচক', today: 'watch', reason: 'ভেজা', days: [{ date: '2026-11-05', risk: 'watch' }] })
  const r = await ask({ question: 'আজ আলুর ঝুঁকি কেমন?', today }, { ...askDeps, query: fakeDb, risk } as never)
  assert.equal(r.answer, '৫ নভেম্বর সতর্ক থাকুন।')
  assert.deepEqual(r.meta.toolCalls, ['todayRisk'])
  assert.equal(calls.mock.callCount(), 2)
  assert.match(String(calls.mock.calls[1].arguments[1]?.body), /forecast/)
})

test('a failed forecast does not stop the answer', async () => {
  fakeGroq({ answer: 'রোজ ঝুঁকির রং দেখুন।', sources: ['potato.soil'], escalate: false }, 'question', null, { wantsRisk: true })
  const r = await ask({ question: 'আজ আলুর ঝুঁকি কেমন?', today }, withDb)
  assert.equal(r.answer, 'রোজ ঝুঁকির রং দেখুন।')
  assert.deepEqual(r.meta.toolCalls, [])
})

test('tokens are counted per step, including refused answers and JSON that would not parse', async () => {
  fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false })
  const refused = await ask({ question: 'আলুর মাটি কেমন হবে?', today }, withDb)
  assert.deepEqual(refused.meta.tokens, { rewrite: { in: 1, cached: 0, out: 1 }, answer: { in: 2, cached: 0, out: 2 } })

  mock.restoreAll()
  fakeGroq('this is not json', 'question')
  const broken = await ask({ question: 'আলুর মাটি কেমন হবে?', today }, withDb)
  assert.equal(broken.meta.fallback, 'passage')
  assert.equal(broken.meta.tokens.answer.in, 2)
})

test('questions that differ only in spacing, punctuation, digits or joiners are one question', () => {
  const same = normalizeQuestion('আলু কখন  লাগাব?')
  for (const q of ['আলু কখন লাগাব', 'আলু কখন লাগাব।', ' আলু, কখন লাগাব ?', 'আলু কখন\u200c লাগাব?']) assert.equal(normalizeQuestion(q), same, q)
  assert.equal(normalizeQuestion('৬ ঘণ্টা'), normalizeQuestion('6 ঘণ্টা'))
  assert.notEqual(normalizeQuestion('আলু কখন লাগাব?'), normalizeQuestion('আলু কখন তুলব?'))
})

test("the cache key changes with the crop, and carries the advice's version", () => {
  assert.equal(answerKey('লাল রং?', 'potato'), answerKey('লাল রং', 'potato'))
  assert.notEqual(answerKey('লাল রং', 'potato'), answerKey('লাল রং', 'paddy'))
  assert.notEqual(answerKey('লাল রং', 'potato'), answerKey('লাল রং', null))
  assert.match(KB_VERSION, /^[0-9a-f]{16}$/)
})

const fakeCache = (seed: Record<string, object> = {}) => {
  const rows = new Map(Object.entries(seed))
  return { rows, get: async (k: string) => (rows.get(k) ?? null) as never, set: async (k: string, v: object) => void rows.set(k, v) }
}

test('a stored answer costs no model call, and is read through the guard again', async () => {
  const calls = fakeGroq({ answer: 'never', sources: [], escalate: false })
  const cache = fakeCache({ [answerKey('আলু কখন লাগাব?', 'potato')]: { answer: 'রিডোমিল দিন।', sources: [], escalate: false, note: 'n' } })
  const r = await ask({ question: 'আলু কখন লাগাব', today }, { ...askDeps, cache } as never)
  assert.equal(calls.mock.callCount(), 0)
  assert.equal(r.meta.cached, true)
  assert.equal(r.answer, BRAND_REFERRAL)
})

test('a written answer is stored; a forecast, a passage, a crop question or a follow-up never is', async () => {
  const written = fakeCache()
  fakeGroq({ answer: 'আলু লাগান।', sources: ['potato.soil'], escalate: false })
  await ask({ question: 'আলু কখন লাগাব?', today }, { ...askDeps, query: fakeDb, cache: written } as never)
  assert.equal(written.rows.size, 1)

  mock.restoreAll()
  const followUp = fakeCache()
  fakeGroq({ answer: 'আলু লাগান।', sources: ['potato.soil'], escalate: false })
  await ask({ question: 'আলু কখন লাগাব?', history: [{ q: 'ক', a: 'খ' }], today }, { ...askDeps, query: fakeDb, cache: followUp } as never)
  assert.equal(followUp.rows.size, 0)

  mock.restoreAll()
  const forecast = fakeCache()
  fakeGroq({ answer: 'সতর্ক থাকুন।', sources: ['potato.soil'], escalate: false }, 'question', null, { wantsRisk: true })
  const risk = async () => ({ place: 'কিচক', today: 'watch', reason: 'ভেজা', days: [] })
  await ask({ question: 'আজ আলুর ঝুঁকি কেমন?', today }, { ...askDeps, query: fakeDb, risk, cache: forecast } as never)
  assert.equal(forecast.rows.size, 0)

  mock.restoreAll()
  const passage = fakeCache()
  outOfQuota()
  await ask({ question: 'আলু কখন লাগাব?', today }, { ...askDeps, query: fakeDb, cache: passage } as never)
  assert.equal(passage.rows.size, 0)

  mock.restoreAll()
  const crop = fakeCache()
  fakeGroq({ answer: 'never', sources: [], escalate: false })
  await ask({ question: 'হোমে লাল রং মানে কী?', today }, { ...askDeps, query: fakeDb, cache: crop } as never)
  assert.equal(crop.rows.size, 0)
})

test('a broken cache costs the farmer nothing, as before its table exists', async () => {
  fakeGroq({ answer: 'আলু লাগান।', sources: ['potato.soil'], escalate: false })
  const down = async () => {
    throw new Error('relation "ask_cache" does not exist')
  }
  const r = await ask({ question: 'আলু কখন লাগাব?', today }, { ...askDeps, query: fakeDb, cache: { get: down, set: down } } as never)
  assert.equal(r.answer, 'আলু লাগান।')
})

test('history is two turns, with long answers cut, so old context is not paid for again', () => {
  const long = 'ক'.repeat(600)
  const messages = historyMessages(Array.from({ length: 5 }, (_, i) => ({ q: String(i), a: long })))
  assert.equal(HISTORY_TURNS, 2)
  assert.equal(messages.length, 4)
  assert.equal(messages[1].content.length, MAX_HISTORY_ANSWER)
})

test('the crop sent for a question is the field in season, or the one picked; two crops settle nothing', () => {
  const potato = { season: 'potato', planted: '2026-12-20' } as const
  const boro = { season: 'boro', planted: '2027-01-20' } as const
  const inBoth = '2027-02-15'
  assert.equal(fieldCrop([potato], inBoth, null), 'potato')
  assert.equal(fieldCrop([boro], inBoth, null), 'paddy')
  assert.equal(fieldCrop([potato, boro], inBoth, null), null)
  assert.equal(fieldCrop([potato, boro], inBoth, 'boro'), 'paddy')
  // Harvested long ago, or not planted: no field in season.
  assert.equal(fieldCrop([potato], '2027-10-01', null), null)
  assert.equal(fieldCrop([], inBoth, null), null)
})

test('a judge never comes from the family that wrote the answer, and no score beats a self-graded one', async () => {
  process.env.GROQ_API_KEY = 'test'
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test'
  process.env.OPENROUTER_API_KEY = 'test'
  const used = async (writer: string) => (await withFallback('judge', async () => 'ok', { notFamilyOf: writer })).modelUsed
  assert.match(await used('groq/openai/gpt-oss-120b'), /^google\//)
  assert.match(await used('groq/qwen/qwen3.8-27b'), /^google\//)
  // Gemma is served by OpenRouter but made by Google.
  assert.equal(await used('google/gemini-flash-lite-latest'), 'groq/openai/gpt-oss-120b')
  assert.equal(await used('openrouter/google/gemma-4-31b-it:free'), 'groq/openai/gpt-oss-120b')

  delete process.env.GROQ_API_KEY
  await assert.rejects(used('google/gemini-flash-lite-latest'))
})

test('a model calling a medicine question off topic does not turn the farmer away', async () => {
  fakeGroq({ answer: OUT_OF_SCOPE, sources: [], escalate: false }, 'off_topic')
  const r = await askIt('ডাইথেন না সিকিউর, কোনটা ভালো?')
  assert.equal(r.answer, BRAND_REFERRAL)
  assert.equal(r.kind, 'question')
})

test('a real off-topic question still gets the fixed reply, with no answer model called', async () => {
  fakeGroq({ answer: 'never', sources: [], escalate: false }, 'off_topic')
  const r = await askIt('শেয়ার বাজারে কোন শেয়ার কিনব?')
  assert.equal(r.answer, OUT_OF_SCOPE)
  assert.equal(r.kind, 'off_topic')
})

test("Latin is allowed when the farmer's sources use the word", () => {
  assert.ok(hasForeignText('BADC থেকে বীজ নিন।'))
  assert.ok(!hasForeignText('BADC থেকে বীজ নিন।', 'বীজের জন্য BADC অফিসে যান।'))
})

test("an answer's numbers must come from what it cites, so one crop's rule can't be given for the other", () => {
  const paddy = KB.filter((c) => c.id === 'risk.paddy' || c.id === 'guide.paddy').map((c) => `${c.title} ${c.text}`).join(' ')
  const potatoRule = 'রঙের ভিত্তি হল রাতের তাপমাত্রা ১০°সে‑এর বেশি আর দিনে ৯০% আর্দ্রতা ৬ ঘণ্টা দুই দিন ধারাবাহিক হলে।'
  assert.equal(answerProblem(potatoRule, paddy), 'unsupported_number')
  assert.equal(answerProblem('১৮–২৮°সে তাপমাত্রায় ভেজা দিন থাকলে বিপদ।', paddy), null)
})

test("the forecast's numbers count as sources, and Bengali and ASCII digits are the same number", () => {
  assert.equal(answerProblem('৫ নভেম্বর ঝুঁকি সতর্ক।', '{"days":["৫ নভেম্বর ২০২৬: সতর্ক"]}'), null)
  assert.equal(answerProblem('৭ নভেম্বর ঝুঁকি সতর্ক।', '{"days":["৫ নভেম্বর ২০২৬: সতর্ক"]}'), 'unsupported_number')
  assert.equal(answerProblem('ফলন ৩০% কমে।', 'yield falls 30%'), null)
})

test('the colour meanings are in the knowledge base, for both crops', () => {
  for (const id of ['risk.potato', 'risk.paddy']) assert.match(KB.find((c) => c.id === id)!.text, /সবুজ নিরাপদ, হলুদ সতর্ক, লাল বিপদ/)
})

test('the prompts forbid doses, and their examples follow the rule', () => {
  assert.ok(ANSWER_INSTRUCTIONS.includes(DOSE_LINE))
  assert.doesNotMatch(ANSWER_INSTRUCTIONS, /or a spray interval/)
  const examples = [...ANSWER_INSTRUCTIONS.matchAll(/<answer>([^<]+)<\/answer>/g)].map((m) => m[1])
  assert.ok(examples.length >= 2)
  for (const e of examples) assert.ok(!hasDose(e) && !hasBrand(e), e)
})

// Fixed text is what the provider caches; a date or place in it would break the cache every day.
test('the cached instructions hold nothing that changes per question', () => {
  for (const text of [ANSWER_INSTRUCTIONS, REWRITE_INSTRUCTIONS]) assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}|\$\{/)
  const prompt = answerPrompt({ question: 'প্রশ্ন', chunks: KB.slice(0, 2), forecast: ['{"place":"কিচক"}'] })
  assert.ok(prompt.includes(`<source id="${KB[0].id}"`) && prompt.includes('<forecast>{"place":"কিচক"}</forecast>'))
  const plain = answerPrompt({ question: 'q', chunks: [] })
  assert.ok(plain.includes('(none found)') && !plain.includes('forecast'))
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
