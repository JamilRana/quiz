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
        batch: {
          include: {
            quiz: {
              include: { questions: true },
            },
          },
        },
        answers: true,
      },
    }) as any

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    if (response.isComplete) {
      const showLeaderboard = response.batch.quiz?.showLeaderboard && response.batch.leaderboardVisible
      return NextResponse.json({
        error: 'Already submitted',
        score: response.totalScore,
        showLeaderboard,
        redirectUrl: showLeaderboard
          ? `/quiz/${response.batchId}/leaderboard?responseId=${response.id}`
          : `/quiz/${response.batchId}/submit?responseId=${response.id}`,
      }, { status: 400 })
    }

    const elapsed = Date.now() - new Date(response.startedAt).getTime()
    const maxDuration = response.batch.quiz.durationMinutes * 60 * 1000

    if (elapsed > (maxDuration + 30000)) {
      await prisma.auditLog.create({
        data: {
          responseId: response.id,
          batchId: response.batchId,
          action: 'SUBMIT_TIMEOUT',
          details: {
            elapsed: Math.floor(elapsed / 1000),
            maxDuration: Math.floor(maxDuration / 1000),
          },
          ipAddress: response.ipAddress,
          severity: 'WARNING',
        },
      })
    }

    const quizQuestions = response.batch.quiz.questions
    // Deduplicate answers: keep only the latest for each questionId
    const seenQuestions = new Set<string>()
    const dupIds: string[] = []
    const dedupedAnswers: any[] = []
    
    for (const a of response.answers) {
      if (seenQuestions.has(a.questionId)) {
        dupIds.push(a.id)
      } else {
        seenQuestions.add(a.questionId)
        dedupedAnswers.push(a)
      }
    }

    if (dupIds.length > 0) {
      await prisma.answer.deleteMany({ where: { id: { in: dupIds } } })
    }

    const answeredCount = dedupedAnswers.filter((a: any) => a.answer).length

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
    const flagReasons: string[] = [...(response.isFlagged ? [response.flagReason || ''] : [])]

    if (duration < expectedDuration * 0.2) {
      flagReasons.push(`Submission too fast (${Math.round((duration / expectedDuration) * 100)}% of allowed time)`)
    }

    if (elapsed > (maxDuration + 30000)) {
      flagReasons.push(`Late submission / Time expired (${Math.round((elapsed - maxDuration) / 1000)}s late)`)
    }

    if (answeredCount === 0 && quizQuestions.length > 0) {
      flagReasons.push('No answers submitted')
    }

    const cleanedFlagReasons = flagReasons.filter(r => r.length > 0)
    const finalFlagReason = cleanedFlagReasons.length > 0 ? cleanedFlagReasons.join('; ') : null

    await prisma.response.update({
      where: { id: response.id },
      data: {
        isComplete: true,
        submittedAt: new Date(),
        totalScore: totalScore._sum.score || 0,
        isFlagged: finalFlagReason ? true : false,
        flagReason: finalFlagReason,
      },
    })

    const auditDetails: Record<string, any> = {
      duration,
      expectedDuration,
      durationPercentage: Math.round((duration / expectedDuration) * 100),
      answeredCount,
      totalQuestions: quizQuestions.length,
      totalScore: totalScore._sum.score || 0,
      examMode: response.batch.quiz.examMode,
    }
    if (finalFlagReason) {
      auditDetails.flagReasons = cleanedFlagReasons
    }

    await prisma.auditLog.create({
      data: {
        responseId: response.id,
        batchId: response.batchId,
        action: finalFlagReason ? 'SUBMIT_FLAGGED' : 'SUBMIT',
        details: auditDetails,
        ipAddress: response.ipAddress,
        severity: finalFlagReason ? 'WARNING' : 'INFO',
      },
    })

    const showLeaderboard = response.batch.quiz?.showLeaderboard && response.batch.leaderboardVisible

    return NextResponse.json({
      success: true,
      score: totalScore._sum.score || 0,
      showLeaderboard,
      redirectUrl: showLeaderboard
        ? `/quiz/${response.batchId}/leaderboard?responseId=${response.id}`
        : `/quiz/${response.batchId}/submit?responseId=${response.id}`,
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
