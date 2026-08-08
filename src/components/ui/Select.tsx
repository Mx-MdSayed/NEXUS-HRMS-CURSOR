import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from './Field'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  requiredMark?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      id,
      required,
      requiredMark,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? props.name
    const showRequired = requiredMark ?? required
    const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined

    return (
      <div className="w-full">
        {label ? (
          <FieldLabel htmlFor={selectId} required={showRequired}>
            {label}
          </FieldLabel>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={cn('field-control', error && 'field-control-error', className)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldMessage id={describedBy} error={error} hint={hint} />
      </div>
    )
  },
)

Select.displayName = 'Select'
