import { cn } from '@/utils/cn'
import { DateInput } from './DateInput'
import { FieldLabel, FieldMessage } from './Field'

export interface DateRangeValue {
  from: string
  to: string
}

export interface DateRangeInputProps {
  label?: string
  value?: DateRangeValue
  onValueChange?: (value: DateRangeValue) => void
  fromLabel?: string
  toLabel?: string
  error?: string
  hint?: string
  requiredMark?: boolean
  disabled?: boolean
  className?: string
}

export function DateRangeInput({
  label,
  value = { from: '', to: '' },
  onValueChange,
  fromLabel = 'From',
  toLabel = 'To',
  error,
  hint,
  requiredMark,
  disabled,
  className,
}: DateRangeInputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label ? <FieldLabel required={requiredMark}>{label}</FieldLabel> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <DateInput
          label={fromLabel}
          value={value.from}
          disabled={disabled}
          max={value.to || undefined}
          onChange={(event) =>
            onValueChange?.({
              from: event.target.value,
              to: value.to,
            })
          }
        />
        <DateInput
          label={toLabel}
          value={value.to}
          disabled={disabled}
          min={value.from || undefined}
          onChange={(event) =>
            onValueChange?.({
              from: value.from,
              to: event.target.value,
            })
          }
        />
      </div>
      <FieldMessage error={error} hint={hint} />
    </div>
  )
}
