import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'bg-white dark:bg-slate-800',
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
}

const iconVariants = {
  default: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6 shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            variant === 'default' && 'bg-blue-100 dark:bg-blue-900',
            variant === 'success' && 'bg-green-100 dark:bg-green-900',
            variant === 'warning' && 'bg-amber-100 dark:bg-amber-900',
            variant === 'danger' && 'bg-red-100 dark:bg-red-900'
          )}
        >
          <Icon className={cn('h-6 w-6', iconVariants[variant])} />
        </div>
      </div>
    </div>
  )
}
