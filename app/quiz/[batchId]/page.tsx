import QuizView from './QuizView'

export const dynamic = 'force-dynamic'

export default function QuizPage({ params }: { params: { batchId: string } }) {
  return <QuizView batchId={params.batchId} />
}
