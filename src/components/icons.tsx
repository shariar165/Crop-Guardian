import type { SVGProps } from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'stroke'> & { size?: number; weight?: number }

function Icon({ size = 24, weight = 2, children, style, ...rest }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const SpeakerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </Icon>
)

export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Icon>
)

export const BackIcon = (p: IconProps) => (
  <Icon weight={2.4} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </Icon>
)

export const CameraIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)

export const MapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </Icon>
)

export const LedgerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1" />
    <path d="M8.5 10h7M8.5 14h7M8.5 18h4" />
  </Icon>
)

export const BookIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
    <path d="M12 6.5V20" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)

export const WarnIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4" />
    <path d="M12 17v.5" />
  </Icon>
)

export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
)

/** Spray bottle; `crossed` draws the "no spray" slash. */
export const SprayIcon = ({ crossed = false, ...p }: IconProps & { crossed?: boolean }) => (
  <Icon {...p}>
    <path d="M9 10h6v10H9z" />
    <path d="M10 10V7h4v3" />
    <path d="M14 7h3.5" />
    <path d="M19.5 5.5l1.5-1M19.5 8.5l1.5 1" />
    <path d="M4 4l16 16" strokeWidth={2.4} opacity={crossed ? 1 : 0} />
  </Icon>
)

export const SprayBottleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 10h6v10H9z" />
    <path d="M10 10V7h4v3" />
    <path d="M14 7h3.5" />
  </Icon>
)

export const QuestionIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2.2-2.5 3.8" />
    <path d="M12 17.5v.01" />
  </Icon>
)

export const ChatQuestionIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M10 9.2a2.2 2.2 0 0 1 4 1c0 1.4-2 1.6-2 2.8" />
    <path d="M12 15v.01" />
  </Icon>
)

export const ChatCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8.5 10.5l2.2 2.2 4.8-4.7" />
  </Icon>
)

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12l16-8-6 16-2.5-6.5z" />
  </Icon>
)

export const FogCloudIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 16h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 16z" />
    <path d="M5 19.5h12" />
  </Icon>
)

export const MistCloudIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z" />
    <path d="M4 18.5h14M7 21h10" />
  </Icon>
)

export const SyncIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 0 1-13.7 5.6" />
    <path d="M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M18 3v4h-4" />
    <path d="M6 21v-4h4" />
  </Icon>
)

export const RestartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v4h4" />
  </Icon>
)

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2" />
  </Icon>
)

export const GalleryIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M20 16l-5-5-8 8" />
  </Icon>
)

export const FlashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
  </Icon>
)

export const OfflineIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3l18 18" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M5 12.5a10 10 0 0 1 5-2.6" />
    <path d="M14.5 10a10 10 0 0 1 4.5 2.5" />
    <path d="M12 20h.01" />
  </Icon>
)

export const DocIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h6" />
  </Icon>
)

export const PersonIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
)

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Icon>
)

export const WaveIcon = (p: IconProps) => (
  <Icon weight={2.4} {...p}>
    <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
  </Icon>
)

export const SproutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z" />
    <path d="M12 14.5c0-3-2.3-5-5.5-5 0 3 2.3 5 5.5 5z" />
    <path d="M7 21h10" />
  </Icon>
)

export const BasketIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 10h18l-2 10H5z" />
    <path d="M8 10l3-6M16 10l-3-6" />
    <path d="M9 14v3M15 14v3" />
  </Icon>
)

export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </Icon>
)
