import type { RoleName } from '@/types'
import { ROLES } from '@/constants/roles'
import { initialAnnouncements } from '../data/mockAnnouncements'
import type { Announcement } from '../types'
import { NotificationServiceError } from './errors'

let announcementsDb: Announcement[] = structuredClone(initialAnnouncements)

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function audienceMatches(audience: Announcement['audience'], role?: RoleName): boolean {
  if (audience === 'all') return true
  if (audience === 'employees') return role === ROLES.EMPLOYEE
  if (audience === 'hr') return role === ROLES.HR_ADMIN
  if (audience === 'admins') return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN
  return false
}

export const announcementService = {
  async list(): Promise<Announcement[]> {
    await delay()
    return structuredClone(announcementsDb.sort((a, b) => b.startsAt.localeCompare(a.startsAt)))
  },

  async getById(id: string): Promise<Announcement> {
    await delay()
    const row = announcementsDb.find((item) => item.id === id)
    if (!row) throw new NotificationServiceError('NOT_FOUND', 'Announcement not found.')
    return structuredClone(row)
  },

  async create(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
    await delay()
    const now = new Date().toISOString()
    const announcement: Announcement = {
      ...data,
      id: `ann-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    }
    announcementsDb.unshift(announcement)
    return structuredClone(announcement)
  },

  async update(id: string, data: Partial<Omit<Announcement, 'id' | 'createdAt'>>): Promise<Announcement> {
    await delay()
    const index = announcementsDb.findIndex((item) => item.id === id)
    if (index < 0) throw new NotificationServiceError('NOT_FOUND', 'Announcement not found.')
    announcementsDb[index] = {
      ...announcementsDb[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return structuredClone(announcementsDb[index])
  },

  async delete(id: string): Promise<void> {
    await delay()
    const existing = announcementsDb.find((item) => item.id === id)
    if (!existing) throw new NotificationServiceError('NOT_FOUND', 'Announcement not found.')
    announcementsDb = announcementsDb.filter((item) => item.id !== id)
  },

  async getActiveForUser(user?: { role?: RoleName }): Promise<Announcement[]> {
    await delay()
    const now = new Date().toISOString()
    return structuredClone(
      announcementsDb
        .filter((item) => item.isActive)
        .filter((item) => item.startsAt <= now && (!item.endsAt || item.endsAt >= now))
        .filter((item) => audienceMatches(item.audience, user?.role))
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    )
  },
}
