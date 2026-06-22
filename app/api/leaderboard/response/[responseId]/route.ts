import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { responseId: string } }
) {
  try {
    const response = await prisma.response.findUnique({
      where: { id: params.responseId },
      include: {
        batch: {
          include: {
            quiz: { select: { showLeaderboard: true } },
          },
        },
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    const showLeaderboard = response.batch.quiz?.showLeaderboard && response.batch.leaderboardVisible
    if (!showLeaderboard) {
      return NextResponse.json({
        error: 'Leaderboard not visible',
        leaderboard: [],
        userRank: 0,
      })
    }

    const responses = await prisma.response.findMany({
      where: {
        batchId: response.batchId,
        isComplete: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        totalScore: true,
        submittedAt: true,
      },
      orderBy: [
        { totalScore: 'desc' },
        { submittedAt: 'asc' },
      ],
      take: 100,
    })

    const mappedLeaderboard = responses.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      email: r.email,
      name: r.name,
      score: r.totalScore,
      totalScore: r.totalScore,
      submittedAt: r.submittedAt,
    }))

    const userRank = mappedLeaderboard.findIndex((e) => e.id === params.responseId) + 1

    return NextResponse.json({
      leaderboard: mappedLeaderboard,
      userRank: userRank || mappedLeaderboard.length + 1,
      batchTitle: response.batch.title,
      totalParticipants: responses.length,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
