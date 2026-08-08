import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? props.name

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-surface-900',
            'placeholder:text-surface-400',
            'border-surface-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-surface-500">{hint}</p>
        ) : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
