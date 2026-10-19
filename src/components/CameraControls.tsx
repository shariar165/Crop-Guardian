'use client'

import { useRef } from 'react'
import { CameraIcon, FlashIcon, GalleryIcon } from './icons'

export default function CameraControls({
  onShutter,
  onPickFile,
  busy = false,
}: {
  onShutter: () => void
  onPickFile: (file: File) => void
  busy?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)

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
      <button
        type="button"
        aria-label="ফ্ল্যাশ চালু করুন"
        className="flex size-[58px] items-center justify-center rounded-[18px] border-2 border-white/25 bg-transparent text-cream"
      >
        <FlashIcon size={26} />
      </button>
    </div>
  )
}
