import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalQuizzes, totalBatches, totalResponses, flaggedCount, totalSubjects, totalQuestions] = await Promise.all([
      prisma.quiz.count(),
      prisma.batch.count({ where: { isActive: true } }),
      prisma.response.count(),
      prisma.response.count({ where: { isFlagged: true } }),
      prisma.subject.count(),
      prisma.question.count(),
    ])

    const questionsByType = await prisma.question.groupBy({
      by: ['type'],
      _count: { type: true },
    })

    const recentResponses = await prisma.response.findMany({
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    })

    const submissionByDate = recentResponses.reduce((acc, r) => {
      const date = r.submittedAt?.toISOString().split('T')[0] || ''
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recentSubmissions = Object.entries(submissionByDate)
      .map(([date, count]) => ({ date, count }))
      .slice(-7)

    const questionDistribution = questionsByType.map((q) => ({
      name: q.type,
      value: q._count.type,
    }))

    return NextResponse.json({
      totalQuizzes,
      totalBatches,
      totalResponses,
      flaggedCount,
      totalSubjects,
      totalQuestions,
      recentSubmissions,
      questionDistribution,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
