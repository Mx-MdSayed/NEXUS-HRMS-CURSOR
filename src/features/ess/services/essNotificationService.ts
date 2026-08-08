import { initialEssNotifications } from '../data/mockEssNotifications'
import type { EssNotification } from '../types'
import { EssServiceError } from './errors'

let notificationsDb: EssNotification[] = structuredClone(initialEssNotifications)

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export const essNotificationService = {
  async getNotifications(employeeId: string): Promise<EssNotification[]> {
    await delay()
    return structuredClone(
      notificationsDb
        .filter((item) => item.employeeId === employeeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },

  async markAsRead(employeeId: string, id: string): Promise<EssNotification> {
    await delay()
    const index = notificationsDb.findIndex((item) => item.id === id && item.employeeId === employeeId)
    if (index < 0) throw new EssServiceError('NOT_FOUND', 'Notification not found.')
    notificationsDb[index] = { ...notificationsDb[index], isRead: true }
    return structuredClone(notificationsDb[index])
  },

  async markAllAsRead(employeeId: string): Promise<EssNotification[]> {
    await delay()
    notificationsDb = notificationsDb.map((item) =>
      item.employeeId === employeeId ? { ...item, isRead: true } : item,
    )
    return this.getNotifications(employeeId)
  },
}
