'use client'

import { useEffect, useState } from 'react'
import { SpeakerIcon, StopIcon } from './icons'

type Variant = 'sand' | 'glass' | 'sky' | 'outline'

const VARIANT: Record<Variant, string> = {
  sand: 'h-11 px-3.5 rounded-full bg-sand text-ink text-[15px] font-semibold gap-1.5',
  glass: 'h-11 px-3.5 rounded-full bg-white/12 text-cream text-[15px] font-semibold gap-1.5',
  sky: 'h-11 px-3.5 rounded-full bg-white/78 text-ink text-[15px] font-semibold gap-1.5',
  outline: 'min-h-[66px] rounded-[20px] border-2 border-ink bg-transparent text-ink text-lg font-bold gap-2 justify-center',
}

const bengaliVoice = (synth: SpeechSynthesis) => synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('bn'))

/**
 * Reads `text` aloud in Bengali using the browser's speech synthesis.
 * With `requireVoice`, it stays silent when no Bengali voice is installed.
 */
export default function ListenButton({
  text,
  label,
  variant = 'sand',
  className = '',
  requireVoice = false,
}: {
  text: string
  label: string
  variant?: Variant
  className?: string
  requireVoice?: boolean
}) {
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    // Some browsers (Chrome) load voices asynchronously; asking for them starts the load.
    synth.getVoices()
    return () => synth.cancel()
  }, [])

  function toggle() {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const voice = bengaliVoice(synth)
    if (!voice && requireVoice) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'bn-BD'
    if (voice) utterance.voice = voice
    utterance.rate = 0.9
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(utterance)
  }

  const Glyph = speaking ? StopIcon : SpeakerIcon
  return (
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
  )
}
