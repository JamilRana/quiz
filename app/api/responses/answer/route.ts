import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { responseId, questionId, answer } = body

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

    if (question.type === 'TEXT') {
      // Manual grading usually required for text
      score = 0
    } else if (question.type === 'MULTIPLE') {
      const correctList = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : typeof question.correctAnswer === 'string'
          ? question.correctAnswer.split(',').map(s => s.trim())
          : []
      
      const studentList = Array.isArray(answer)
        ? answer
        : typeof answer === 'string'
          ? answer.split(',').map(s => s.trim())
          : []

      const normCorrect = correctList.map((x: any) => String(x).trim().toLowerCase()).sort()
      const normStudent = studentList.map((x: any) => String(x).trim().toLowerCase()).sort()

      if (normCorrect.length > 0 && normCorrect.length === normStudent.length) {
        isCorrect = normCorrect.every((val, index) => val === normStudent[index])
      }
      score = isCorrect ? quizQuestion.marks : 0
    } else { // SINGLE
      const correctVal = typeof question.correctAnswer === 'string' 
        ? question.correctAnswer.trim().toLowerCase() 
        : String(question.correctAnswer || '').trim().toLowerCase()
      
      const studentVal = typeof answer === 'string' 
        ? answer.trim().toLowerCase() 
        : String(answer || '').trim().toLowerCase()
      
      isCorrect = correctVal === studentVal && correctVal !== ''
      score = isCorrect ? quizQuestion.marks : 0
    }

    const savedAnswer = await prisma.answer.upsert({
      where: {
        responseId_questionId: { responseId, questionId },
      },
      update: { answer, isCorrect, score },
      create: {
        responseId,
        questionId,
        answer,
        isCorrect,
        score,
      },
    })

    return NextResponse.json(savedAnswer)
  } catch (error) {
    console.error('Answer POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
