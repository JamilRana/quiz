import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const quizQuestions = await prisma.quizQuestion.findMany({
      where: { quizId: params.id },
      include: { question: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(quizQuestions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const { questionIds, marks } = await req.json()
    // questionIds is an array of strings
    
    // Get current max order
    const maxOrder = await prisma.quizQuestion.aggregate({
      where: { quizId: params.id },
      _max: { order: true }
    })
    let currentOrder = (maxOrder._max.order || 0) + 1

    const data = questionIds.map((qId: string, index: number) => ({
      quizId: params.id,
      questionId: qId,
      marks: marks || 1,
      order: currentOrder + index
    }))

    await prisma.quizQuestion.createMany({
      data,
      skipDuplicates: true
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add questions error:', error)
    return NextResponse.json({ error: 'Failed to add questions' }, { status: 500 })
  }
}
