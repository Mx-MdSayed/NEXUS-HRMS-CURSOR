import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-200 dark:bg-surface-800',
        className,
      )}
      aria-hidden
    />
  )
}
