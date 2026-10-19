'use client'

import { useEffect, useState } from 'react'
import { PhotoLeaf } from '@/components/illustrations'
import { type CaptureSlot, getCapture } from '@/lib/captureStore'

const LABEL = 'text-[11px] font-semibold text-[#F1E8D6]'

// An object URL for the farmer's photo in `slot`, or null when there isn't one (or in demos).
function useCapturedUrl(slot: CaptureSlot, enabled = true): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    let objectUrl: string | null = null
    let cancelled = false
    getCapture(slot)
      .then((capture) => {
        if (cancelled || !capture) return
        objectUrl = URL.createObjectURL(capture.blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [slot, enabled])
  return url
}

/** The farmer's top-of-leaf photo from the camera screen, or the sample drawing if there isn't one. */
export default function CapturedThumb({ enabled = true }: { enabled?: boolean }) {
  const url = useCapturedUrl('top', enabled)

  if (!url) {
    return (
      <>
        <PhotoLeaf />
        <span className={LABEL}>আপনার ছবি</span>
      </>
    )
  }
  return (
    <>
      {/* A blob: URL can't go through next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="আপনার তোলা পাতার ছবি" className="absolute inset-0 size-full object-cover" />
      <span className={`absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center ${LABEL}`}>আপনার ছবি</span>
    </>
  )
}

/** A small square of the farmer's photo for the "why" list. */
export function PhotoChip({ slot = 'top', enabled = true }: { slot?: CaptureSlot; enabled?: boolean }) {
  const url = useCapturedUrl(slot, enabled)
  return (
    <span className="relative flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1F2A17]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="আপনার তোলা পাতার ছবি" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="scale-[0.6]">
          <PhotoLeaf />
        </span>
      )}
    </span>
  )
}
