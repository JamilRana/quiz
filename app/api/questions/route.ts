import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'
import { questionSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const authResult = await requireInstructorOrAdmin()
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const subjectIds = searchParams.get('subjectIds')?.split(',')
    const difficulty = searchParams.get('difficulty')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (subjectId) where.subjectId = subjectId
    if (subjectIds) where.subjectId = { in: subjectIds }
    if (difficulty) where.difficulty = difficulty
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const questions = await prisma.question.findMany({
      where,
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireInstructorOrAdmin()
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const question = await prisma.question.create({
      data: {
        subjectId: validatedData.subjectId,
        text: validatedData.text,
        type: validatedData.type,
        difficulty: validatedData.difficulty,
        options: validatedData.options ?? undefined,
        correctAnswer: validatedData.correctAnswer ?? null,
        explanation: validatedData.explanation,
        createdById: user.id,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Questions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
