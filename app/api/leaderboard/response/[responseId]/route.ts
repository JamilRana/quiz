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
      include: { batch: true },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    if (!response.batch.leaderboardVisible) {
      return NextResponse.json({ error: 'Leaderboard not visible' }, { status: 403 })
    }

    const leaderboard = await prisma.response.findMany({
      where: {
        batchId: response.batchId,
        submittedAt: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        totalScore: true,
        submittedAt: true,
      },
      orderBy: { totalScore: 'desc' },
      take: 50,
    })

    const userRank = leaderboard.findIndex((e) => e.id === params.responseId) + 1

    return NextResponse.json({ leaderboard, userRank })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
