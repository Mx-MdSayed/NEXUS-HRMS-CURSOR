import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { formatRelativeDate } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { NotificationPreviewItem } from '../types'

export function NotificationPreview({ items }: { items: NotificationPreviewItem[] }) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center justify-between gap-3">
          <CardTitle>Notifications</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="No notifications" description="New alerts will appear here." />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  item.isRead
                    ? 'border-surface-200 dark:border-surface-800'
                    : 'border-primary-200 bg-primary-50/40 dark:border-primary-800 dark:bg-primary-950/20',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{item.title}</p>
                    <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{item.message}</p>
                  </div>
                  {!item.isRead ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-surface-500">{formatRelativeDate(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
