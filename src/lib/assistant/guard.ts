// Checks around the assistant's model calls. They run on the server before anything reaches the
// farmer, which is why answers aren't streamed: a dose or an unsourced claim is caught first.
import { fromBnDigits } from '@/lib/bn'

export const MAX_QUESTION = 300
// Two short paragraphs on a phone; the prompt asks for less.
export const MAX_ANSWER = 700
// Turns of earlier chat sent back with a question (a sliding window: older ones are dropped).
export const HISTORY_TURNS = 3

export const EXPERIMENTAL_NOTE = 'পরীক্ষামূলক: অ্যাপের পরামর্শ থেকে লেখা। সন্দেহ হলে উপসহকারী কৃষি কর্মকর্তাকে জিজ্ঞেস করুন।'
export const DOSE_LINE = 'ওষুধের মাত্রা: বোতলের লেবেল অনুযায়ী।'
export const OUT_OF_SCOPE = 'আমি শুধু আলু আর ধানের রোগ, চাষ আর এই অ্যাপ নিয়ে বলতে পারি। অন্য বিষয়ে উপজেলা কৃষি অফিসে জিজ্ঞেস করুন।'
export const NO_SOURCE = 'এ বিষয়ে অ্যাপের পরামর্শে কিছু পাইনি। উপসহকারী কৃষি কর্মকর্তাকে জিজ্ঞেস করুন, বা পাতার ছবি তুলে পাঠান।'
export const UNAVAILABLE = 'এখন উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন, বা «আলু চাষের পরামর্শ» পাতা দেখুন।'

export type QuestionCheck = { ok: true; text: string } | { ok: false; reason: 'empty' | 'long' }

export function checkQuestion(raw: unknown): QuestionCheck {
  const text = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : ''
  if (!text) return { ok: false, reason: 'empty' }
  if (text.length > MAX_QUESTION) return { ok: false, reason: 'long' }
  return { ok: true, text: redactPhones(text) }
}

// A model may call a short question a greeting and skip it; a farmer's question must never get the
// welcome text instead of an answer. A greeting is short and asks nothing.
const QUESTION_WORD = /[?？]|কী|কি\b|কত|কেন|কীভাবে|কিভাবে|কখন|কোন|কোথায়|কে\b|নাকি|দেব|করব|how|what|why|when|which/i
export const looksLikeQuestion = (text: string): boolean => text.length > 40 || QUESTION_WORD.test(text)

// A farmer may type their number ("আমাকে ০১৭… নম্বরে ফোন দিন"); it never goes to a model provider.
const PHONE = /(?:\+?88)?01[3-9]\d{8}/g
export const PHONE_MASK = '[ফোন নম্বর]'

export function redactPhones(text: string): string {
  // Bengali digits are read as ASCII to find the number, but only the number is replaced.
  const ascii = fromBnDigits(text)
  let out = ''
  let last = 0
  for (const m of ascii.matchAll(PHONE)) {
    out += text.slice(last, m.index) + PHONE_MASK
    last = m.index + m[0].length
  }
  return out + text.slice(last)
}

// A number with a unit of amount, or an amount per area or per litre: what a dose looks like.
// Percentages are allowed: "৯০% আর্দ্রতা" and "ফলন ৩০% কমে" are not doses.
const AMOUNT = /[\d০-৯]+(?:[.,][\d০-৯]+)?\s*(?:গ্রাম|গ্রা\.|মিলি|মি\.লি|কেজি|লিটার|সিসি|চামচ|ছটাক|mg\b|gm?\b|ml\b|kg\b|l\b|cc\b)/i
const PER = /(?:প্রতি|per)\s*(?:লিটার|বিঘা|শতক|একর|হেক্টর|litre|liter|acre|hectare)/i

export const hasDose = (text: string): boolean => AMOUNT.test(text) || PER.test(text)

// Fungicide brands sold in Bangladesh. The app leaves the choice of medicine to the officer, so an
// answer naming one is never shown, whatever it says about it. Chemical groups that BRRI or BARI name
// (ট্রাইসাইক্লাজোল) are allowed. Add names as officers report them.
const BRANDS_EN = [
  'dithane', 'ridomil', 'indofil', 'autostin', 'bavistin', 'curzate', 'antracol', 'amistar', 'nativo',
  'folicur', 'melody duo', 'acrobat', 'cabrio', 'sunvit', 'trooper', 'filia', 'contaf', 'rovral',
]
// Bengali spellings, with the common variants. Secure, Score, Tilt and Companion are everyday
// English words, so only their Bengali spellings are matched.
const BRANDS_BN = [
  'ডাইথেন', 'ডায়থেন', 'রিডোমিল', 'রিডমিল', 'ইন্ডোফিল', 'ইনডোফিল', 'অটোস্টিন', 'ব্যাভিস্টিন', 'বাভিস্টিন',
  'কারজেট', 'এন্ট্রাকল', 'অ্যান্ট্রাকল', 'এমিস্টার', 'অ্যামিস্টার', 'নাটিভো', 'নেটিভো', 'ফলিকুর',
  'মেলোডি ডুও', 'অ্যাক্রোব্যাট', 'এক্রোবেট', 'ক্যাব্রিও', 'সানভিট', 'ট্রুপার', 'ফিলিয়া', 'কম্প্যানিয়ন',
  'কনটাফ', 'রোভরাল', 'সিকিউর', 'স্কোর', 'টিল্ট',
]
const BRAND_EN = new RegExp(`\\b(?:${BRANDS_EN.map((b) => b.replace(/ /g, '\\s*')).join('|')})\\b`, 'i')
// A zero-width joiner or non-joiner can sit inside a Bengali word without changing how it looks.
const ZERO_WIDTH = new RegExp('[\\u200c\\u200d]', 'g')

export const hasBrand = (text: string): boolean => {
  const plain = text.replace(ZERO_WIDTH, '')
  return BRAND_EN.test(plain) || BRANDS_BN.some((b) => plain.includes(b))
}

export const BRAND_REFERRAL = 'কোন ওষুধ দেবেন, উপসহকারী কৃষি কর্মকর্তার কাছে জেনে নিন। মাত্রা: বোতলের লেবেল অনুযায়ী।'

// Sentences end at the dari, a full stop, ! or ? followed by a space, or at a line break; so "২.৫"
// stays one number.
const sentencesOf = (text: string): string[] =>
  text
    .split(/(?<=[।.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

// An answer that names a brand becomes the officer referral: the sentences around a name are about
// that product too. Otherwise drops any sentence that gives a dose and says to follow the label
// instead, then caps the length at a sentence boundary.
export function sanitizeAnswer(answer: string): { text: string; redacted: boolean; named: boolean } {
  if (hasBrand(answer)) return { text: BRAND_REFERRAL, redacted: false, named: true }
  const sentences = sentencesOf(answer)
  const kept = sentences.filter((s) => !hasDose(s))
  const redacted = kept.length < sentences.length
  if (redacted && !kept.some((s) => s.includes('লেবেল অনুযায়ী'))) kept.push(DOSE_LINE)

  let text = ''
  for (const s of kept) {
    if (text.length + s.length + 1 > MAX_ANSWER) break
    text += (text ? ' ' : '') + s
  }
  return { text, redacted, named: false }
}

// The model may only cite chunks it was shown; anything else is dropped as invented.
export const validSources = (cited: string[], shown: string[]): string[] => [...new Set(cited)].filter((id) => shown.includes(id))
