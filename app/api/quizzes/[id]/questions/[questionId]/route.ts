import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string, questionId: string } }
) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    await prisma.quizQuestion.delete({
      where: {
        quizId_questionId: {
          quizId: params.id,
          questionId: params.questionId
        }
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove question error:', error)
    return NextResponse.json({ error: 'Failed to remove question' }, { status: 500 })
  }
}
