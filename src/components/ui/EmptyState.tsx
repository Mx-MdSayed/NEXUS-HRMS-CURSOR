import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50 px-6 py-12 text-center',
        'dark:border-surface-700 dark:bg-surface-900/50',
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-surface-100 p-3 text-surface-500 dark:bg-surface-800 dark:text-surface-300">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold text-surface-900 dark:text-surface-50">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-surface-500 dark:text-surface-400">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
