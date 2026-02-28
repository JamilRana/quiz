import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startExamSchema } from '@/lib/validations'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = startExamSchema.parse(body)

    const batch = await prisma.batch.findUnique({
      where: { id: validatedData.batchId },
    })

    if (!batch || !batch.isActive) {
      return NextResponse.json({ error: 'Batch not found or inactive' }, { status: 404 })
    }

    const now = new Date()
    if (batch.startTime && now < batch.startTime) {
      return NextResponse.json({ error: 'Exam has not started yet' }, { status: 400 })
    }
    if (batch.endTime && now > batch.endTime) {
      return NextResponse.json({ error: 'Exam has ended' }, { status: 400 })
    }

    const headersList = headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    if (batch.strictIpMode) {
      const existingResponse = await prisma.response.findFirst({
        where: { batchId: batch.id, ipAddress },
      })
      if (existingResponse) {
        return NextResponse.json({ error: 'IP address already used' }, { status: 400 })
      }
    }

    if (batch.strictDeviceMode && body.deviceHash) {
      const existingResponse = await prisma.response.findFirst({
        where: { batchId: batch.id, deviceHash: body.deviceHash },
      })
      if (existingResponse) {
        return NextResponse.json({ error: 'Device already used' }, { status: 400 })
      }
    }

    const existingEmail = await prisma.response.findUnique({
      where: { batchId_email: { batchId: batch.id, email: validatedData.email } },
    })

    if (existingEmail) {
      if (existingEmail.isComplete) {
        return NextResponse.json({ error: 'Quiz already submitted' }, { status: 400 })
      }
      if (batch.strictIpMode || batch.strictDeviceMode) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
    }

    let response = existingEmail

    if (!response) {
      response = await prisma.response.create({
        data: {
          batchId: batch.id,
          email: validatedData.email,
          name: validatedData.name,
          ipAddress,
          deviceHash: body.deviceHash,
        },
      })
    }

    if (batch.ipLockEnabled || batch.deviceLockEnabled) {
      const lockChecks = []

      if (batch.ipLockEnabled) {
        lockChecks.push(
          prisma.response.count({
            where: { batchId: batch.id, ipAddress, id: { not: response.id } },
          })
        )
      }

      if (batch.deviceLockEnabled && body.deviceHash) {
        lockChecks.push(
          prisma.response.count({
            where: { batchId: batch.id, deviceHash: body.deviceHash, id: { not: response.id } },
          })
        )
      }

      const counts = await Promise.all(lockChecks)
      const isFlagged = counts.some((count) => count > 0)

      if (isFlagged) {
        await prisma.response.update({
          where: { id: response.id },
          data: { isFlagged: true, flagReason: 'Multiple attempts from same IP or device' },
        })
      }
    }

    return NextResponse.json({ responseId: response.id }, { status: 200 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Start exam error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
