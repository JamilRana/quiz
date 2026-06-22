import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth-middleware'
import { updateAdminSchema, changePasswordSchema, resetPasswordSchema } from '@/lib/validations-admin'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult

    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Admin user GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const validatedData = updateAdminSchema.parse(body)

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
    })

    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (validatedData.email && validatedData.email !== existingAdmin.email) {
      const emailExists = await prisma.admin.findUnique({
        where: { email: validatedData.email },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: params.id },
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        isActive: validatedData.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'ADMIN_UPDATE',
        details: { adminId: params.id, changes: validatedData },
        severity: 'INFO',
      },
    })

    return NextResponse.json(updatedAdmin)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Admin user PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    if (user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    await prisma.admin.delete({
      where: { id: params.id },
    })

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: 'ADMIN_DELETE',
        details: { adminId: params.id, email: admin.email },
        severity: 'WARNING',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}