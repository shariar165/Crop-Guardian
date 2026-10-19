import UncertainView from '@/components/UncertainView'
import { parseMock } from '@/lib/diagnosis/mock'

export const metadata = { title: 'ফলাফল — নিশ্চিত নই · Crop Guardian' }

export default async function UncertainPage({ searchParams }: PageProps<'/result/uncertain'>) {
  const { mock } = await searchParams
  return <UncertainView mock={parseMock(mock)} />
}
