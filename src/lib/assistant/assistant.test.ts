import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { ask, historyMessages } from './answer'
import { aboutMedicine, answerProblem, BRAND_REFERRAL, checkQuestion, DOSE_LINE, hasBrand, hasBrokenBengali, hasDose, hasForeignText, HISTORY_TURNS, MAX_ANSWER, MAX_QUESTION, NO_SOURCE, neverOffTopic, PHONE_MASK, redactPhones, OUT_OF_SCOPE, sanitizeAnswer, validSources } from './guard'
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
function fakeGroq(answer: object, kind = 'question') {
  process.env.GROQ_API_KEY = 'test'
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  delete process.env.OPENROUTER_API_KEY
  delete process.env.COHERE_API_KEY
  mock.method(console, 'error', () => {})
  mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    // With tools in the request, structured output arrives as a call to one more tool.
    const outputTool = body.tools?.map((t: { function: { name: string } }) => t.function.name).find((n: string) => n !== 'searchGuide' && n !== 'todayRisk')
    const message = outputTool
      ? { role: 'assistant', content: null, tool_calls: [{ id: 't', type: 'function', function: { name: outputTool, arguments: JSON.stringify(answer) } }] }
      : { role: 'assistant', content: JSON.stringify({ kind, queries: ['ওষুধ'], crop: null, wantsRisk: false }) }
    return Response.json({ id: 'x', created: 1, model: 'm', choices: [{ index: 0, finish_reason: outputTool ? 'tool_calls' : 'stop', message }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
  })
}
const askDeps = { query: async () => ({ rows: [] }), risk: async () => { throw new Error('unused') } }
const askIt = (question: string) => ask({ question, place: 'p', today: '2026-11-05' }, askDeps as never)

afterEach(() => mock.restoreAll())

test('when every model is refused the farmer is sent to the officer, not shown an error', async () => {
  fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false })
  const plain = await askIt('পাতা হলুদ হচ্ছে কেন?')
  assert.equal(plain.answer, NO_SOURCE)
  assert.equal(plain.escalate, true)
  assert.deepEqual(plain.meta.rejected, ['no_source', 'no_source'])

  mock.restoreAll()
  fakeGroq({ answer: 'কিছু একটা।', sources: [], escalate: false })
  assert.equal((await askIt('কোন কোম্পানির ওষুধ সবচেয়ে ভালো?')).answer, BRAND_REFERRAL)
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
