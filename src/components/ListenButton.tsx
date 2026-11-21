'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { audioSrc, type SpeechPart } from '@/lib/audioKeys'
import { store } from '@/lib/deviceStore'
import { BENGALI_VOICE_STEPS } from '@/lib/guide'
import { SpeakerIcon, StopIcon } from './icons'

const TIP_SEEN_KEY = 'crop-guardian:voice-tip-seen'

type Variant = 'sand' | 'glass' | 'sky' | 'outline'

const VARIANT: Record<Variant, string> = {
  sand: 'h-11 px-3.5 rounded-full bg-sand text-ink text-[15px] font-semibold gap-1.5',
  glass: 'h-11 px-3.5 rounded-full bg-white/12 text-cream text-[15px] font-semibold gap-1.5',
  sky: 'h-11 px-3.5 rounded-full bg-white/78 text-ink text-[15px] font-semibold gap-1.5',
  outline: 'min-h-[66px] rounded-[20px] border-2 border-ink bg-transparent text-ink text-lg font-bold gap-2 justify-center',
}

export const bengaliVoice = (synth: SpeechSynthesis) => synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('bn'))

// Recordings found missing on this page load, so a missing file costs one request, not one per tap.
const MISSING = new Set<string>()

// Plays a recording to the end. Rejects if it can't be played (missing, offline, unsupported).
function playFile(audio: HTMLAudioElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error(`No audio at ${src}`))
    audio.src = src
    audio.play().catch(reject)
  })
}

// Resolves when the text has been read, or couldn't be: a failure must not leave the button on থামান.
function speak(synth: SpeechSynthesis, text: string, voice: SpeechSynthesisVoice | undefined): Promise<void> {
  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'bn-BD'
      if (voice) utterance.voice = voice
      utterance.rate = 0.9
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      synth.speak(utterance)
    } catch (err) {
      console.error('Speech failed', err)
      resolve()
    }
  })
}

/**
 * Reads `text` aloud in Bengali, part by part: a part with a recording (`audio`, see
 * src/lib/audioKeys.ts) plays it when the file is there, and anything else uses the browser's
 * speech synthesis. `audio` on its own is the recording for the whole `text`.
 * With `requireVoice`, synthesis stays silent when no Bengali voice is installed (recordings still
 * play). With `voiceTip`, the first tap on a phone without one shows how to install it instead of
 * reading with a voice that can't say Bengali; later taps read with whatever voice there is.
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
  const [tip, setTip] = useState(false)
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
      synth?.cancel()
      player.current?.pause()
    }
  }, [])

  function stop() {
    run.current++
    window.speechSynthesis?.cancel()
    player.current?.pause()
    setSpeaking(false)
  }

  async function play(parts: SpeechPart[], voice: SpeechSynthesisVoice | undefined) {
    const id = ++run.current
    const synth = window.speechSynthesis
    setSpeaking(true)
    for (const part of parts) {
      if (run.current !== id) return
      if (part.audio && !MISSING.has(part.audio)) {
        player.current ??= new Audio()
        try {
          await playFile(player.current, audioSrc(part.audio))
          continue
        } catch {
          MISSING.add(part.audio)
          if (run.current !== id) return
        }
      }
      if (synth && (voice || !requireVoice)) await speak(synth, part.text, voice)
    }
    if (run.current === id) setSpeaking(false)
  }

  function toggle() {
    if (speaking) return stop()
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    const voice = synth ? bengaliVoice(synth) : undefined
    // An empty list means the voices haven't loaded yet, not that there is no Bengali one.
    if (synth && !voice && voiceTip && synth.getVoices().length > 0 && localStorage.getItem(TIP_SEEN_KEY) !== '1') {
      store(TIP_SEEN_KEY, '1')
      setTip(true)
      return
    }
    synth?.cancel()
    play(typeof text === 'string' ? [{ text, audio }] : text, voice)
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
      {tip && <VoiceTip onClose={() => setTip(false)} />}
    </>
  )
}

function VoiceTip({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-[390px] items-end bg-black/50 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-tip-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-[20px] bg-cream p-4 text-ink"
      >
        <h2 id="voice-tip-title" className="m-0 font-display text-xl leading-[1.3] font-extrabold">
          ফোনে বাংলা কণ্ঠ নেই
        </h2>
        <p className="m-0 text-[15px] leading-[1.45]">একবার নামিয়ে নিলে «শুনুন» বাংলায় পড়বে:</p>
        <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[15px] leading-[1.45]">
          {BENGALI_VOICE_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="flex items-center gap-3">
          <button type="button" autoFocus onClick={onClose} className="h-12 flex-1 rounded-full border-0 bg-sun text-base font-bold text-ink">
            ঠিক আছে
          </button>
          <Link href="/guide#listen" className="text-[15px] font-bold text-teal">
            নির্দেশিকায় দেখুন
          </Link>
        </div>
      </div>
    </div>
  )
}
