import Link from 'next/link'

const BASE = 'flex items-center justify-center no-underline box-border'

export const primaryClass = `${BASE} rounded-[20px] bg-sun text-ink shadow-[0_4px_0_#B8901C] active:translate-y-[2px] active:shadow-[0_2px_0_#B8901C]`
export const tealClass = `${BASE} rounded-[20px] border-0 bg-teal text-white`
export const outlineClass = `${BASE} rounded-[20px] border-2 border-ink bg-transparent text-ink`

export function PrimaryLink({
  href,
  className = '',
  children,
  ...rest
}: { href: string; className?: string; children: React.ReactNode } & Omit<
  React.ComponentProps<typeof Link>,
  'href' | 'className'
>) {
  return (
    <Link href={href} className={`${primaryClass} ${className}`} {...rest}>
      {children}
    </Link>
  )
}

export function SectionRule({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <span className="text-sm font-bold text-muted">{label}</span>
      <span className="flex-1 border-t-2 border-dashed border-stitch" />
    </div>
  )
}
