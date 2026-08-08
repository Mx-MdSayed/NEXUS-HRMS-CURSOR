import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

export interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, className, onValueChange }: TabsProps) {
  const [value, setValueState] = useState(defaultValue)

  const setValue = useCallback(
    (next: string) => {
      setValueState(next)
      onValueChange?.(next)
    },
    [onValueChange],
  )

  const context = useMemo(() => ({ value, setValue }), [value, setValue])

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex gap-1 rounded-lg border border-surface-200 bg-surface-100 p-1 dark:border-surface-700 dark:bg-surface-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const selected = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-900 dark:text-surface-50'
          : 'text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-100',
        className,
      )}
      onClick={() => context.setValue(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  if (context.value !== value) return null

  return (
    <div role="tabpanel" className={cn('mt-4', className)}>
      {children}
    </div>
  )
}
