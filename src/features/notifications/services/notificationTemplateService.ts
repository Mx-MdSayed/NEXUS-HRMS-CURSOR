import { initialNotificationTemplates } from '../data/mockTemplates'
import type { NotificationTemplate } from '../types'
import { renderTemplate as render } from '../utils/templateRenderer'
import { NotificationServiceError } from './errors'

let templatesDb: NotificationTemplate[] = structuredClone(initialNotificationTemplates)

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getByCodeOrThrow(code: string): NotificationTemplate {
  const template = templatesDb.find((item) => item.code === code)
  if (!template) throw new NotificationServiceError('NOT_FOUND', 'Notification template not found.')
  return template
}

export const notificationTemplateService = {
  async list(): Promise<NotificationTemplate[]> {
    await delay()
    return structuredClone(templatesDb.sort((a, b) => a.name.localeCompare(b.name)))
  },

  async getById(id: string): Promise<NotificationTemplate> {
    await delay()
    const template = templatesDb.find((item) => item.id === id)
    if (!template) throw new NotificationServiceError('NOT_FOUND', 'Notification template not found.')
    return structuredClone(template)
  },

  async getByCode(code: string): Promise<NotificationTemplate> {
    await delay()
    return structuredClone(getByCodeOrThrow(code))
  },

  async create(
    data: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationTemplate> {
    await delay()
    if (templatesDb.some((item) => item.code === data.code)) {
      throw new NotificationServiceError('CONFLICT', 'Template code must be unique.')
    }
    const now = new Date().toISOString()
    const template: NotificationTemplate = {
      ...data,
      id: `nt-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    }
    templatesDb.unshift(template)
    return structuredClone(template)
  },

  async update(
    id: string,
    data: Partial<Omit<NotificationTemplate, 'id' | 'createdAt'>>,
  ): Promise<NotificationTemplate> {
    await delay()
    const index = templatesDb.findIndex((item) => item.id === id)
    if (index < 0) throw new NotificationServiceError('NOT_FOUND', 'Notification template not found.')
    if (data.code && templatesDb.some((item) => item.id !== id && item.code === data.code)) {
      throw new NotificationServiceError('CONFLICT', 'Template code must be unique.')
    }
    templatesDb[index] = {
      ...templatesDb[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return structuredClone(templatesDb[index])
  },

  async delete(id: string): Promise<void> {
    await delay()
    const template = templatesDb.find((item) => item.id === id)
    if (!template) throw new NotificationServiceError('NOT_FOUND', 'Notification template not found.')
    templatesDb = templatesDb.filter((item) => item.id !== id)
  },

  async renderTemplate(
    code: string,
    vars: Record<string, unknown> = {},
  ): Promise<{ template: NotificationTemplate; title: string; message: string }> {
    await delay(40)
    const template = getByCodeOrThrow(code)
    return {
      template: structuredClone(template),
      title: render(template.titleTemplate, vars),
      message: render(template.messageTemplate, vars),
    }
  },

  async preview(
    template: Pick<NotificationTemplate, 'titleTemplate' | 'messageTemplate'>,
    vars: Record<string, unknown> = {},
  ): Promise<{ title: string; message: string }> {
    await delay(40)
    return {
      title: render(template.titleTemplate, vars),
      message: render(template.messageTemplate, vars),
    }
  },
}
