'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { audioSrc, RECORDED, type SpeechPart } from '@/lib/audioKeys'
import { store, useStored } from '@/lib/deviceStore'
import { BENGALI_VOICE_STEPS, SPEECH_ENGINE_STEPS } from '@/lib/guide'
import { bengaliVoice, loadedVoices, rateOf, SPEECH_CRASHED_KEY, SPEECH_RATE_KEY, speechChunks, speechEnded, speechStarted } from '@/lib/speech'
import { SpeakerIcon, StopIcon } from './icons'

const TIP_SEEN_KEY = 'crop-guardian:voice-tip-seen'

type Variant = 'sand' | 'glass' | 'sky' | 'outline'

const VARIANT: Record<Variant, string> = {
  sand: 'h-11 px-3.5 rounded-full bg-sand text-ink text-[0.9375rem] font-semibold gap-1.5',
  glass: 'h-11 px-3.5 rounded-full bg-white/12 text-cream text-[0.9375rem] font-semibold gap-1.5',
  sky: 'h-11 px-3 rounded-full bg-white/78 text-ink text-[0.9375rem] font-semibold gap-1.5',
  outline: 'min-h-[66px] rounded-[20px] border-2 border-ink bg-transparent text-ink text-lg font-bold gap-2 justify-center',
}

// Plays a recording to the end. Rejects if it can't be played (offline, unsupported).
function playFile(audio: HTMLAudioElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error(`No audio at ${src}`))
    audio.src = src
    audio.play().catch(reject)
  })
}

// Resolves when the text has been read, or couldn't be: a failure must not leave the button on থামান.
function speak(synth: SpeechSynthesis, text: string, voice: SpeechSynthesisVoice | undefined, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      speechEnded()
      resolve()
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'bn-BD'
      if (voice) utterance.voice = voice
      utterance.rate = rate
      utterance.onend = done
      utterance.onerror = done
      speechStarted()
      synth.speak(utterance)
    } catch (err) {
      console.error('Speech failed', err)
      done()
    }
  })
}

// Some engines misbehave when cancel() comes with nothing to cancel, right before speak().
function quiet(synth: SpeechSynthesis | undefined) {
  if (synth && (synth.speaking || synth.pending)) synth.cancel()
  speechEnded()
}

/**
 * Reads `text` aloud in Bengali, part by part: a part with a recording (`audio`, see
 * src/lib/audioKeys.ts) plays it when the file exists, and anything else uses the phone's speech
 * engine, in short pieces, at the speed chosen in /settings. `audio` on its own is the recording
 * for the whole `text`. With `requireVoice`, the engine stays silent when no Bengali voice is
 * installed (recordings still play). With `voiceTip`, the first tap on a phone without one shows
 * how to install it instead of reading with a voice that can't say Bengali. If the tab died while
 * reading last time, a tap explains that and offers to try again rather than crashing again.
 */
export default function ListenButton({
  text,
  audio,
  label,
  variant = 'sand',
  className = '',
  requireVoice = false,
  voiceTip = false,
}: {
  text: string | SpeechPart[]
  audio?: string
  label: string
  variant?: Variant
  className?: string
  requireVoice?: boolean
  voiceTip?: boolean
}) {
  const [speaking, setSpeaking] = useState(false)
  const [sheet, setSheet] = useState<'voice' | 'crashed' | null>(null)
  const crashed = useStored(SPEECH_CRASHED_KEY) === '1'
  const rate = rateOf(useStored(SPEECH_RATE_KEY))
  // Bumped to stop a reading in progress: each part checks it before starting.
  const run = useRef(0)
  const player = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const synth = window.speechSynthesis
    // Some browsers (Chrome) load voices asynchronously; asking for them starts the load.
    synth?.getVoices()
    return () => {
      // A counter, not a node: the latest value is the one to bump.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++
      quiet(synth)
      player.current?.pause()
    }
  }, [])

  function stop() {
    run.current++
    quiet(window.speechSynthesis)
    player.current?.pause()
    setSpeaking(false)
  }

  async function play() {
    const id = ++run.current
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    const parts = typeof text === 'string' ? [{ text, audio }] : text
    setSpeaking(true)
    const voices = synth ? await loadedVoices(synth) : []
    const voice = bengaliVoice(voices)
    if (run.current !== id) return
    if (synth && !voice && voiceTip && voices.length > 0 && localStorage.getItem(TIP_SEEN_KEY) !== '1') {
      store(TIP_SEEN_KEY, '1')
      setSpeaking(false)
      setSheet('voice')
      return
    }
    quiet(synth)
    for (const part of parts) {
      if (run.current !== id) return
      if (part.audio && RECORDED.has(part.audio)) {
        player.current ??= new Audio()
        try {
          await playFile(player.current, audioSrc(part.audio))
          continue
        } catch {
          if (run.current !== id) return
        }
      }
      if (!synth || (!voice && requireVoice)) continue
      for (const chunk of speechChunks(part.text)) {
        if (run.current !== id) return
        await speak(synth, chunk, voice, rate)
      }
    }
    if (run.current === id) setSpeaking(false)
  }

  function toggle() {
    if (speaking) return stop()
    if (crashed) return setSheet('crashed')
    play()
  }

  function retry() {
    store(SPEECH_CRASHED_KEY, null)
    setSheet(null)
    play()
  }

  const Glyph = speaking ? StopIcon : SpeakerIcon
  return (
    <>
      <button
        type="button"
        aria-label={speaking ? 'পড়া থামান' : label}
        aria-pressed={speaking}
        onClick={toggle}
        className={`flex items-center border-0 ${VARIANT[variant]} ${className}`}
      >
        <Glyph size={variant === 'outline' ? 24 : 22} weight={variant === 'outline' ? 2.2 : 2} />
        {speaking ? 'থামান' : 'শুনুন'}
      </button>
      {sheet === 'voice' && (
        <Sheet title="ফোনে বাংলা কণ্ঠ নেই" intro="একবার নামিয়ে নিলে «শুনুন» বাংলায় পড়বে:" steps={BENGALI_VOICE_STEPS} onClose={() => setSheet(null)}>
          <Link href="/guide#listen" className="text-base font-bold text-teal">
            নির্দেশিকায় দেখুন
          </Link>
        </Sheet>
      )}
      {sheet === 'crashed' && (
        <Sheet
          title="আগেরবার পড়তে গিয়ে পাতা বন্ধ হয়েছিল"
          intro="ফোনের কণ্ঠ-ইঞ্জিনে সমস্যা হতে পারে। Google-এর ইঞ্জিন বেছে নিলে সাধারণত ঠিক হয়:"
          steps={SPEECH_ENGINE_STEPS}
          onClose={() => setSheet(null)}
        >
          <button type="button" onClick={retry} className="min-h-12 border-0 bg-transparent px-1 text-base font-bold text-teal">
            আবার চেষ্টা করুন
          </button>
        </Sheet>
      )}
    </>
  )
}

function Sheet({
  title,
  intro,
  steps,
  onClose,
  children,
}: {
  title: string
  intro: string
  steps: string[]
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-[390px] items-end bg-black/50 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listen-sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full flex-col gap-3 overflow-y-auto rounded-[20px] bg-cream p-4 text-ink"
      >
        <h2 id="listen-sheet-title" className="m-0 font-display text-xl leading-[1.3] font-extrabold">
          {title}
        </h2>
        <p className="m-0 text-[0.9375rem] leading-[1.45]">{intro}</p>
        <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[0.9375rem] leading-[1.45]">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="flex items-center gap-3">
          <button type="button" autoFocus onClick={onClose} className="h-12 flex-1 rounded-full border-0 bg-sun text-base font-bold text-ink">
            ঠিক আছে
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}
