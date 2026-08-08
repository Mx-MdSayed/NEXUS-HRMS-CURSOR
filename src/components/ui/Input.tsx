import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from './Field'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  requiredMark?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      id,
      required,
      requiredMark,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
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
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-surface-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'field-control',
              leftIcon ? 'pl-10' : undefined,
              rightIcon ? 'pr-10' : undefined,
              error ? 'field-control-error' : undefined,
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          {rightIcon ? (
            <span className="absolute inset-y-0 right-3 flex items-center text-surface-400">
              {rightIcon}
            </span>
          ) : null}
        </div>
        <FieldMessage
          id={describedBy}
          error={error}
          hint={hint}
        />
      </div>
    )
  },
)

Input.displayName = 'Input'
