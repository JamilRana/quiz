import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { quizSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizzes = await prisma.quiz.findMany({
      include: {
        subjects: {
          include: {
            subject: { select: { id: true, name: true } }
          }
        },
        batches: {
          select: { id: true, title: true, slug: true, isActive: true },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Quizzes GET error:', error)
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
    const validatedData = quizSchema.parse(body)

    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        durationMinutes: validatedData.durationMinutes,
        isActive: validatedData.isActive,
        showLeaderboard: validatedData.showLeaderboard,
        examMode: validatedData.examMode,
        subjects: {
          create: validatedData.subjectIds.map((id: string) => ({
            subject: { connect: { id } }
          })),
        },
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Quizzes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
