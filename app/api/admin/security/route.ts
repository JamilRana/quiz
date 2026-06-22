import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin()
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const filter = searchParams.get('filter')
    const severity = searchParams.get('severity')
    const limit = 20

    const where: any = {}
    if (filter) where.action = filter
    if (severity) where.severity = severity

    const [logs, total, stats, severityStats] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          batch: { select: { title: true, slug: true } },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ['action'], _count: { action: true } }),
      prisma.auditLog.groupBy({ by: ['severity'], _count: { severity: true } }),
    ])

    const statsMap = stats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.action] = s._count.action
      return acc
    }, {})

    const severityMap = severityStats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.severity] = s._count.severity
      return acc
    }, {})

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        failedStarts: statsMap['FAILED_START'] || 0,
        duplicateDevices: statsMap['DUPLICATE_DEVICE'] || 0,
        duplicateIps: statsMap['DUPLICATE_IP'] || 0,
        tabSwitches: statsMap['TAB_SWITCH'] || 0,
        flagged: statsMap['FLAG_DUPLICATE'] || 0,
        submissions: statsMap['SUBMIT'] || 0,
        flaggedSubmissions: statsMap['SUBMIT_FLAGGED'] || 0,
        timeouts: statsMap['SUBMIT_TIMEOUT'] || 0,
        adminActions: statsMap['ADMIN_CREATE'] || statsMap['ADMIN_UPDATE'] || statsMap['ADMIN_DELETE'] || 0,
      },
      severityBreakdown: {
        info: severityMap['INFO'] || 0,
        warning: severityMap['WARNING'] || 0,
        error: severityMap['ERROR'] || 0,
        critical: severityMap['CRITICAL'] || 0,
      },
    })
  } catch (error) {
    console.error('Security logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
