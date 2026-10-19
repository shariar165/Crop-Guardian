import QuestionFlow from '@/components/QuestionFlow'
import { parseMock } from '@/lib/diagnosis/mock'

export const metadata = { title: 'প্রশ্ন করে নিশ্চিত হওয়া — Crop Guardian' }

export default async function QuestionsPage({ searchParams }: PageProps<'/questions'>) {
  const { mock, a } = await searchParams
  return <QuestionFlow mock={parseMock(mock)} answers={typeof a === 'string' ? a : undefined} />
}
