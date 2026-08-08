import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'link'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  iconOnly?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm disabled:bg-primary-400',
  secondary:
    'bg-surface-100 text-surface-800 hover:bg-surface-200 active:bg-surface-300 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700 dark:active:bg-surface-600',
  ghost:
    'bg-transparent text-surface-700 hover:bg-surface-100 active:bg-surface-200 dark:text-surface-200 dark:hover:bg-surface-800 dark:active:bg-surface-700',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 shadow-sm disabled:bg-danger-400',
  success:
    'bg-success-600 text-white hover:bg-success-700 active:bg-success-700 shadow-sm disabled:bg-success-500/70',
  outline:
    'border border-surface-300 bg-transparent text-surface-800 hover:bg-surface-50 active:bg-surface-100 dark:border-surface-600 dark:text-surface-100 dark:hover:bg-surface-800 dark:active:bg-surface-700',
  link: 'bg-transparent px-0 text-primary-700 underline-offset-4 hover:underline dark:text-primary-400',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
}

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 px-0',
  md: 'h-10 w-10 px-0',
  lg: 'h-11 w-11 px-0',
}

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
      aria-hidden
    />
  )
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  leftIcon,
  rightIcon,
  iconOnly = false,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const busy = isLoading || loading

  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
        variant === 'link' && !iconOnly && 'h-auto',
        className,
      )}
      {...props}
    >
      {busy ? (
        <ButtonSpinner />
      ) : iconOnly ? (
        (leftIcon ?? rightIcon ?? children)
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  )
}
