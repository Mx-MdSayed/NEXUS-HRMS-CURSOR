import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

export function SearchInput({
  value,
  defaultValue = '',
  onValueChange,
  onClear,
  placeholder = 'Search…',
  className,
  containerClassName,
  id,
  disabled,
  ...props
}: SearchInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = isControlled ? value : internalValue

  useEffect(() => {
    if (!isControlled) return
    setInternalValue(value)
  }, [isControlled, value])

  const updateValue = (next: string) => {
    if (!isControlled) setInternalValue(next)
    onValueChange?.(next)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateValue(event.target.value)
  }

  const handleClear = () => {
    updateValue('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative w-full max-w-md', containerClassName)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-surface-400"
        aria-hidden
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={currentValue}
        disabled={disabled}
        placeholder={placeholder}
        className={cn('field-control pl-10 pr-10', className)}
        onChange={handleChange}
        {...props}
      />
      {currentValue ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          disabled={disabled}
          className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-surface-400 hover:text-surface-700"
          aria-label="Clear search"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
