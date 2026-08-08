export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationCategory =
  | 'leave'
  | 'attendance'
  | 'profile'
  | 'payroll'
  | 'payslip'
  | 'workflow'
  | 'announcement'
  | 'system'

export interface Notification {
  id: string
  recipientId: string
  actorId?: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  eventCode: string
  referenceType?: string
  referenceId?: string
  href?: string
  isRead: boolean
  readAt?: string
  isArchived: boolean
  archivedAt?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export interface NotificationTemplate {
  id: string
  code: string
  name: string
  description?: string
  category: NotificationCategory
  priority: NotificationPriority
  titleTemplate: string
  messageTemplate: string
  mandatory: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface NotificationPreference {
  id: string
  userId: string
  eventCode: string
  enabled: boolean
  mandatory: boolean
  updatedAt: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  audience: 'all' | 'employees' | 'hr' | 'admins'
  startsAt: string
  endsAt?: string
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface NotificationFilters {
  category?: NotificationCategory | ''
  priority?: NotificationPriority | ''
  eventCode?: string
  referenceType?: string
  referenceId?: string
  isRead?: boolean | ''
  includeArchived?: boolean
  dropdownOnly?: boolean
  search?: string
}

export interface PaginatedNotifications {
  data: Notification[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
