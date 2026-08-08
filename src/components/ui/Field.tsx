import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface FieldMessageProps {
  id?: string
  error?: string
  hint?: string
}

export function FieldLabel({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-label', className)}>
      {children}
      {required ? (
        <span className="ml-0.5 text-danger-600 dark:text-danger-500" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  )
}

export function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 text-xs text-danger-600 dark:text-danger-400" role="alert">
        {error}
      </p>
    )
  }

  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-helper">
        {hint}
      </p>
    )
  }

  return null
}
