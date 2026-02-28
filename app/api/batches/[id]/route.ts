import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { quizBatchSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        quiz: { include: { questions: { include: { question: true }, orderBy: { order: 'asc' } } } },
        _count: { select: { responses: true } },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Batch GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = quizBatchSchema.parse(body)

    const existingBatch = await prisma.batch.findUnique({
      where: { id: params.id },
    })

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (validatedData.slug !== existingBatch.slug) {
      const slugExists = await prisma.batch.findUnique({
        where: { slug: validatedData.slug },
      })
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    const batch = await prisma.batch.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(batch)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Batch PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.batch.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Batch DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
