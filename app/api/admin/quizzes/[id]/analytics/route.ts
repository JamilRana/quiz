import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                answers: {
                  where: {
                    response: {
                      batch: { quizId: params.id }
                    }
                  }
                }
              }
            }
          }
        },
        batches: {
          include: {
            responses: {
              where: { isComplete: true }
            }
          }
        }
      }
    }) as any

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Process question performance
    const questionPerformance = quiz.questions.map((qq: any) => {
      const q = qq.question
      const totalAnswers = q.answers.length
      const correctAnswers = q.answers.filter((a: any) => a.isCorrect).length
      
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        marks: qq.marks,
        totalAttempts: totalAnswers,
        correctRate: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      }
    })

    // Process batch performance
    const batchStats = quiz.batches.map((b: any) => {
      const completionRate = b.responses.length // Assuming total responses is denominator
      const avgScore = b.responses.length > 0 
        ? b.responses.reduce((acc: number, r: any) => acc + r.totalScore, 0) / b.responses.length 
        : 0

      return {
        id: b.id,
        title: b.title,
        responseCount: b.responses.length,
        avgScore: avgScore.toFixed(2)
      }
    })

    // Score distribution (0-20, 21-40, ...)
    const allScores = quiz.batches.flatMap((b: any) => b.responses.map((r: any) => r.totalScore))
    const totalPossibleMarks = quiz.questions.reduce((acc: number, q: any) => acc + q.marks, 0)
    
    const distribution = [0, 0, 0, 0, 0] // 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
    allScores.forEach((score: number) => {
      const percentage = (score / totalPossibleMarks) * 100
      const index = Math.min(Math.floor(percentage / 20), 4)
      distribution[index]++
    })

    return NextResponse.json({
      quizTitle: quiz.title,
      totalResponses: allScores.length,
      avgScore: allScores.length > 0 ? (allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(2) : 0,
      maxPossible: totalPossibleMarks,
      questionPerformance,
      batchStats,
      scoreDistribution: distribution.map((count, i) => ({
        range: `${i * 20 + 1}-${(i + 1) * 20}%`,
        count
      }))
    })
  } catch (error) {
    console.error('Quiz Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
