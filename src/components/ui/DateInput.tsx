import { forwardRef, type InputHTMLAttributes } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from './Field'

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  requiredMark?: boolean
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, hint, id, required, requiredMark, ...props }, ref) => {
    const inputId = id ?? props.name
    const showRequired = requiredMark ?? required
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

    return (
      <div className="w-full">
        {label ? (
          <FieldLabel htmlFor={inputId} required={showRequired}>
            {label}
          </FieldLabel>
        ) : null}
        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-surface-400"
            aria-hidden
          />
          <input
            ref={ref}
            id={inputId}
            type="date"
            required={required}
            className={cn('field-control pl-10', error && 'field-control-error', className)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        <FieldMessage id={describedBy} error={error} hint={hint} />
      </div>
    )
  },
)

DateInput.displayName = 'DateInput'
