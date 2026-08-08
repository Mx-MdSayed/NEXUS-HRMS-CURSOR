import { forwardRef, useId, useState, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { FieldMessage } from './Field'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  error?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      label,
      description,
      error,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const switchId = id ?? generatedId
    const isControlled = checked !== undefined
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked)
    const isOn = isControlled ? checked : uncontrolledChecked

    const toggle = () => {
      const next = !isOn
      if (!isControlled) setUncontrolledChecked(next)
      onCheckedChange?.(next)
    }

    return (
      <div className="w-full">
        <div className={cn('flex items-start gap-3', className)}>
          <button
            ref={ref}
            id={switchId}
            type="button"
            role="switch"
            aria-checked={isOn}
            disabled={disabled}
            className={cn(
              'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isOn ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700',
            )}
            onClick={toggle}
            {...props}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                isOn ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          {(label || description) && (
            <label htmlFor={switchId} className="cursor-pointer">
              {label ? (
                <span className="block text-sm font-medium text-surface-800 dark:text-surface-100">
                  {label}
                </span>
              ) : null}
              {description ? <span className="mt-0.5 block text-helper">{description}</span> : null}
            </label>
          )}
        </div>
        <FieldMessage error={error} />
      </div>
    )
  },
)

Switch.displayName = 'Switch'
