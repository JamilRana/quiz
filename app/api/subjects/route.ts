import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
