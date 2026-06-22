import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'
import { z } from 'zod'

const createBatchSchema = z.object({ quizId: z.string(), title: z.string(), slug: z.string(), duration: z.number().int().positive().default(30) })

export async function POST(request: Request) {
  try {
    const authResult = await requireInstructorOrAdmin()
    if (authResult instanceof NextResponse) return authResult
    const body = await request.json()
    const data = createBatchSchema.parse(body)
    
    const existing = await prisma.batch.findUnique({ where: { slug: data.slug } })
    if (existing) return NextResponse.json({ error: 'Slug exists' }, { status: 400 })

    const batch = await prisma.batch.create({ data })
    return NextResponse.json(batch, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
