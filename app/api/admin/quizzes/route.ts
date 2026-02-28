import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectIds: z.array(z.string()).min(1, 'At least one subject is required'),
  durationMinutes: z.number().int().min(1).default(60),
  isActive: z.boolean().default(false),
  showLeaderboard: z.boolean().default(true),
  examMode: z.boolean().default(false),
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          _count: { select: { questions: true, batches: true } },
          batches: { select: { id: true, title: true, isActive: true }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quiz.count({ where }),
    ])

    return NextResponse.json({ quizzes, total })
  } catch (error) {
    console.error('Admin quizzes GET error:', error)
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
    const validatedData = createQuizSchema.parse(body)

    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        durationMinutes: validatedData.durationMinutes,
        isActive: validatedData.isActive,
        showLeaderboard: validatedData.showLeaderboard,
        examMode: validatedData.examMode,
        subjects: {
          create: validatedData.subjectIds.map((subjectId) => ({
            subjectId,
          })),
        },
      },
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Admin quizzes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
