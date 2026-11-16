import assert from 'node:assert/strict'
import { test } from 'node:test'
import { districtById, upazilaById } from '@/lib/areas'
import { hasBrand, hasDose } from '@/lib/assistant/guard'
import { isIsoDate } from '@/lib/dates'
import { BLIGHT_REPORTS, winterOf } from '@/lib/outbreaks'

test('every report has a unique id, real dates, and an earliest date no later than its publication', () => {
  assert.equal(new Set(BLIGHT_REPORTS.map((r) => r.id)).size, BLIGHT_REPORTS.length)
  for (const r of BLIGHT_REPORTS) {
    assert.ok(isIsoDate(r.published) && isIsoDate(r.earliest), r.id)
    assert.ok(r.earliest <= r.published, r.id)
    assert.ok(r.url.startsWith('https://'), r.id)
    assert.ok(r.basis.length > 0, r.id)
  }
})

test('reports run in date order and fall in the winters 2016–17 to 2024–25', () => {
  const dates = BLIGHT_REPORTS.map((r) => r.published)
  assert.deepEqual(dates, [...dates].sort())
  for (const r of BLIGHT_REPORTS) assert.ok(winterOf(r.published) >= 2016 && winterOf(r.published) <= 2024, r.id)
})

test("every place's area is one the app knows, and outbreaks name at least one place", () => {
  for (const r of BLIGHT_REPORTS) {
    for (const p of r.places) if (p.area) assert.ok(upazilaById(p.area) || districtById(p.area), `${r.id}: ${p.area}`)
    if (r.kind !== 'warning') assert.ok(r.places.some((p) => p.area), r.id)
  }
})

test('no dose and no brand name, though the bulletins give both', () => {
  for (const r of BLIGHT_REPORTS) {
    for (const text of [r.title, r.basis, ...r.places.map((p) => p.name)]) {
      assert.ok(!hasDose(text), `${r.id}: ${text}`)
      assert.ok(!hasBrand(text), `${r.id}: ${text}`)
    }
  }
})

test('winterOf takes the year of the December', () => {
  assert.equal(winterOf('2024-01-18'), 2023)
  assert.equal(winterOf('2024-12-28'), 2024)
})
