import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const batch = await prisma.batch.findUnique({ where: { id: params.id }, include: { quiz: { select: { id: true, title: true, durationMinutes: true } } } })
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [participants, totalQuestions] = await Promise.all([
      prisma.response.findMany({ where: { batchId: params.id }, select: { id: true, email: true, name: true, startedAt: true, isComplete: true, submittedAt: true, ipAddress: true, _count: { select: { answers: true } } }, orderBy: { startedAt: 'desc' } }),
      prisma.quizQuestion.count({ where: { quizId: batch.quizId } }),
    ])

    const avg = participants.length ? Math.round(participants.reduce((s, p) => s + (p._count.answers / totalQuestions) * 100, 0) / participants.length) : 0

    return NextResponse.json({ batchTitle: batch.title, duration: batch.quiz.durationMinutes, totalQuestions, avgProgress: avg, participants })
  } catch (error) {
    console.error('Live error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
