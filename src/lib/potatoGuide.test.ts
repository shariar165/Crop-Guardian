import assert from 'node:assert/strict'
import { test } from 'node:test'
import { POTATO_GUIDE, POTATO_SOURCES } from '@/lib/potatoGuide'

const lines = POTATO_GUIDE.flatMap((s) => [s.title, ...s.lines])

test('the potato advice never gives a dose', () => {
  for (const line of lines) assert.doesNotMatch(line, /[\d০-৯]+\s*(গ্রাম|মিলি|কেজি|লিটার|g\b|ml\b|kg\b)/i, line)
  assert.ok(lines.some((l) => l.includes('লেবেল অনুযায়ী')))
})

test('every section says where its advice comes from', () => {
  for (const s of POTATO_GUIDE) assert.ok(s.source.length > 0, s.id)
  assert.ok(POTATO_SOURCES.length > 0)
})

// The Indian review paper is a source of general facts only; no Indian place reaches the farmer.
test('the advice names no Indian places', () => {
  for (const line of lines) assert.doesNotMatch(line, /ভারত|বিহার|উত্তর প্রদেশ|পাঞ্জাব|হরিয়ানা|মহারাষ্ট্র|মধ্যপ্রদেশ|পশ্চিমবঙ্গ|ছত্তিশগড়/, line)
})

test('section ids are unique', () => {
  assert.equal(new Set(POTATO_GUIDE.map((s) => s.id)).size, POTATO_GUIDE.length)
})
