import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const batch = await prisma.batch.findUnique({ where: { id: params.id }, include: { quiz: { select: { id: true, title: true } } } })
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [totalParticipants, completed, ongoing, flagged, autoSubmitted, scores, responses, suspicious] = await Promise.all([
      prisma.response.count({ where: { batchId: params.id } }),
      prisma.response.count({ where: { batchId: params.id, isComplete: true } }),
      prisma.response.count({ where: { batchId: params.id, isComplete: false } }),
      prisma.response.count({ where: { batchId: params.id, isFlagged: true } }),
      prisma.response.count({ where: { batchId: params.id, isComplete: true, flagReason: { contains: 'time' } } }),
      prisma.response.findMany({ where: { batchId: params.id, isComplete: true }, select: { totalScore: true } }),
      prisma.response.findMany({ where: { batchId: params.id }, orderBy: [{ totalScore: 'desc' }, { submittedAt: 'asc' }], take: 100, select: { id: true, email: true, name: true, totalScore: true, submittedAt: true } }),
      prisma.response.findMany({ where: { batchId: params.id, isFlagged: true }, select: { id: true, email: true, ipAddress: true, totalScore: true, isFlagged: true, flagReason: true, startedAt: true, submittedAt: true } }),
      [],
    ])

    const vals = scores.map(s => s.totalScore)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0

    const timeline: any[] = []
    const now = new Date()
    for (let i = 24; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5 * 60 * 1000)
      timeline.push({ time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), count: 0 })
    }

    return NextResponse.json({
      batchTitle: batch.title, leaderboardVisible: batch.leaderboardVisible,
      stats: { totalParticipants, completed, ongoing, flagged, autoSubmitted, averageScore: avg, highestScore: vals.length ? Math.max(...vals) : 0, lowestScore: vals.length ? Math.min(...vals) : 0 },
      leaderboard: responses.map((r, i) => ({ ...r, rank: i + 1 })),
      submissionTimeline: timeline,
      suspicious: suspicious.map(s => ({ ...s, batch: { title: batch.title } })),
    })
  } catch (error) {
    console.error('Results error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
