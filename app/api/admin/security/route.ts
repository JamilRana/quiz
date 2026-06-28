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
        select: {
          id: true,
          batchId: true,
          responseId: true,
          action: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          severity: true,
          createdAt: true,
          adminId: true,
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ['action'], _count: { action: true } }),
      prisma.auditLog.groupBy({ by: ['severity'], _count: { severity: true } }),
    ])

    // Fetch batch titles for logs that have batchId
    const batchIds = logs.filter(l => l.batchId).map(l => l.batchId!) as string[]
    const batches = batchIds.length > 0
      ? await prisma.batch.findMany({ where: { id: { in: batchIds } }, select: { id: true, title: true, slug: true } })
      : []
    const batchMap = new Map(batches.map(b => [b.id, { title: b.title, slug: b.slug }]))

    const logsWithBatch = logs.map(l => ({
      ...l,
      batch: l.batchId ? batchMap.get(l.batchId) || null : null,
    }))

    const statsMap = stats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.action] = s._count.action
      return acc
    }, {})

    const severityMap = severityStats.reduce((acc: Record<string, number>, s: any) => {
      acc[s.severity] = s._count.severity
      return acc
    }, {})

    return NextResponse.json({
      logs: logsWithBatch,
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
