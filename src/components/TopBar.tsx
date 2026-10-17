import Link from 'next/link'
import { BackIcon } from './icons'

export function RoundLink({
  href,
  label,
  children,
  dark = false,
}: {
  href: string
  label: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex size-11 items-center justify-center rounded-full ${
        dark ? 'bg-white/12 text-cream' : 'bg-sand text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

export default function TopBar({
  back,
  title,
  right,
  height = 64,
  dark = false,
}: {
  back: string
  title: React.ReactNode
  right: React.ReactNode
  height?: number
  dark?: boolean
}) {
  return (
    <header style={{ height }} className="flex shrink-0 items-center justify-between px-4">
      <RoundLink href={back} label="ফিরে যান" dark={dark}>
        <BackIcon />
      </RoundLink>
      {typeof title === 'string' ? (
        <h1 className="m-0 font-display text-[21px] font-bold">{title}</h1>
      ) : (
        title
      )}
      {right}
    </header>
  )
}
