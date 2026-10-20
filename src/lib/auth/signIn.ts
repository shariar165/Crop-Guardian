// Pure helpers for the sign-in screen (src/components/SignInForm.tsx).

export const DEFAULT_NEXT = '/account'
export const OTP_LENGTH = 6
export const RESEND_SECONDS = 60

// Only a path on this site, so a link can't send a farmer elsewhere after signing in.
export function safeNext(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : DEFAULT_NEXT
}

export const SIGN_IN_ERROR = {
  phone: 'নম্বরটি ঠিক নেই। এভাবে লিখুন: ০১৭১২৩৪৫৬৭৮',
  wrongCode: 'কোড মেলেনি। আবার দেখে লিখুন।',
  expired: 'কোডের সময় শেষ। নতুন কোড নিন।',
  tooMany: 'অনেকবার ভুল হয়েছে। নতুন কোড নিন।',
  slowDown: 'একটু পরে আবার চেষ্টা করুন।',
  offline: 'নেট নেই। নেট ফিরলে আবার চেষ্টা করুন।',
  failed: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
} as const

export type SignInError = keyof typeof SIGN_IN_ERROR

// Better Auth's error ({ code, status }) as one line the farmer can act on. `null` = the request
// never reached the server.
export function signInError(error: { code?: string; status?: number } | null): SignInError {
  if (!error) return 'offline'
  if (error.status === 429) return 'slowDown'
  switch (error.code) {
    case 'INVALID_PHONE_NUMBER':
      return 'phone'
    case 'INVALID_OTP':
      return 'wrongCode'
    case 'OTP_EXPIRED':
    case 'OTP_NOT_FOUND':
      return 'expired'
    case 'TOO_MANY_ATTEMPTS':
      return 'tooMany'
    default:
      return 'failed'
  }
}
