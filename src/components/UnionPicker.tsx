import { chooseUnion } from '@/app/planting/actions'
import { CheckIcon } from '@/components/icons'
import { UNIONS } from '@/lib/unions'

const SORTED = [...UNIONS].sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'))

/** The unions of Shibganj as big buttons; the chosen one is saved in a cookie by a server action. */
export default function UnionPicker({ current }: { current: string | null }) {
  return (
    <form action={chooseUnion} className="grid grid-cols-2 gap-2">
      {SORTED.map((u) => {
        const selected = u.id === current
        return (
          <button
            key={u.id}
            type="submit"
            name="union"
            value={u.id}
            aria-pressed={selected}
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] border-2 px-2 text-base font-bold ${
              selected ? 'border-ink bg-sun text-ink' : 'border-line bg-paper text-ink'
            }`}
          >
            {selected && <CheckIcon size={18} weight={2.8} />}
            {u.nameBn}
          </button>
        )
      })}
    </form>
  )
}
