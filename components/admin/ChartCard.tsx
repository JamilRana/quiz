import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, icon: Icon, children, className }: ChartCardProps) {
  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-800', className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
