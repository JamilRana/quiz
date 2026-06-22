import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireInstructorOrAdmin } from '@/lib/auth-middleware'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().optional(), slug: z.string().optional(), duration: z.number().int().positive().optional(),
  isActive: z.boolean().optional(), examMode: z.boolean().optional(), ipLockEnabled: z.boolean().optional(),
  deviceLockEnabled: z.boolean().optional(), leaderboardVisible: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireInstructorOrAdmin()
    if (authResult instanceof NextResponse) return authResult
    const body = await request.json()
    const data = updateSchema.parse(body)
    const batch = await prisma.batch.update({ where: { id: params.id }, data })
    return NextResponse.json(batch)
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
