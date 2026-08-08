import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { notificationEventBus } from '../eventBus'
import { initialNotifications } from '../data/mockNotifications'
import type { Notification, NotificationFilters, PaginatedNotifications } from '../types'
import { NotificationServiceError } from './errors'

let notificationsDb: Notification[] = structuredClone(initialNotifications)

type CreateNotificationInput = Omit<
  Notification,
  'id' | 'isRead' | 'isArchived' | 'createdAt' | 'updatedAt'
> & {
  id?: string
  isRead?: boolean
  isArchived?: boolean
  createdAt?: string
}

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function ids(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

function isVisibleForDropdown(notification: Notification): boolean {
  return !notification.expiresAt || notification.expiresAt >= new Date().toISOString()
}

function applyFilters(rows: Notification[], filters: NotificationFilters): Notification[] {
  let filtered = rows
  if (!filters.includeArchived) filtered = filtered.filter((item) => !item.isArchived)
  if (filters.dropdownOnly) filtered = filtered.filter(isVisibleForDropdown)
  if (filters.category) filtered = filtered.filter((item) => item.category === filters.category)
  if (filters.priority) filtered = filtered.filter((item) => item.priority === filters.priority)
  if (filters.eventCode) filtered = filtered.filter((item) => item.eventCode === filters.eventCode)
  if (filters.referenceType) {
    filtered = filtered.filter((item) => item.referenceType === filters.referenceType)
  }
  if (filters.referenceId) filtered = filtered.filter((item) => item.referenceId === filters.referenceId)
  if (typeof filters.isRead === 'boolean') {
    filtered = filtered.filter((item) => item.isRead === filters.isRead)
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    filtered = filtered.filter((item) =>
      `${item.title} ${item.message} ${item.eventCode}`.toLowerCase().includes(q),
    )
  }
  return filtered
}

function findAccessibleNotification(recipientIds: string[], id: string): Notification {
  const notification = notificationsDb.find(
    (item) => item.id === id && recipientIds.includes(item.recipientId),
  )
  if (!notification) throw new NotificationServiceError('NOT_FOUND', 'Notification not found.')
  return notification
}

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<Notification> {
    await delay()
    if (!input.recipientId) {
      throw new NotificationServiceError('VALIDATION', 'Recipient is required.')
    }
    if (!input.title.trim() || !input.message.trim()) {
      throw new NotificationServiceError('VALIDATION', 'Notification title and message are required.')
    }

    const duplicate = notificationsDb.find(
      (item) =>
        item.referenceType === input.referenceType &&
        item.referenceId === input.referenceId &&
        item.recipientId === input.recipientId &&
        item.eventCode === input.eventCode,
    )
    if (duplicate) return structuredClone(duplicate)

    const now = input.createdAt ?? new Date().toISOString()
    const notification: Notification = {
      ...input,
      id: input.id ?? `notif-${crypto.randomUUID().slice(0, 8)}`,
      isRead: input.isRead ?? false,
      isArchived: input.isArchived ?? false,
      createdAt: now,
      updatedAt: now,
    }
    notificationsDb.unshift(notification)
    notificationEventBus.emit({ type: 'created', notification: structuredClone(notification) })
    return structuredClone(notification)
  },

  async createBulk(items: CreateNotificationInput[]): Promise<Notification[]> {
    const created: Notification[] = []
    for (const item of items) {
      created.push(await this.create(item))
    }
    return created
  },

  async getNotifications(
    recipientId: string | string[],
    filters: NotificationFilters = {},
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedNotifications> {
    await delay()
    const recipientIds = ids(recipientId)
    const filtered = applyFilters(
      notificationsDb.filter((item) => recipientIds.includes(item.recipientId)),
      filters,
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * pageSize
    return {
      data: structuredClone(filtered.slice(start, start + pageSize)),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  async getUnreadCount(recipientId: string | string[]): Promise<number> {
    await delay(40)
    const recipientIds = ids(recipientId)
    return notificationsDb.filter(
      (item) => recipientIds.includes(item.recipientId) && !item.isRead && !item.isArchived && isVisibleForDropdown(item),
    ).length
  },

  async getById(recipientId: string | string[], id: string): Promise<Notification> {
    await delay()
    return structuredClone(findAccessibleNotification(ids(recipientId), id))
  },

  async markAsRead(recipientId: string | string[], id: string): Promise<Notification> {
    await delay()
    const recipientIds = ids(recipientId)
    const notification = findAccessibleNotification(recipientIds, id)
    notification.isRead = true
    notification.readAt = notification.readAt ?? new Date().toISOString()
    notification.updatedAt = new Date().toISOString()
    notificationEventBus.emit({ type: 'updated', notification: structuredClone(notification) })
    return structuredClone(notification)
  },

  async markAllAsRead(recipientId: string | string[]): Promise<Notification[]> {
    await delay()
    const recipientIds = ids(recipientId)
    const now = new Date().toISOString()
    notificationsDb = notificationsDb.map((item) =>
      recipientIds.includes(item.recipientId)
        ? { ...item, isRead: true, readAt: item.readAt ?? now, updatedAt: now }
        : item,
    )
    notificationEventBus.emit({ type: 'bulk-updated', recipientIds })
    return (await this.getNotifications(recipientIds, {}, 1, 500)).data
  },

  async archiveNotification(recipientId: string | string[], id: string): Promise<Notification> {
    await delay()
    const notification = findAccessibleNotification(ids(recipientId), id)
    notification.isArchived = true
    notification.archivedAt = new Date().toISOString()
    notification.updatedAt = notification.archivedAt
    notificationEventBus.emit({ type: 'updated', notification: structuredClone(notification) })
    return structuredClone(notification)
  },

  async getAllForReference(referenceType: string, referenceId: string): Promise<Notification[]> {
    await delay(40)
    return structuredClone(
      notificationsDb.filter(
        (item) => item.referenceType === referenceType && item.referenceId === referenceId,
      ),
    )
  },
}
