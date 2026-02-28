'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, Column } from './DataTable'

interface SuspiciousResponse {
  id: string
  email: string
  ipAddress: string | null
  deviceHash: string | null
  totalScore: number
  isFlagged: boolean
  flagReason: string | null
  startedAt: Date
  submittedAt: Date | null
  batch: {
    title: string
  }
}

interface SuspiciousTableProps {
  data: SuspiciousResponse[]
  loading?: boolean
  onReview?: (id: string) => void
  pageSize?: number
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

const columns: Column<SuspiciousResponse>[] = [
  {
    key: 'email',
    header: 'Email',
    cell: (row) => <span className="font-medium">{row.email}</span>,
  },
  {
    key: 'ipAddress',
    header: 'IP Address',
    cell: (row) => (
      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
        {row.ipAddress || 'N/A'}
      </span>
    ),
  },
  {
    key: 'flagReason',
    header: 'Reason',
    cell: (row) => (
      <Badge variant="destructive" className="text-xs">
        {row.flagReason || 'Unknown'}
      </Badge>
    ),
  },
  {
    key: 'score',
    header: 'Score',
    cell: (row) => <span className="font-medium">{row.totalScore}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) =>
      row.submittedAt ? (
        <Badge variant="success">Submitted</Badge>
      ) : (
        <Badge variant="warning">In Progress</Badge>
      ),
  },
]

interface SuspiciousActivityPanelProps {
  data: SuspiciousResponse[]
  loading?: boolean
  onReview?: (id: string) => void
}

export function SuspiciousTable({
  data,
  loading,
  onReview,
  pageSize = 10,
  totalItems,
  currentPage,
  onPageChange,
}: SuspiciousTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="id"
      pageSize={pageSize}
      totalItems={totalItems}
      currentPage={currentPage}
      onPageChange={onPageChange}
      loading={loading}
      emptyMessage="No suspicious activity detected"
    />
  )
}

export function SuspiciousActivityPanel({ data, loading, onReview }: SuspiciousActivityPanelProps) {
  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
          <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-sm text-slate-500">No suspicious activity detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-red-900 dark:text-red-100">{item.email}</p>
              <Badge variant="destructive" className="text-xs">
                {item.flagReason}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-red-700 dark:text-red-300">
              <span>IP: {item.ipAddress || 'N/A'}</span>
              <span>•</span>
              <span>Score: {item.totalScore}</span>
              <span>•</span>
              <span>Batch: {item.batch.title}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReview?.(item.id)}
            className="ml-4 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
          >
            Review
          </Button>
        </div>
      ))}
    </div>
  )
}
