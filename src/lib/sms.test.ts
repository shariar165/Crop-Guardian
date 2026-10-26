import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { otpMessage, SMS_GATE_URL, sendSms } from '@/lib/sms'

const CREDS = { SMS_GATE_USERNAME: 'user', SMS_GATE_PASSWORD: 'pass', NODE_ENV: 'production' }

afterEach(() => mock.restoreAll())

describe('sendSms', () => {
  it('posts the message to SMS Gate with basic auth', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{"id":"x","status":"queued"}', { status: 202 }))
    await sendSms('+8801712345678', 'hello', CREDS)

    assert.equal(fetchMock.mock.callCount(), 1)
    const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit]
    assert.equal(url, SMS_GATE_URL)
    assert.equal(init.method, 'POST')
    const headers = init.headers as Record<string, string>
    assert.equal(headers.Authorization, `Basic ${Buffer.from('user:pass').toString('base64')}`)
    assert.deepEqual(JSON.parse(init.body as string), {
      textMessage: { text: 'hello' },
      phoneNumbers: ['+8801712345678'],
      ttl: 300,
      priority: 100,
    })
  })

  it('lets a message wait longer, behind sign-in codes', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 202 }))
    await sendSms('+8801712345678', 'hello', CREDS, { ttlS: 21_600, priority: 0 })
    const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    assert.equal(body.ttl, 21_600)
    assert.equal(body.priority, 0)
  })

  it('throws when the gateway does not accept the message', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('{"error":"unauthorized"}', { status: 401 }))
    await assert.rejects(sendSms('+8801712345678', 'hello', CREDS), /HTTP 401/)
  })

  it('logs instead of sending in development without credentials', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(null, { status: 202 }))
    const log = mock.method(console, 'info', () => {})
    await sendSms('+8801712345678', 'hello', { NODE_ENV: 'development' })
    assert.equal(fetchMock.mock.callCount(), 0)
    assert.match(String(log.mock.calls[0].arguments[0]), /\+8801712345678: hello/)
  })

  it('refuses to run without credentials in production', async () => {
    await assert.rejects(sendSms('+8801712345678', 'hello', { NODE_ENV: 'production' }), /SMS_GATE_USERNAME/)
  })
})

describe('otpMessage', () => {
  it('fits in one Bengali (UCS-2) SMS', () => {
    const text = otpMessage('123456')
    assert.ok(text.includes('123456'))
    assert.ok(text.length <= 70, `${text.length} characters`)
  })
})
