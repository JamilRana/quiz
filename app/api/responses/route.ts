import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const flagged = searchParams.get('flagged')

    const where: any = {}
    if (batchId) where.batchId = batchId
    if (flagged === 'true') where.isFlagged = true

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        include: {
          batch: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.response.count({ where }),
    ])

    return NextResponse.json({
      responses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Responses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
