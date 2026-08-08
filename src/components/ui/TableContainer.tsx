import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TableContainerProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  actions?: ReactNode
}

export function TableContainer({
  children,
  className,
  title,
  description,
  actions,
}: TableContainerProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card',
        'dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-100 px-5 py-4 dark:border-surface-800">
          <div>
            {title ? (
              <h3 className="font-display text-base font-semibold text-surface-900 dark:text-surface-50">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
