import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        quiz: {
          include: {
            _count: { select: { questions: true } }
          }
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (!batch.isActive) {
      return NextResponse.json({ error: 'Batch is inactive' }, { status: 403 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Public Batch API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
