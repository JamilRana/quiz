import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await prisma.response.findUnique({
      where: { id: params.id },
      include: {
        batch: { include: { quiz: { include: { questions: true } } } },
        answers: true,
      },
    }) as any

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    if (response.isComplete) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
    }

    const elapsed = Date.now() - new Date(response.startedAt).getTime()
    const maxDuration = response.batch.quiz.durationMinutes * 60 * 1000

    if (elapsed > (maxDuration + 30000)) { // 30s grace period
      return NextResponse.json({ error: 'Time expired' }, { status: 400 })
    }

    const quizQuestions = response.batch.quiz.questions
    const answeredCount = response.answers.filter((a: any) => a.textAnswer).length
    
    // In exam mode, ensure all questions have at least a blank answer record
    if (response.batch.quiz.examMode) {
      for (const qq of quizQuestions) {
        const hasAnswer = response.answers.some((a: any) => a.questionId === qq.questionId)
        if (!hasAnswer) {
          await prisma.answer.create({
            data: {
              responseId: response.id,
              questionId: qq.questionId,
              isCorrect: false,
              score: 0,
            },
          })
        }
      }
    }

    const totalScore = await prisma.answer.aggregate({
      where: { responseId: response.id },
      _sum: { score: true },
    })

    const duration = Math.floor(elapsed / 1000)
    const expectedDuration = response.batch.quiz.durationMinutes * 60
    let flagReason = null

    if (duration < expectedDuration * 0.2) {
      flagReason = 'Submission too fast (< 20% of duration)'
    }

    await prisma.response.update({
      where: { id: response.id },
      data: {
        isComplete: true,
        submittedAt: new Date(),
        totalScore: totalScore._sum.score || 0,
        isFlagged: flagReason ? true : response.isFlagged,
        flagReason: flagReason || response.flagReason,
      },
    })

    await prisma.auditLog.create({
      data: {
        responseId: response.id,
        batchId: response.batchId,
        action: 'SUBMIT',
        details: {
          duration,
          expectedDuration,
          answeredCount,
          totalQuestions: quizQuestions.length,
          flagReason,
        },
        ipAddress: response.ipAddress,
      },
    })

    return NextResponse.json({ success: true, score: totalScore._sum.score || 0 })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
