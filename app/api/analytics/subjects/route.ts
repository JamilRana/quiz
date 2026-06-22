import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export async function GET() {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const subjects = await prisma.subject.findMany({
      include: {
        questions: {
          select: { difficulty: true }
        },
        quizzes: {
          include: {
            quiz: {
              include: {
                batches: {
                  include: {
                    responses: {
                      select: { totalScore: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const analytics = subjects.map(s => {
      let totalScores = 0
      let responseCount = 0
      
      s.quizzes.forEach((qs: any) => {
        qs.quiz.batches.forEach((b: any) => {
          b.responses.forEach((r: any) => {
            totalScores += r.totalScore
            responseCount++
          })
        })
      })

      const difficultyDist = s.questions.reduce((acc: any, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
        return acc
      }, {})

      return {
        id: s.id,
        name: s.name,
        questionCount: s.questions.length,
        quizCount: s.quizzes.length,
        avgScore: responseCount > 0 ? (totalScores / responseCount).toFixed(2) : 0,
        difficultyDistribution: difficultyDist
      }
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Subject Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch subject analytics' }, { status: 500 })
  }
}
