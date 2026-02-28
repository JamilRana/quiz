import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

let cachedLeaderboard: { data: any; timestamp: number; batchId: string } | null = null
const CACHE_DURATION = 5000

export async function GET(
  request: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    const now = Date.now()
    if (cachedLeaderboard && cachedLeaderboard.batchId === params.batchId && now - cachedLeaderboard.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedLeaderboard.data)
    }

    const batch = await prisma.batch.findUnique({
      where: { id: params.batchId },
      select: { leaderboardVisible: true },
    })

    if (!batch || !batch.leaderboardVisible) {
      return NextResponse.json({ error: 'Leaderboard not visible' }, { status: 403 })
    }

    const responses = await prisma.response.findMany({
      where: {
        batchId: params.batchId,
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

    const leaderboard = responses.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      email: r.email,
      name: r.name,
      score: r.totalScore,
      submittedAt: r.submittedAt,
    }))

    cachedLeaderboard = { data: leaderboard, timestamp: now, batchId: params.batchId }

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Leaderboard GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
