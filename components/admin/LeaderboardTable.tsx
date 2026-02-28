'use client'

import { DataTable, Column } from './DataTable'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface LeaderboardEntry {
  id: string
  rank: number
  email: string
  name: string | null
  score: number
  submittedAt: Date | null
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  loading?: boolean
  pageSize?: number
  totalItems?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

const columns: Column<LeaderboardEntry>[] = [
  {
    key: 'rank',
    header: 'Rank',
    cell: (row) => (
      <div className="flex items-center justify-center">
        {row.rank <= 3 ? (
          <Badge
            variant={row.rank === 1 ? 'default' : 'secondary'}
            className={cn(
              'h-8 w-8 rounded-full p-0 flex items-center justify-center font-bold',
              row.rank === 1 && 'bg-yellow-500 hover:bg-yellow-600',
              row.rank === 2 && 'bg-slate-400 hover:bg-slate-500',
              row.rank === 3 && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            {row.rank}
          </Badge>
        ) : (
          <span className="font-medium">#{row.rank}</span>
        )}
      </div>
    ),
    className: 'text-center w-20',
  },
  {
    key: 'email',
    header: 'Participant',
    cell: (row) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{row.email}</p>
        {row.name && <p className="text-sm text-slate-500">{row.name}</p>}
      </div>
    ),
  },
  {
    key: 'score',
    header: 'Score',
    cell: (row) => (
      <span className="font-bold text-blue-600 dark:text-blue-400">{row.score}</span>
    ),
    className: 'text-center w-24',
  },
  {
    key: 'submittedAt',
    header: 'Submitted',
    cell: (row) =>
      row.submittedAt ? (
        <span className="text-sm text-slate-500">{format(new Date(row.submittedAt), 'MMM d, HH:mm')}</span>
      ) : (
        <Badge variant="outline">Pending</Badge>
      ),
    className: 'text-right w-32',
  },
]

export function LeaderboardTable({
  data,
  loading,
  pageSize = 10,
  totalItems,
  currentPage,
  onPageChange,
}: LeaderboardTableProps) {
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
      emptyMessage="No submissions yet"
    />
  )
}
