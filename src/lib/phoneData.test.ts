import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { isAppKey } from './phoneData'

describe('isAppKey', () => {
  it('takes the app\'s keys and nothing else', () => {
    assert.ok(isAppKey('crop-guardian:fields'))
    assert.ok(isAppKey('cg-ask'))
    assert.ok(!isAppKey('other-site:thing'))
  })

  it('covers every localStorage key the app writes', () => {
    // Each key is a string constant in the source; one with another prefix would survive «মুছুন».
    const files = ['lib/fields.ts', 'lib/followUp.ts', 'lib/sprayLog.ts', 'lib/speech.ts', 'lib/textSize.ts', 'components/FirstRunIntro.tsx', 'components/SmsOffer.tsx', 'components/ListenButton.tsx', 'components/AskChat.tsx']
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), 'src', file), 'utf8')
      const keys = [...src.matchAll(/_KEY = '([^']+)'|const STORE = '([^']+)'/g)].map((m) => m[1] ?? m[2])
      assert.ok(keys.length > 0, `no key found in ${file}`)
      for (const key of keys) assert.ok(isAppKey(key), `${file}: ${key}`)
    }
  })
})
