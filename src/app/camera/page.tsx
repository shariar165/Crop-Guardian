import CameraScreen from '@/components/CameraScreen'
import { parseMock } from '@/lib/diagnosis/mock'

export const metadata = { title: 'পাতার ছবি তোলা — Crop Guardian' }

export default async function CameraPage({ searchParams }: PageProps<'/camera'>) {
  const { mock } = await searchParams
  return <CameraScreen mock={parseMock(mock)} />
}
