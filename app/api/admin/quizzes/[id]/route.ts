import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: { include: { question: true }, orderBy: { order: 'asc' } },
        batches: { include: { _count: { select: { responses: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Quiz detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
