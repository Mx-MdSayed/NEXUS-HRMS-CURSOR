import { LoadingSpinner } from './LoadingSpinner'
import { cn } from '@/utils/cn'

export function PageLoader({ label = 'Loading page', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex min-h-[40vh] flex-col items-center justify-center gap-3', className)}>
      <LoadingSpinner size="lg" label={label} />
      <p className="text-sm text-surface-500 dark:text-surface-400">{label}…</p>
    </div>
  )
}
