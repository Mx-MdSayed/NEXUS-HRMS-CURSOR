import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
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
