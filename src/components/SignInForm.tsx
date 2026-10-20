'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { OTP_LENGTH, RESEND_SECONDS, SIGN_IN_ERROR, type SignInError, signInError } from '@/lib/auth/signIn'
import { fromBnDigits, toBnDigits } from '@/lib/bn'
import { formatBdPhone, normalizeBdPhone } from '@/lib/phone'
import { outlineClass, primaryClass } from './Buttons'

const INPUT =
  'h-14 w-full rounded-[14px] border-2 border-line bg-paper px-3 text-xl font-semibold tracking-wide text-ink focus:border-teal focus:outline-none'

type Step = { at: 'phone' } | { at: 'code'; phone: string }

/** Two steps: the mobile number, then the 6-digit code sent to it by SMS. */
export default function SignInForm({ next }: { next: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ at: 'phone' })
  const [phoneInput, setPhoneInput] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<SignInError | null>(null)
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Runs a Better Auth call; `null` when it failed, with the error shown.
  async function call<T>(request: () => Promise<{ data: T | null; error: { code?: string; status?: number } | null }>) {
    setBusy(true)
    setError(null)
    try {
      const { data, error } = await request()
      if (error) setError(signInError(error))
      return error ? null : data
    } catch (err) {
      console.error('Sign-in request failed', err)
      setError(signInError(null))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function sendCode(phone: string) {
    if (!(await call(() => authClient.phoneNumber.sendOtp({ phoneNumber: phone })))) return
    setStep({ at: 'code', phone })
    setCode('')
    setWait(RESEND_SECONDS)
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizeBdPhone(phoneInput)
    if (!phone) return setError('phone')
    await sendCode(phone)
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    if (step.at !== 'code') return
    if (await call(() => authClient.phoneNumber.verify({ phoneNumber: step.phone, code }))) {
      router.replace(next)
      router.refresh()
    }
  }

  const alert = error && (
    <p role="alert" className="m-0 text-[15px] font-semibold text-danger">
      {SIGN_IN_ERROR[error]}
    </p>
  )

  if (step.at === 'phone') {
    return (
      <form onSubmit={submitPhone} className="flex shrink-0 flex-col gap-4 px-4">
        <p className="m-0 text-[17px] leading-[1.45] font-medium">
          আপনার মোবাইল নম্বর দিন। নম্বরে একটা কোড পাঠানো হবে, সেটা লিখলেই ঢুকে যাবেন।
        </p>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
          মোবাইল নম্বর
          <input
            className={INPUT}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="০১৭১২৩৪৫৬৭৮"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value)
              setError(null)
            }}
            required
          />
        </label>
        {alert}
        <button type="submit" disabled={busy} aria-busy={busy} className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold disabled:opacity-50`}>
          {busy ? 'পাঠাচ্ছি…' : 'কোড পাঠান'}
        </button>
        <p className="m-0 text-sm leading-[1.45] text-muted">ছবি দেখে রোগ চেনার জন্য ঢুকতে হয় না।</p>
      </form>
    )
  }

  const tooMany = error === 'tooMany' || error === 'expired'
  return (
    <form onSubmit={submitCode} className="flex shrink-0 flex-col gap-4 px-4">
      <p className="m-0 text-[17px] leading-[1.45] font-medium">
        <b>{formatBdPhone(step.phone)}</b> নম্বরে SMS-এ {toBnDigits(OTP_LENGTH)} অঙ্কের কোড গেছে। সেটা লিখুন।
      </p>
      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
        কোড
        <input
          className={`${INPUT} text-center text-2xl tracking-[0.4em]`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          value={code}
          onChange={(e) => {
            setCode(fromBnDigits(e.target.value).replace(/\D/g, '').slice(0, OTP_LENGTH))
            setError(null)
          }}
          autoFocus
          required
        />
      </label>
      {alert}
      <button
        type="submit"
        disabled={busy || code.length !== OTP_LENGTH || tooMany}
        aria-busy={busy}
        className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold disabled:opacity-50`}
      >
        {busy ? 'মিলিয়ে দেখছি…' : 'ঢুকুন'}
      </button>
      <button
        type="button"
        disabled={busy || wait > 0}
        onClick={() => sendCode(step.phone)}
        className={`${outlineClass} h-[52px] text-base font-bold disabled:opacity-50`}
      >
        {wait > 0 ? `আবার কোড পাঠান (${toBnDigits(wait)})` : 'আবার কোড পাঠান'}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep({ at: 'phone' })
          setError(null)
        }}
        className="self-center border-0 bg-transparent text-[15px] font-semibold text-teal"
      >
        অন্য নম্বর দিন
      </button>
    </form>
  )
}
