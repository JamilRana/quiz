import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { responseId, questionId, textAnswer } = body

    if (!responseId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await prisma.response.findUnique({
      where: { id: responseId },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    if (response.submittedAt) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    const existingAnswer = await prisma.answer.findFirst({
      where: { responseId, questionId },
    })

    if (existingAnswer) {
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          textAnswer,
        },
      })
    } else {
      await prisma.answer.create({
        data: {
          responseId,
          questionId,
          textAnswer,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Autosave error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
