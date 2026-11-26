import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { RECORDED } from './audioKeys'

describe('RECORDED', () => {
  it('lists exactly the recordings in public/audio', () => {
    const dir = join(process.cwd(), 'public', 'audio')
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)) : []
    assert.deepEqual([...RECORDED].sort(), files.sort())
  })
})
