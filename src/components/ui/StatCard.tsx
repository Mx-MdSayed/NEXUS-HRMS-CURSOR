import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardContent } from './Card'
import { Skeleton } from './Skeleton'

export type TrendDirection = 'up' | 'down' | 'neutral'

export interface StatCardProps {
  title: string
  value: string
  description?: string
  hint?: string
  icon?: LucideIcon
  trend?: string
  trendDirection?: TrendDirection
  isLoading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  hint,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  isLoading = false,
  className,
}: StatCardProps) {
  const supporting = description ?? hint

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
            {value}
          </p>
          {trend || supporting ? (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
              {trend ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-medium',
                    trendDirection === 'up' && 'text-success-600 dark:text-success-500',
                    trendDirection === 'down' && 'text-danger-600 dark:text-danger-500',
                    trendDirection === 'neutral' && 'text-primary-600 dark:text-primary-400',
                  )}
                >
                  {trendDirection === 'up' ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : null}
                  {trendDirection === 'down' ? (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  ) : null}
                  {trend}
                </span>
              ) : null}
              {trend && supporting ? <span aria-hidden>·</span> : null}
              {supporting ? <span>{supporting}</span> : null}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-primary-50 p-2.5 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
