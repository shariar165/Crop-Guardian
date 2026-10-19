import UnknownView from '@/components/UnknownView'
import { parseMock } from '@/lib/diagnosis/mock'

export const metadata = { title: 'চিনতে পারিনি — Crop Guardian' }

export default async function UnknownPage({ searchParams }: PageProps<'/unknown'>) {
  const { mock } = await searchParams
  return <UnknownView mock={parseMock(mock)} />
}
