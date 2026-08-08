import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export type DrawerSide = 'left' | 'right' | 'bottom'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  side?: DrawerSide
  size?: 'sm' | 'md' | 'lg'
}

const sideClasses: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-md border-r',
  right: 'inset-y-0 right-0 h-full w-full max-w-md border-l',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl border-t',
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title ?? 'Drawer'}>
      <button
        type="button"
        className="absolute inset-0 bg-surface-950/50 transition-opacity duration-150"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute flex flex-col border-surface-200 bg-white shadow-elevated transition-transform duration-200',
          'dark:border-surface-700 dark:bg-surface-900',
          sideClasses[side],
          side !== 'bottom' && sizeClasses[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-surface-100 px-5 py-4 dark:border-surface-800">
            <div>
              {title ? (
                <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" className="!px-2" aria-label="Close" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-surface-100 px-5 py-4 dark:border-surface-800">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
