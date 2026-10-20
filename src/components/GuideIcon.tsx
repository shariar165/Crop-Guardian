import type { GuideIcon as Kind } from '@/lib/guide'
import { CameraIcon, ChatQuestionIcon, LedgerIcon, MapIcon, OfflineIcon, PinIcon, SendIcon, WarnIcon } from './icons'
import { DayGlyph } from './illustrations'

/** The round picture for a guide section or intro card. */
export default function GuideIcon({ kind, size = 'md' }: { kind: Kind; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-24' : 'size-12'
  const icon = size === 'lg' ? 48 : 26
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-mist text-teal`}>
      {kind === 'pin' && <PinIcon size={icon} />}
      {kind === 'risk' && (
        <span className={size === 'lg' ? 'scale-[2]' : 'scale-125'}>
          <DayGlyph risk="watch" />
        </span>
      )}
      {kind === 'camera' && <CameraIcon size={icon} weight={2.2} />}
      {kind === 'question' && <ChatQuestionIcon size={icon} weight={2.2} />}
      {kind === 'send' && <SendIcon size={icon} />}
      {kind === 'ledger' && <LedgerIcon size={icon} />}
      {kind === 'map' && <MapIcon size={icon} />}
      {kind === 'offline' && <OfflineIcon size={icon} />}
      {kind === 'warn' && <WarnIcon size={icon} weight={2.2} />}
    </span>
  )
}
