import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { EmptyState } from './EmptyState'
import { LoadingSpinner } from './LoadingSpinner'
import { Skeleton } from './Skeleton'

export interface DataTableProps {
  children: ReactNode
  className?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  loadingRows?: number
  columnCount?: number
}

export function DataTable({
  children,
  className,
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or add a new record.',
  emptyActionLabel,
  onEmptyAction,
  loadingRows = 5,
  columnCount = 4,
}: DataTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={loadingRows} columns={columnCount} className={className} />
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card',
        'dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  )
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'border-b border-surface-200 bg-surface-50 text-xs font-semibold uppercase tracking-wide text-surface-500',
        'dark:border-surface-800 dark:bg-surface-950/60 dark:text-surface-400',
        className,
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-surface-100 dark:divide-surface-800', className)} {...props} />
}

export function TableRow({
  className,
  selected = false,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/60',
        selected && 'bg-primary-50 hover:bg-primary-50 dark:bg-primary-950/40 dark:hover:bg-primary-950/40',
        className,
      )}
      data-selected={selected || undefined}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-semibold', className)} {...props} />
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-surface-700 dark:text-surface-200', className)}
      {...props}
    />
  )
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
      aria-busy
      aria-label="Loading table"
    >
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableLoader({ label = 'Loading records' }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3" role="status">
      <LoadingSpinner label={label} />
      <p className="text-sm text-surface-500 dark:text-surface-400">{label}…</p>
    </div>
  )
}
