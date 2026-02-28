import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { responseId, batchId, action, details, ipAddress } = body

    const log = await prisma.auditLog.create({
      data: {
        responseId,
        batchId,
        action,
        details,
        ipAddress,
      },
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
