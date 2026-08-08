import type { ReactNode } from 'react'
import { Filter, RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { SearchInput } from './SearchInput'

export interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  onReset?: () => void
  onApply?: () => void
  showApply?: boolean
  className?: string
  actions?: ReactNode
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  onReset,
  onApply,
  showApply = false,
  className,
  actions,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-surface-200 bg-white p-4 shadow-card',
        'dark:border-surface-800 dark:bg-surface-900',
        'lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
        {onSearchChange ? (
          <SearchInput
            value={searchValue}
            onValueChange={onSearchChange}
            placeholder={searchPlaceholder}
            containerClassName="max-w-none lg:max-w-xs"
            aria-label="Search"
          />
        ) : null}
        {filters ? (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:flex lg:w-auto lg:items-end">
            {filters}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {onReset ? (
          <Button variant="outline" size="sm" onClick={onReset} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Reset
          </Button>
        ) : null}
        {showApply && onApply ? (
          <Button size="sm" onClick={onApply} leftIcon={<Filter className="h-4 w-4" />}>
            Apply
          </Button>
        ) : null}
      </div>
    </div>
  )
}
