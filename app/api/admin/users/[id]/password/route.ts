import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth-middleware'
import { changePasswordSchema, resetPasswordSchema } from '@/lib/validations-admin'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()

    const targetAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
    })

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (user.id === params.id) {
      const validatedData = changePasswordSchema.parse(body)
      const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, targetAdmin.password)

      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12)

      await prisma.admin.update({
        where: { id: params.id },
        data: { password: hashedPassword },
      })

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'ADMIN_PASSWORD_CHANGE',
          details: { adminId: params.id, self: true },
          severity: 'INFO',
        },
      })

      return NextResponse.json({ success: true })
    } else {
      const validatedData = resetPasswordSchema.parse(body)

      if (validatedData.email !== targetAdmin.email) {
        return NextResponse.json({ error: 'Email does not match' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12)

      await prisma.admin.update({
        where: { id: params.id },
        data: { password: hashedPassword },
      })

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'ADMIN_PASSWORD_RESET',
          details: { adminId: params.id, email: targetAdmin.email },
          severity: 'WARNING',
        },
      })

      return NextResponse.json({ success: true })
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Admin password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}