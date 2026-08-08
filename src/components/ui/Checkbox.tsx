import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { FieldMessage } from './Field'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id ?? props.name

    return (
      <div className="w-full">
        <label
          htmlFor={checkboxId}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg p-1',
            props.disabled && 'cursor-not-allowed opacity-60',
            className,
          )}
        >
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-950"
            aria-invalid={Boolean(error)}
            {...props}
          />
          <span>
            <span className="block text-sm font-medium text-surface-800 dark:text-surface-100">
              {label}
            </span>
            {description ? (
              <span className="mt-0.5 block text-helper">{description}</span>
            ) : null}
          </span>
        </label>
        <FieldMessage error={error} />
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
