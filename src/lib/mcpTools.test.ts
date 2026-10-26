import assert from 'node:assert/strict'
import { test } from 'node:test'
import { unionById } from '@/lib/areas'
import { diagnosisClasses, findUnions, MAX_MATCHES } from '@/lib/mcpTools'

test('a union is found by its Bengali or English name', () => {
  const bn = findUnions('কিচক')
  assert.ok(bn.length > 0)
  assert.ok(unionById(bn[0].id), bn[0].id)
  assert.match(bn[0].name, /কিচক/)
  assert.equal(findUnions('KICHAK')[0]?.id, bn[0].id)
})

test('a district name lists its unions, at most a page of them', () => {
  const bogura = findUnions('বগুড়া')
  assert.equal(bogura.length, MAX_MATCHES)
  for (const u of bogura) assert.match(u.name, /বগুড়া/)
  assert.deepEqual(findUnions('   '), [])
  assert.deepEqual(findUnions('zzzz-no-such-place'), [])
})

test('the diagnosis classes come from the model config, never "other"', () => {
  const { classes } = diagnosisClasses()
  const ids = classes.map((c) => c.id)
  assert.ok(ids.includes('late_blight') && ids.includes('healthy'))
  assert.ok(!ids.includes('other'))
  for (const c of classes) assert.ok(c.nameBn && c.steps.length > 0, c.id)
})
