import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, Permission } from '@/lib/permissions'

export async function requireAuth(): Promise<{ user: any } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { user: session.user }
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