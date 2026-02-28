import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quiz = await (prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        subjects: {
          include: { subject: true }
        },
        questions: { include: { question: true }, orderBy: { order: 'asc' } },
        batches: {
          include: {
            _count: { select: { responses: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { questions: true } },
      },
    }) as any)

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Quiz GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, subjectIds, durationMinutes, isActive, showLeaderboard, examMode } = body

    const quiz = await (prisma.quiz.update({
      where: { id: params.id },
      data: {
        title,
        description,
        durationMinutes,
        isActive,
        showLeaderboard,
        examMode,
        subjects: subjectIds ? {
          deleteMany: {},
          create: subjectIds.map((id: string) => ({
            subject: { connect: { id } }
          })),
        } : undefined,
      },
      include: {
        subjects: { include: { subject: true } }
      }
    }) as any)

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Quiz PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Quiz deleted' })
  } catch (error) {
    console.error('Quiz DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
