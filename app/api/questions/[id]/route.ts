import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'
import { questionSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

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
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await req.json()
    const updateSchema = questionSchema.partial().extend({
      isActive: z.boolean().optional()
    })
    const validatedData = updateSchema.parse(body)

    const question = await prisma.question.update({
      where: { id: params.id },
      data: validatedData
    })
    return NextResponse.json(question)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Questions PUT error:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

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
