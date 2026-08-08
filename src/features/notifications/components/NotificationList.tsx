import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, EmptyState } from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import type { Notification } from '../types'
import { NotificationIcon } from './NotificationIcon'
import { PriorityBadge } from './PriorityBadge'

export function NotificationList({
  notifications,
  onMarkRead,
  onArchive,
}: {
  notifications: Notification[]
  onMarkRead?: (id: string) => void
  onArchive?: (id: string) => void
}) {
  if (notifications.length === 0) {
    return <EmptyState title="No notifications" description="You are all caught up." />
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card key={notification.id} className={!notification.isRead ? 'border-primary-300' : undefined}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="mt-1 rounded-lg bg-surface-100 p-2 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                <NotificationIcon category={notification.category} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-surface-900 dark:text-surface-50">{notification.title}</p>
                  {!notification.isRead ? <Badge>Unread</Badge> : null}
                  <PriorityBadge priority={notification.priority} />
                </div>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{notification.message}</p>
                <p className="mt-2 text-xs text-surface-400">{formatDateTime(notification.createdAt)}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {notification.href ? (
                <Link to={notification.href}>
                  <Button variant="ghost" size="sm">Open</Button>
                </Link>
              ) : null}
              {!notification.isRead ? (
                <Button variant="outline" size="sm" onClick={() => onMarkRead?.(notification.id)}>
                  Mark read
                </Button>
              ) : null}
              {onArchive ? (
                <Button variant="ghost" size="sm" onClick={() => onArchive(notification.id)}>
                  Archive
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
