import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  id: string
  label: string
  icon?: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
  menuClassName?: string
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
  menuClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex"
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-full z-40 mt-2 min-w-48 overflow-hidden rounded-xl border border-surface-200 bg-white py-1 shadow-elevated',
            'dark:border-surface-700 dark:bg-surface-900',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-surface-50 dark:hover:bg-surface-800',
                'disabled:cursor-not-allowed disabled:opacity-50',
                item.danger
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-surface-700 dark:text-surface-200',
              )}
              onClick={() => {
                if (item.disabled) return
                item.onClick?.()
                setOpen(false)
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
