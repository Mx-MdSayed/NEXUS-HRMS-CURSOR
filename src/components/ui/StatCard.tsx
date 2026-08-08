import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card, CardContent } from './Card'

export interface StatCardProps {
  title: string
  value: string
  hint?: string
  icon?: LucideIcon
  trend?: string
  className?: string
}

export function StatCard({ title, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
            {value}
          </p>
          {hint || trend ? (
            <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">
              {trend ? <span className="font-medium text-primary-600 dark:text-primary-400">{trend}</span> : null}
              {trend && hint ? ' · ' : null}
              {hint}
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
