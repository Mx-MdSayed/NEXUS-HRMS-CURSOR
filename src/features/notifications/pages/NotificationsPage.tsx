import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, Settings } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { NotificationList } from '../components/NotificationList'
import { announcementService } from '../services/announcementService'
import { notificationService } from '../services/notificationService'
import { notificationTriggerService } from '../services/notificationTriggerService'
import { getNotificationErrorMessage } from '../utils/errors'
import type { Announcement, Notification, NotificationCategory } from '../types'

async function getRecipientIds(user: ReturnType<typeof useAuth>['user']): Promise<string[]> {
  const ids = new Set<string>()
  if (user?.id) ids.add(user.id)
  if (user?.employeeId) ids.add(user.employeeId)
  if (user) {
    const linked = await notificationTriggerService.resolveLinkedEmployeeId(user)
    if (linked) ids.add(linked)
  }
  return Array.from(ids)
}

export function NotificationsPage() {
  const { user, hasPermission } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [category, setCategory] = useState<NotificationCategory | ''>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const ids = await getRecipientIds(user)
      const [page, activeAnnouncements] = await Promise.all([
        notificationService.getNotifications(ids, { category, search }, 1, 100),
        announcementService.getActiveForUser(user),
      ])
      setNotifications(page.data)
      setAnnouncements(activeAnnouncements)
    } catch (error) {
      showError(getNotificationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [category, search, user])

  useEffect(() => {
    void load()
  }, [load])

  const markRead = async (id: string) => {
    try {
      await notificationService.markAsRead(await getRecipientIds(user), id)
      await load()
    } catch (error) {
      showError(getNotificationErrorMessage(error))
    }
  }

  const archive = async (id: string) => {
    try {
      await notificationService.archiveNotification(await getRecipientIds(user), id)
      await load()
    } catch (error) {
      showError(getNotificationErrorMessage(error))
    }
  }

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead(await getRecipientIds(user))
      showSuccess('All notifications marked as read.')
      await load()
    } catch (error) {
      showError(getNotificationErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">Notifications</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Centralized HRMS notifications and announcements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAll}>Mark all read</Button>
          <Link to="/notifications/settings">
            <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>Settings</Button>
          </Link>
          {hasPermission('notification.template.manage') ? (
            <Link to="/notifications/templates"><Button>Templates</Button></Link>
          ) : null}
        </div>
      </div>

      {announcements.map((announcement) => (
        <Card key={announcement.id} className="border-primary-200 bg-primary-50/60 dark:border-primary-900 dark:bg-primary-950/30">
          <CardHeader><CardTitle>{announcement.title}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-surface-700 dark:text-surface-200">{announcement.message}</p></CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input placeholder="Search notifications" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value as NotificationCategory | '')}
            options={[
              { label: 'All categories', value: '' },
              { label: 'Leave', value: 'leave' },
              { label: 'Attendance', value: 'attendance' },
              { label: 'Profile', value: 'profile' },
              { label: 'Payroll', value: 'payroll' },
              { label: 'Payslip', value: 'payslip' },
              { label: 'Workflow', value: 'workflow' },
              { label: 'System', value: 'system' },
            ]}
          />
        </CardContent>
      </Card>

      {loading ? <Card><CardContent>Loading notifications...</CardContent></Card> : (
        <NotificationList notifications={notifications} onMarkRead={markRead} onArchive={archive} />
      )}
    </div>
  )
}
