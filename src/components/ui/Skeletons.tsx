import { cn } from '@/utils/cn'
import { Skeleton } from './Skeleton'

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-200 bg-white p-5 shadow-card dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  )
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border border-surface-200 bg-white p-5 shadow-card dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
      aria-busy
      aria-label="Loading form"
    >
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { TableSkeleton } from './DataTable'
