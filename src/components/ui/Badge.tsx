import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-600/20 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-600/20 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-600/20 dark:text-danger-500',
  info: 'bg-info-50 text-info-700 dark:bg-info-600/20 dark:text-info-500',
  neutral: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
