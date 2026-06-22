import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export async function GET() {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const questions = await prisma.question.findMany({
      include: {
        answers: {
          select: { isCorrect: true }
        },
        subject: { select: { name: true } }
      }
    })

    const analytics = questions.map(q => {
      const totalAnswers = q.answers.length
      const correctAnswers = q.answers.filter(a => a.isCorrect).length
      
      return {
        id: q.id,
        text: q.text,
        subject: q.subject.name,
        difficulty: q.difficulty,
        totalAttempts: totalAnswers,
        correctRate: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(1) : 0
      }
    }).sort((a, b) => Number(a.correctRate) - Number(b.correctRate)) // Most failed first

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Question Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch question analytics' }, { status: 500 })
  }
}
