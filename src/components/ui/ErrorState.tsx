import { AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center',
        'dark:border-red-900/50 dark:bg-red-950/30',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-red-600 dark:text-red-400" aria-hidden />
      <h3 className="font-display text-base font-semibold text-red-800 dark:text-red-200">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-red-700/80 dark:text-red-300/80">{message}</p>
      {onRetry ? (
        <Button variant="danger" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
