import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { quizBatchSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search')

    const where: any = {}
    if (quizId) where.quizId = quizId
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          quiz: { select: { id: true, title: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.batch.count({ where }),
    ])

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Batches GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = quizBatchSchema.parse(body)

    const existingSlug = await prisma.batch.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const batch = await prisma.batch.create({
      data: {
        quizId: validatedData.quizId,
        title: validatedData.title,
        slug: validatedData.slug,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        isActive: validatedData.isActive,
        ipLockEnabled: validatedData.ipLockEnabled,
        deviceLockEnabled: validatedData.deviceLockEnabled,
        leaderboardVisible: validatedData.leaderboardVisible,
        strictIpMode: validatedData.strictIpMode,
        strictDeviceMode: validatedData.strictDeviceMode,
      },
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Batches POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
