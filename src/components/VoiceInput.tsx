'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { MicIcon, StopIcon } from './icons'

// The parts of the Web Speech API used here; TypeScript's DOM types have the events but not the
// recogniser itself, and Chrome still ships it as webkitSpeechRecognition.
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionClass = new () => Recognition

function recognitionClass(): RecognitionClass | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const MESSAGE = {
  denied: 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি। ঠিকানার পাশের চিহ্নে চাপ দিয়ে অনুমতি দিন।',
  silent: 'কিছু শোনা যায়নি। মাইক চেপে আবার বলুন।',
  offline: 'মুখে বলা প্রশ্ন লিখতে নেট লাগে। নেট চালু করে আবার চেষ্টা করুন।',
  failed: 'কথা বোঝা গেল না। আবার চেষ্টা করুন, বা লিখে পাঠান।',
}

const noSubscribe = () => () => {}

/**
 * A mic button that writes the farmer's spoken Bengali into the question box as they speak; they
 * still tap send. Uses the browser's speech recognition (Chrome sends the audio to Google's
 * service, so it needs the network). Hidden where the browser has none.
 */
export default function VoiceInput({ value, onChange, disabled = false }: { value: string; onChange: (text: string) => void; disabled?: boolean }) {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionClass() !== null, () => false)
  const [listening, setListening] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const rec = useRef<Recognition | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // A message is a hint, not a state: it clears itself so it doesn't sit over the chat.
  function show(text: string) {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(null), 6000)
  }

  // Leaving the page stops listening.
  useEffect(() => {
    return () => {
      rec.current?.abort()
      clearTimeout(timer.current)
    }
  }, [])

  if (!supported) return null

  function start() {
    const Rec = recognitionClass()
    if (!Rec) return
    // What was typed stays; the spoken words go after it.
    const before = value.trim() ? `${value.trim()} ` : ''
    let heard = false
    let failed = false
    const r = new Rec()
    r.lang = 'bn-BD'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e) => {
      heard = true
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      onChange(before + text.trim())
    }
    r.onerror = (e) => {
      failed = true
      if (e.error === 'aborted') return
      show(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? MESSAGE.denied
          : e.error === 'no-speech'
            ? MESSAGE.silent
            : e.error === 'network'
              ? MESSAGE.offline
              : MESSAGE.failed,
      )
    }
    r.onend = () => {
      setListening(false)
      rec.current = null
      if (!heard && !failed) show(MESSAGE.silent)
    }
    rec.current = r
    clearTimeout(timer.current)
    setMessage(null)
    setListening(true)
    try {
      r.start()
    } catch {
      setListening(false)
      show(MESSAGE.failed)
    }
  }

  return (
    <div className="relative shrink-0">
      {(listening || message) && (
        <p
          role={message ? 'alert' : 'status'}
          className="absolute right-0 bottom-full m-0 mb-2 w-[260px] rounded-[14px] bg-ink px-3 py-2 text-[0.9375rem] leading-[1.4] font-semibold text-cream"
        >
          {listening ? 'শুনছি… বলা শেষ হলে থামুন চাপুন' : message}
        </p>
      )}
      <button
        type="button"
        onClick={() => (listening ? rec.current?.stop() : start())}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? 'শোনা থামান' : 'মুখে বলে প্রশ্ন করুন'}
        className={`flex size-14 items-center justify-center rounded-[20px] border-2 disabled:opacity-50 ${
          listening ? 'animate-pulse border-danger bg-danger text-white' : 'border-ink bg-paper text-ink'
        }`}
      >
        {listening ? <StopIcon size={22} weight={2.2} /> : <MicIcon size={24} weight={2.2} />}
      </button>
    </div>
  )
}
