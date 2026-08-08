import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Form({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLFormElement>) {
  return (
    <form className={cn('space-y-6', className)} {...props}>
      {children}
    </form>
  )
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-surface-200 bg-white p-5 shadow-card dark:border-surface-800 dark:bg-surface-900',
        className,
      )}
    >
      <div className="mb-4 border-b border-surface-100 pb-3 dark:border-surface-800">
        <h3 className="text-card-title">{title}</h3>
        {description ? <p className="mt-1 text-helper">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function FormGrid({
  columns = 1,
  children,
  className,
}: {
  columns?: 1 | 2
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'md:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
