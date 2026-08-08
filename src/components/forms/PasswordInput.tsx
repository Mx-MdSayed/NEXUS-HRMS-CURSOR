import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import { FieldLabel, FieldMessage } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
  requiredMark?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, required, requiredMark, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
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
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            required={required}
            className={cn('field-control pr-10', error ? 'field-control-error' : undefined, className)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-surface-400"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <FieldMessage id={describedBy} error={error} hint={hint} />
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
