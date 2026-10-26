import Link from 'next/link'
import { chooseUnion } from '@/app/planting/actions'
import { BackIcon, CheckIcon } from '@/components/icons'
import { DIVISIONS, districtById, fullName, type Union, upazilaById } from '@/lib/areas'

const BUTTON = 'flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] border-2 px-2 text-center text-base leading-[1.2] font-bold no-underline'
const OFF = 'border-line bg-paper text-ink'
const ON = 'border-ink bg-sun text-ink'
const byName = <T extends { nameBn: string }>(list: T[]) => [...list].sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'))

/**
 * The farmer's place in three steps, district → upazila → union, as big buttons. Steps are links
 * (`?d=` district, `?u=` upazila) so it works without JavaScript; the union is saved in a cookie by
 * a server action, which then comes back to `base`.
 */
export default function UnionPicker({
  current,
  district: d,
  upazila: u,
  base,
}: {
  current: Union | null
  district: string | undefined
  upazila: string | undefined
  // This page's URL without `d` and `u`, e.g. "/planting?from=guide".
  base: string
}) {
  const href = (key: 'd' | 'u', value: string) => `${base}${base.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`
  const upazila = upazilaById(u)
  const district = upazila ? districtById(upazila.districtId) : districtById(d)

  if (upazila && district) {
    return (
      <div className="flex flex-col gap-2">
        <StepBack href={href('d', district.id)} label={`${upazila.nameBn}, ${district.nameBn}: ইউনিয়ন বেছে নিন`} />
        <form action={chooseUnion} className="grid grid-cols-2 gap-2">
          <input type="hidden" name="next" value={base} />
          {upazila.unions.map((x) => {
            const selected = x.id === current?.id
            return (
              <button key={x.id} type="submit" name="union" value={x.id} aria-pressed={selected} className={`${BUTTON} ${selected ? ON : OFF}`}>
                {selected && <CheckIcon size={18} weight={2.8} />}
                {x.nameBn}
              </button>
            )
          })}
        </form>
      </div>
    )
  }

  if (district) {
    return (
      <div className="flex flex-col gap-2">
        <StepBack href={href('d', '')} label={`${district.nameBn} জেলা: উপজেলা বেছে নিন`} />
        <div className="grid grid-cols-2 gap-2">
          {district.upazilas.map((x) => (
            <Link key={x.id} href={href('u', x.id)} className={`${BUTTON} ${x.id === current?.upazilaId ? ON : OFF}`}>
              {x.nameBn}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (current && d === undefined) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[14px] border-2 border-ink bg-sun px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-base leading-[1.3] font-bold">
          <CheckIcon size={18} weight={2.8} className="shrink-0" />
          {fullName(current)}
        </span>
        <Link href={href('d', upazilaById(current.upazilaId)!.districtId)} className="shrink-0 text-[15px] font-bold text-teal">
          বদলান
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {DIVISIONS.map((v) => (
        <section key={v.id} className="flex flex-col gap-2">
          <h3 className="m-0 text-[15px] font-bold text-muted-2">{v.nameBn}</h3>
          <div className="grid grid-cols-2 gap-2">
            {byName(v.districts).map((x) => (
              <Link key={x.id} href={href('d', x.id)} className={`${BUTTON} ${current && upazilaById(current.upazilaId)?.districtId === x.id ? ON : OFF}`}>
                {x.nameBn}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function StepBack({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={href} aria-label="আগের ধাপ" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink">
        <BackIcon size={20} />
      </Link>
      <span className="text-[15px] leading-[1.3] font-bold">{label}</span>
    </div>
  )
}
