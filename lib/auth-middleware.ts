import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function requireAuth(): Promise<{ user: any } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dbAdmin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true, email: true, isActive: true }
    })

    if (!dbAdmin || !dbAdmin.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return { user: dbAdmin }
  } catch (error) {
    console.error('requireAuth database lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function requirePermission(
  permission: Permission
): Promise<{ user: any } | NextResponse> {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user }
}

export async function requireRole(
  allowedRoles: string[]
): Promise<{ user: any } | NextResponse> {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  if (!user.role || !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Role not authorized' },
      { status: 403 }
    )
  }

  return { user }
}

export async function requireAdmin(): Promise<{ user: any } | NextResponse> {
  return requireRole(['ADMIN'])
}

export async function requireInstructorOrAdmin(): Promise<{ user: any } | NextResponse> {
  return requireRole(['ADMIN', 'INSTRUCTOR'])
}