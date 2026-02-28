import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const filter = searchParams.get('filter')
    const limit = 20

    const where: any = {}
    if (filter) where.action = filter

    const [logs, total, stats] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ['action'], _count: { action: true } }),
    ])

    const statsMap = stats.reduce((acc: any, s: any) => { acc[s.action] = s._count.action; return acc }, {})

    return NextResponse.json({
      logs,
      total,
      stats: {
        failedStarts: statsMap['FAILED_START'] || 0,
        duplicateDevices: statsMap['DUPLICATE_DEVICE'] ||0,
        duplicateIps: statsMap['DUPLICATE_IP'] ||0,
        tabSwitches: statsMap['TAB_SWITCH'] ||0,
      },
    })
  } catch (error) {
    console.error('Security logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
