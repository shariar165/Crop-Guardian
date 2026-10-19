import ResultView from '@/components/ResultView'
import { parseMock } from '@/lib/diagnosis/mock'

export const metadata = { title: 'চূড়ান্ত ফলাফল · Crop Guardian' }

export default async function DiagnosisPage({ searchParams }: PageProps<'/result'>) {
  const { mock } = await searchParams
  return <ResultView mock={parseMock(mock)} />
}
