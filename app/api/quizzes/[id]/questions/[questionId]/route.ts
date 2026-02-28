import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string, questionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
