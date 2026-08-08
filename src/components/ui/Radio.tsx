import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from './Field'

interface RadioGroupContextValue {
  name: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export interface RadioGroupProps {
  label?: string
  name: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  error?: string
  requiredMark?: boolean
  children: ReactNode
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroup({
  label,
  name,
  value,
  onValueChange,
  disabled,
  error,
  requiredMark,
  children,
  className,
  orientation = 'vertical',
}: RadioGroupProps) {
  const labelId = useId()

  return (
    <fieldset className={cn('w-full', className)} aria-labelledby={label ? labelId : undefined}>
      {label ? (
        <legend id={labelId} className="mb-2">
          <FieldLabel required={requiredMark}>{label}</FieldLabel>
        </legend>
      ) : null}
      <RadioGroupContext.Provider
        value={{
          name,
          value,
          onChange: onValueChange,
          disabled,
        }}
      >
        <div
          className={cn(
            'flex gap-3',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          )}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
      <FieldMessage error={error} />
    </fieldset>
  )
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, value, onChange, disabled, name, checked, ...props }, ref) => {
    const group = useContext(RadioGroupContext)
    const radioId = id ?? `${group?.name ?? name ?? 'radio'}-${String(value)}`
    const isChecked = group?.value !== undefined ? group.value === value : checked

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'flex cursor-pointer items-start gap-3',
          (disabled || group?.disabled) && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={group?.name ?? name}
          value={value}
          checked={isChecked}
          disabled={disabled || group?.disabled}
          className="mt-0.5 h-4 w-4 border-surface-300 text-primary-600 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-950"
          onChange={(event) => {
            onChange?.(event)
            if (event.target.checked && typeof value === 'string') {
              group?.onChange?.(value)
            }
          }}
          {...props}
        />
        <span>
          <span className="block text-sm font-medium text-surface-800 dark:text-surface-100">
            {label}
          </span>
          {description ? <span className="mt-0.5 block text-helper">{description}</span> : null}
        </span>
      </label>
    )
  },
)

Radio.displayName = 'Radio'
