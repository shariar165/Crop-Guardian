// Sends SMS through SMS Gate (https://sms-gate.app): an Android phone with a SIM, reached through
// the public cloud server. The username and password are on the app's Home tab (Cloud mode).
export const SMS_GATE_URL = 'https://api.sms-gate.app/3rdparty/v1/messages'
export const SMS_TIMEOUT_MS = 10_000

type Env = Record<string, string | undefined>

// How long the gateway may hold a message, and whether it skips the queue (priority ≥ 100 also
// skips the gateway's own rate limits). By default a sign-in code: useless after 5 minutes, and urgent.
export type SmsOptions = { ttlS?: number; priority?: number }

// Kept under 70 characters: a Bengali SMS is UCS-2, so anything longer is sent as two.
export const otpMessage = (code: string) => `Crop Guardian কোড: ${code}। ৫ মিনিট চলবে।`

// Without credentials in development, the message is logged instead, so sign-in works without a phone.
export async function sendSms(
  phone: string,
  text: string,
  env: Env = process.env,
  { ttlS = 300, priority = 100 }: SmsOptions = {},
): Promise<void> {
  const { SMS_GATE_USERNAME: username, SMS_GATE_PASSWORD: password } = env
  if (!username || !password) {
    if (env.NODE_ENV === 'production') throw new Error('SMS_GATE_USERNAME and SMS_GATE_PASSWORD are not set')
    console.info(`[sms] to ${phone}: ${text}`)
    return
  }

  const res = await fetch(SMS_GATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone], ttl: ttlS, priority }),
    signal: AbortSignal.timeout(SMS_TIMEOUT_MS),
  })
  if (res.status !== 202) throw new Error(`SMS Gate: HTTP ${res.status} ${await res.text().catch(() => '')}`)
}
