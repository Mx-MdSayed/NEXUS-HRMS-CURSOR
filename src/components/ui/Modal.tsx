import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  /** When false, clicking the backdrop does not close the modal. */
  closeOnBackdrop?: boolean
  /** When false, Escape does not close the modal. */
  closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose, closeOnEscape])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-surface-950/50 transition-opacity duration-150 motion-reduce:transition-none"
        aria-label="Close dialog"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-xl border border-surface-200 bg-white shadow-elevated',
          'animate-in fade-in zoom-in-95 sm:rounded-xl',
          'dark:border-surface-700 dark:bg-surface-900',
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-100 px-5 py-4 dark:border-surface-800">
          <div>
            <h2
              id="modal-title"
              className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
            ) : null}
          </div>
          {showCloseButton ? (
            <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose} className="!px-2">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-surface-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-surface-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
