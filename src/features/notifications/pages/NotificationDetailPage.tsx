import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/utils/date'
import { showError } from '@/utils/toast'
import { NotificationIcon } from '../components/NotificationIcon'
import { PriorityBadge } from '../components/PriorityBadge'
import { notificationService } from '../services/notificationService'
import { notificationTriggerService } from '../services/notificationTriggerService'
import { getNotificationErrorMessage } from '../utils/errors'
import type { Notification } from '../types'

async function recipients(user: ReturnType<typeof useAuth>['user']) {
  const ids = new Set<string>()
  if (user?.id) ids.add(user.id)
  if (user?.employeeId) ids.add(user.employeeId)
  if (user) ids.add(await notificationTriggerService.resolveLinkedEmployeeId(user))
  return Array.from(ids).filter(Boolean)
}

export function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !user) return
    void recipients(user)
      .then((ids) => notificationService.getById(ids, id))
      .then((row) => {
        setNotification(row)
        if (!row.isRead) return notificationService.markAsRead([row.recipientId], row.id)
        return row
      })
      .catch((err) => {
        const message = getNotificationErrorMessage(err, 'Notification not found.')
        setError(message)
        showError(message)
      })
  }, [id, user])

  if (error) return <Card><CardContent>{error}</CardContent></Card>
  if (!notification) return <Card><CardContent>Loading notification...</CardContent></Card>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-surface-100 p-2 text-surface-600 dark:bg-surface-800">
              <NotificationIcon category={notification.category} />
            </span>
            <div>
              <CardTitle>{notification.title}</CardTitle>
              <p className="mt-1 text-sm text-surface-500">{formatDateTime(notification.createdAt)}</p>
            </div>
          </div>
          <PriorityBadge priority={notification.priority} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-surface-700 dark:text-surface-200">{notification.message}</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-medium">Category:</span> {notification.category}</p>
            <p><span className="font-medium">Event:</span> {notification.eventCode}</p>
            <p><span className="font-medium">Reference:</span> {notification.referenceType ?? '—'} {notification.referenceId ?? ''}</p>
            <p><span className="font-medium">Read:</span> {notification.isRead ? 'Yes' : 'No'}</p>
          </div>
          {notification.href ? (
            <Link to={notification.href}><Button>Open reference</Button></Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
