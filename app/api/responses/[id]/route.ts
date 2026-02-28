import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await prisma.response.findUnique({
      where: { id: params.id },
      include: {
        batch: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: { question: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        answers: true,
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Flatten questions from QuizQuestion
    const flattenedQuestions = response.batch.quiz.questions.map(qq => ({
      id: qq.question.id,
      text: qq.question.text,
      type: qq.question.type,
      marks: qq.marks,
      options: qq.question.options, // This is Json (array of strings)
    }))

    const existingAnswers: Record<string, { textAnswer?: string; selectedOption?: string }> = {}
    response.answers.forEach((answer) => {
      existingAnswers[answer.questionId] = {
        textAnswer: answer.textAnswer || undefined,
        selectedOption: answer.textAnswer || undefined, // We used textAnswer for both in simple logic
      }
    })

    return NextResponse.json({
      ...response,
      questions: flattenedQuestions,
      batch: {
        id: response.batch.id,
        title: response.batch.title,
        quizTitle: response.batch.quiz.title,
        durationMinutes: response.batch.quiz.durationMinutes,
        examMode: response.batch.quiz.examMode,
      },
      existingAnswers,
    })
  } catch (error) {
    console.error('Response GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
