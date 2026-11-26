'use client'

import { useRef, useState } from 'react'
import { CameraIcon, FlashIcon, GalleryIcon } from './icons'

// `torch` isn't in the DOM types yet; Chrome on Android has it on the back camera.
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

function hasTorch(track: MediaStreamTrack | null): track is MediaStreamTrack {
  return (track?.getCapabilities?.() as TorchCapabilities | undefined)?.torch === true
}

// `track` is the live video track, or null while there is none. Give the component a new key per
// track, so the flash state starts off with each stream (stopping a track turns its torch off).
export default function CameraControls({
  onShutter,
  onPickFile,
  track,
  busy = false,
}: {
  onShutter: () => void
  onPickFile: (file: File) => void
  track: MediaStreamTrack | null
  busy?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [torch, setTorch] = useState(false)

  function toggleTorch() {
    if (!hasTorch(track)) return
    const on = !torch
    track
      .applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      .then(() => setTorch(on))
      .catch((err) => console.error('Could not switch the flash', err))
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label="গ্যালারি থেকে ছবি নিন"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex size-[58px] items-center justify-center rounded-[18px] border-2 border-white/25 bg-[#2E4A2A] text-cream"
      >
        <GalleryIcon size={26} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onPickFile(file)
        }}
      />
      <button
        type="button"
        aria-label="ছবি তুলুন"
        onClick={onShutter}
        disabled={busy}
        className="box-border flex size-[86px] items-center justify-center rounded-full border-[5px] border-sun bg-transparent p-0 active:scale-95 disabled:opacity-60"
      >
        <span className="flex size-[66px] items-center justify-center rounded-full bg-cream text-ink">
          <CameraIcon size={28} weight={2.2} />
        </span>
      </button>
      {hasTorch(track) ? (
        <button
          type="button"
          aria-label={torch ? 'ফ্ল্যাশ বন্ধ করুন' : 'ফ্ল্যাশ চালু করুন'}
          aria-pressed={torch}
          onClick={toggleTorch}
          className={`flex size-[58px] items-center justify-center rounded-[18px] border-2 ${
            torch ? 'border-sun bg-sun text-ink' : 'border-white/25 bg-transparent text-cream'
          }`}
        >
          <FlashIcon size={26} />
        </button>
      ) : (
        // Keeps the shutter centred on phones without a flash.
        <span aria-hidden="true" className="size-[58px]" />
      )}
    </div>
  )
}
