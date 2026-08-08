import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/utils/date'
import { notificationEventBus } from '../eventBus'
import { notificationService } from '../services/notificationService'
import { notificationTriggerService } from '../services/notificationTriggerService'
import type { Notification } from '../types'
import { NotificationIcon } from './NotificationIcon'

export function NotificationBell() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const recipientIds = useMemo(() => {
    const values = new Set<string>()
    if (user?.id) values.add(user.id)
    if (user?.employeeId) values.add(user.employeeId)
    return Array.from(values)
  }, [user])

  const resolveRecipients = useCallback(async () => {
    const values = new Set(recipientIds)
    if (user) {
      const linked = await notificationTriggerService.resolveLinkedEmployeeId(user)
      if (linked) values.add(linked)
    }
    return Array.from(values)
  }, [recipientIds, user])

  const load = useCallback(async () => {
    if (!user) return
    const ids = await resolveRecipients()
    const [count, page] = await Promise.all([
      notificationService.getUnreadCount(ids),
      notificationService.getNotifications(ids, { dropdownOnly: true }, 1, 8),
    ])
    setUnreadCount(count)
    setItems(page.data)
  }, [resolveRecipients, user])

  useEffect(() => {
    void load()
    return notificationEventBus.on(() => {
      void load()
    })
  }, [load])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const markAll = async () => {
    const ids = await resolveRecipients()
    await notificationService.markAllAsRead(ids)
    await load()
  }

  const viewAllPath = isEmployeeUser ? '/employee/notifications' : '/notifications'

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative !px-2"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 rounded-full bg-danger-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-elevated dark:border-surface-700 dark:bg-surface-900">
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800">
            <div>
              <p className="font-medium text-surface-900 dark:text-surface-50">Notifications</p>
              <p className="text-xs text-surface-500">{unreadCount} unread</p>
            </div>
            <Button variant="ghost" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAll}>
              Mark all
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-surface-500">No notifications yet.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full gap-3 border-b border-surface-100 px-4 py-3 text-left transition hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"
                  onClick={() => {
                    setOpen(false)
                    if (!item.isRead) {
                      void resolveRecipients().then((ids) => notificationService.markAsRead(ids, item.id)).then(load)
                    }
                    navigate(item.href ?? `/notifications/${item.id}`)
                  }}
                >
                  <span className="mt-1 text-surface-500">
                    <NotificationIcon category={item.category} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                      {item.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-surface-500">{item.message}</span>
                    <span className="mt-1 block text-[11px] text-surface-400">{formatDateTime(item.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-3">
            <Link to={viewAllPath} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">View all notifications</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
