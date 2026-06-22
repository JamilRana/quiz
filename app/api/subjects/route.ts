import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'

export async function GET() {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            quizzes: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(subjects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const authResult = await requireInstructorOrAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const { name, description } = await req.json()
    const subject = await prisma.subject.create({
      data: { name, description }
    })
    return NextResponse.json(subject)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}
