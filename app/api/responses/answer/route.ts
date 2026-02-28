import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { responseId, questionId, textAnswer, selectedOption } = body

    if (!responseId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { 
        batch: {
          include: { quiz: true }
        } 
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    const elapsed = Date.now() - new Date(response.startedAt).getTime()
    const maxDuration = response.batch.quiz.durationMinutes * 60 * 1000

    if (elapsed > (maxDuration + 30000)) { // 30s grace period
      return NextResponse.json({ error: 'Time expired' }, { status: 400 })
    }

    const quizQuestion = await prisma.quizQuestion.findFirst({
      where: { 
        quizId: response.batch.quizId,
        questionId: questionId
      },
      include: { question: true }
    })

    if (!quizQuestion) {
      return NextResponse.json({ error: 'Question not found in this quiz' }, { status: 404 })
    }

    const question = quizQuestion.question
    let isCorrect = false
    let score = 0

    const providedAnswer = textAnswer || selectedOption

    if (question.type === 'TEXT') {
      // Manual grading usually required for text, but we can store it
      score = 0 
    } else {
      isCorrect = providedAnswer?.toString().trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      score = isCorrect ? quizQuestion.marks : 0
    }

    const existingAnswer = await prisma.answer.findFirst({
      where: { responseId, questionId },
    })

    let answer
    if (existingAnswer) {
      answer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { textAnswer: providedAnswer, isCorrect, score },
      })
    } else {
      answer = await prisma.answer.create({
        data: {
          responseId,
          questionId,
          textAnswer: providedAnswer,
          isCorrect,
          score,
        },
      })
    }

    return NextResponse.json(answer)
  } catch (error) {
    console.error('Answer POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
