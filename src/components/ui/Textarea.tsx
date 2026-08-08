import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from './Field'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  requiredMark?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, hint, id, rows = 4, required, requiredMark, ...props },
    ref,
  ) => {
    const textareaId = id ?? props.name
    const showRequired = requiredMark ?? required
    const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined

    return (
      <div className="w-full">
        {label ? (
          <FieldLabel htmlFor={textareaId} required={showRequired}>
            {label}
          </FieldLabel>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          className={cn(
            'w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900',
            'placeholder:text-surface-400',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'field-control-error',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        <FieldMessage id={describedBy} error={error} hint={hint} />
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
