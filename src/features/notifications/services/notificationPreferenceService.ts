import { initialNotificationPreferences, mandatoryNotificationEvents } from '../data/mockPreferences'
import { initialNotificationTemplates } from '../data/mockTemplates'
import type { NotificationPreference } from '../types'

let preferencesDb: NotificationPreference[] = structuredClone(initialNotificationPreferences)

function delay(ms = 60): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function defaultPreference(userId: string, eventCode: string): NotificationPreference {
  const mandatory = mandatoryNotificationEvents.has(eventCode)
  return {
    id: `pref-${userId}-${eventCode.toLowerCase()}`,
    userId,
    eventCode,
    enabled: true,
    mandatory,
    updatedAt: new Date().toISOString(),
  }
}

export const notificationPreferenceService = {
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    await delay()
    const codes = initialNotificationTemplates.map((item) => item.code)
    const rows = codes.map((code) => {
      const existing = preferencesDb.find((item) => item.userId === userId && item.eventCode === code)
      return existing ? { ...existing, mandatory: mandatoryNotificationEvents.has(code) } : defaultPreference(userId, code)
    })
    return structuredClone(rows)
  },

  async updatePreference(
    userId: string,
    eventCode: string,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    await delay()
    const mandatory = mandatoryNotificationEvents.has(eventCode)
    const index = preferencesDb.findIndex(
      (item) => item.userId === userId && item.eventCode === eventCode,
    )
    const next: NotificationPreference = {
      ...(index >= 0 ? preferencesDb[index] : defaultPreference(userId, eventCode)),
      enabled: mandatory ? true : enabled,
      mandatory,
      updatedAt: new Date().toISOString(),
    }
    if (index >= 0) preferencesDb[index] = next
    else preferencesDb.push(next)
    return structuredClone(next)
  },

  async isEnabled(userId: string, eventCode: string): Promise<boolean> {
    await delay(20)
    if (mandatoryNotificationEvents.has(eventCode)) return true
    const preference = preferencesDb.find(
      (item) => item.userId === userId && item.eventCode === eventCode,
    )
    return preference?.enabled ?? true
  },
}
