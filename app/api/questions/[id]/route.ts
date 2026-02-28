import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { questionSchema } from '@/lib/validations'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: { subject: true }
    })
    return NextResponse.json(question)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = questionSchema.parse(body)

    const question = await prisma.question.update({
      where: { id: params.id },
      data: validatedData
    })
    return NextResponse.json(question)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Soft delete if preferred, but user said delete subject cascade optional.
    // For questions, let's just delete for now unless user really wants soft delete on bank.
    // The user mentioned: "Soft delete (isActive = false)"
    await prisma.question.update({
      where: { id: params.id },
      data: { isActive: false }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to deactivate question' }, { status: 500 })
  }
}
