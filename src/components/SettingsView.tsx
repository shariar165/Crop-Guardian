'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { INTRO_SEEN_KEY } from '@/components/FirstRunIntro'
import InstallButton from '@/components/InstallButton'
import ListenButton from '@/components/ListenButton'
import { SEASONS } from '@/lib/crops'
import { store, useHydrated, useStored } from '@/lib/deviceStore'
import { useFields } from '@/lib/fields'
import { BENGALI_VOICE_STEPS, SPEECH_ENGINE_STEPS } from '@/lib/guide'
import { clearPhoneData } from '@/lib/phoneData'
import { clientPlace } from '@/lib/placeCookies'
import { bengaliVoice, loadedVoices, SPEECH_CRASHED_KEY, SPEECH_RATE_KEY, type SpeechRate } from '@/lib/speech'
import { TEXT_SIZE_KEY, textSizeOf, type TextSize } from '@/lib/textSize'
import { PersonIcon, PinIcon } from './icons'

const card = 'stitch-lg mx-4 flex flex-col gap-3 rounded-[20px] p-4'
const heading = 'm-0 font-display text-[1.1875rem] leading-[1.2] font-extrabold'

function Choice<T extends string>({ label, value, options, onPick }: { label: string; value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onPick(v)}
          className={`h-12 flex-1 rounded-full text-base font-bold ${v === value ? 'border-0 bg-sun text-ink' : 'border-2 border-line bg-paper text-muted-2'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function RowLink({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="stitch-lg mx-4 flex min-h-16 items-center gap-3 rounded-[20px] px-4 py-3 text-ink no-underline">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist text-teal">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-bold">{title}</span>
        <span className="text-sm text-muted">{sub}</span>
      </span>
      <span aria-hidden="true" className="text-2xl font-bold text-teal">
        ›
      </span>
    </Link>
  )
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[0.9375rem] leading-[1.45]">
      {steps.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  )
}

type Voice = 'checking' | 'yes' | 'no' | 'none'

function ReadAloud() {
  const rate: SpeechRate = useStored(SPEECH_RATE_KEY) === 'slow' ? 'slow' : 'normal'
  const crashed = useStored(SPEECH_CRASHED_KEY) === '1'
  const hydrated = useHydrated()
  const [found, setVoice] = useState<Voice>('checking')
  const voice: Voice = hydrated && !('speechSynthesis' in window) ? 'none' : found

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    let live = true
    loadedVoices(synth).then((voices) => live && setVoice(bengaliVoice(voices) ? 'yes' : 'no'))
    return () => {
      live = false
    }
  }, [])

  return (
    <section aria-labelledby="read-title" className={card}>
      <h2 id="read-title" className={heading}>
        পড়ে শোনানো
      </h2>
      <Choice
        label="পড়ার গতি"
        value={rate}
        options={[
          ['slow', 'ধীরে'],
          ['normal', 'স্বাভাবিক'],
        ]}
        onPick={(v) => store(SPEECH_RATE_KEY, v === 'slow' ? 'slow' : null)}
      />
      {crashed && (
        <div className="flex flex-col gap-2 rounded-[14px] bg-danger-soft p-3">
          <p className="m-0 text-[0.9375rem] leading-[1.45] font-semibold">আগেরবার পড়তে গিয়ে পাতা বন্ধ হয়েছিল। Google-এর ইঞ্জিন বেছে নিলে সাধারণত ঠিক হয়:</p>
          <Steps steps={SPEECH_ENGINE_STEPS} />
          <button type="button" onClick={() => store(SPEECH_CRASHED_KEY, null)} className="min-h-11 self-start border-0 bg-transparent p-0 text-base font-bold text-teal">
            আবার চালু করুন
          </button>
        </div>
      )}
      <p className="m-0 text-[0.9375rem] leading-[1.45]" aria-live="polite">
        {voice === 'checking' && 'ফোনে বাংলা কণ্ঠ আছে কি না দেখছি…'}
        {voice === 'yes' && 'এই ফোনে বাংলা কণ্ঠ আছে।'}
        {voice === 'no' && 'এই ফোনে বাংলা কণ্ঠ নেই। একবার নামিয়ে নিলে বাংলায় পড়বে:'}
        {voice === 'none' && 'এই ব্রাউজারে পড়ে শোনানো যায় না। Chrome-এ খুলুন।'}
      </p>
      {voice === 'no' && <Steps steps={BENGALI_VOICE_STEPS} />}
      <ListenButton text="সবুজবিধি এই গতিতে পড়ে শোনাবে।" label="পড়ার গতি পরীক্ষা করে শুনুন" className="self-start" />
    </section>
  )
}

function setTextSize(size: TextSize) {
  store(TEXT_SIZE_KEY, size === 'large' ? 'large' : null)
  if (size === 'large') document.documentElement.dataset.text = 'large'
  else delete document.documentElement.dataset.text
}

function TextSizeCard() {
  const size = textSizeOf(useStored(TEXT_SIZE_KEY))
  return (
    <section aria-labelledby="size-title" className={card}>
      <h2 id="size-title" className={heading}>
        লেখার আকার
      </h2>
      <Choice<TextSize>
        label="লেখার আকার"
        value={size}
        options={[
          ['normal', 'স্বাভাবিক'],
          ['large', 'বড়'],
        ]}
        onPick={setTextSize}
      />
      <p className="m-0 text-[0.9375rem] leading-[1.45] text-muted-2">সব পাতার লেখা এই আকারে দেখাবে।</p>
    </section>
  )
}

function ClearData() {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)

  async function clear() {
    setBusy(true)
    await clearPhoneData()
    // A full load, not router.push: every screen and in-memory state must start from nothing saved.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    location.assign('/')
  }

  return (
    <section aria-labelledby="clear-title" className={card}>
      <h2 id="clear-title" className={heading}>
        ফোনের তথ্য মুছুন
      </h2>
      <p className="m-0 text-[0.9375rem] leading-[1.45]">জায়গা, জমির তারিখ, পাতার ছবি ও ফলাফল, স্প্রের হিসাব, প্রশ্নোত্তর আর এই সেটিংস এই ফোন থেকে মুছে যাবে।</p>
      {!asking ? (
        <button type="button" onClick={() => setAsking(true)} className="h-12 rounded-full border-2 border-danger bg-transparent text-base font-bold text-danger">
          সব মুছুন
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby="clear-confirm" className="flex flex-col gap-2.5 rounded-[14px] bg-danger-soft p-3">
          <p id="clear-confirm" className="m-0 text-[0.9375rem] leading-[1.45] font-semibold">
            সত্যিই মুছবেন? ফেরত আনা যাবে না।
          </p>
          <p className="m-0 text-sm leading-[1.45] text-muted-2">
            থাকবে: নামানো মডেল আর অ্যাকাউন্ট। কর্মকর্তাকে পাঠানো কেস আর SMS সতর্কতা অ্যাকাউন্টে থাকে, সেখান থেকে বন্ধ করুন।
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={clear} className="h-12 flex-1 rounded-full border-0 bg-danger text-base font-bold text-white disabled:opacity-60">
              হ্যাঁ, মুছুন
            </button>
            <button type="button" disabled={busy} autoFocus onClick={() => setAsking(false)} className="h-12 flex-1 rounded-full border-2 border-ink bg-transparent text-base font-bold text-ink">
              থাক
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

/** /settings: everything here is kept on the phone, so it works signed out and offline. */
export default function SettingsView() {
  const hydrated = useHydrated()
  const fields = useFields()
  const router = useRouter()
  const place = hydrated ? clientPlace() : null
  const fieldNames = fields.map((f) => SEASONS[f.season].nameBn).join(', ')

  return (
    <div className="flex flex-col gap-3">
      <RowLink href="/account" icon={<PersonIcon size={22} />} title="আমার অ্যাকাউন্ট ও SMS" sub="বিপদের দিনে SMS পেতে ঢুকুন" />
      <RowLink
        href="/planting?from=settings"
        icon={<PinIcon size={22} />}
        title="জায়গা ও জমি"
        sub={place ? `${place.unionId ? place.name : `উদাহরণ: ${place.name}`} · ${fieldNames ? `জমি: ${fieldNames}` : 'জমি দেওয়া নেই'}` : '…'}
      />
      <ReadAloud />
      <TextSizeCard />
      <section aria-labelledby="app-title" className={card}>
        <h2 id="app-title" className={heading}>
          অ্যাপ
        </h2>
        <InstallButton />
        <button
          type="button"
          onClick={() => {
            store(INTRO_SEEN_KEY, null)
            router.push('/')
          }}
          className="h-12 rounded-full border-2 border-teal bg-paper text-base font-bold text-teal"
        >
          শুরুর পরিচিতি আবার দেখুন
        </button>
      </section>
      <ClearData />
    </div>
  )
}
