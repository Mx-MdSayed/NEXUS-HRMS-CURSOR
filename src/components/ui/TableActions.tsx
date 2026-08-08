import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { Dropdown, type DropdownItem } from './Dropdown'
import { Tooltip } from './Tooltip'

export interface TableActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  moreItems?: DropdownItem[]
  className?: string
  compact?: boolean
}

export function TableActions({
  onView,
  onEdit,
  onDelete,
  moreItems = [],
  className,
  compact = false,
}: TableActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-1', className)}>
      {onView ? (
        <Tooltip content="View">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="View"
            onClick={onView}
            className={compact ? 'h-8 w-8' : undefined}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Tooltip>
      ) : null}
      {onEdit ? (
        <Tooltip content="Edit">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Edit"
            onClick={onEdit}
            className={compact ? 'h-8 w-8' : undefined}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </Tooltip>
      ) : null}
      {onDelete ? (
        <Tooltip content="Delete">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete"
            onClick={onDelete}
            className={cn('text-danger-600 hover:text-danger-700 dark:text-danger-400', compact && 'h-8 w-8')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      ) : null}
      {moreItems.length > 0 ? (
        <Dropdown
          align="right"
          trigger={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </span>
          }
          items={moreItems}
        />
      ) : null}
    </div>
  )
}
