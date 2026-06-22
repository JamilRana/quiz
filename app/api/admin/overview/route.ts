import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await requireInstructorOrAdmin()
    if (authResult instanceof NextResponse) return authResult

    const [
      totalQuizzes,
      totalBatches,
      totalActiveBatches,
      totalParticipants,
      ongoingExams,
      suspiciousCount,
    ] = await Promise.all([
      prisma.quiz.count(),
      prisma.batch.count(),
      prisma.batch.count({ where: { isActive: true } }),
      prisma.response.count(),
      prisma.response.count({ where: { isComplete: false, submittedAt: null } }),
      prisma.response.count({ where: { isFlagged: true } }),
    ])

    const latestSubmissions = await prisma.response.findMany({
      where: { isComplete: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      include: {
        batch: { select: { title: true } },
      },
    })

    const tabSwitchLogs = await prisma.auditLog.count({
      where: { action: 'TAB_SWITCH' },
    })

    const autoSubmitted = await prisma.response.count({
      where: {
        isComplete: true,
        flagReason: { contains: 'time' },
      },
    })

    return NextResponse.json({
      stats: {
        totalQuizzes,
        totalBatches,
        totalActiveBatches,
        totalParticipants,
        ongoingExams,
        suspiciousCount,
        tabSwitchLogs,
        autoSubmitted,
      },
      latestSubmissions: latestSubmissions.map((s) => ({
        id: s.id,
        email: s.email,
        name: s.name,
        score: s.totalScore,
        submittedAt: s.submittedAt,
        batchTitle: s.batch.title,
      })),
    })
  } catch (error) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
