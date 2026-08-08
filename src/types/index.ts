export type RoleName =
  | 'super_admin'
  | 'hr_admin'
  | 'manager'
  | 'employee'
  | 'finance'

export type PermissionName =
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'departments.manage'
  | 'designations.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'leave.view'
  | 'leave.manage'
  | 'payroll.view'
  | 'payroll.manage'
  | 'reports.view'
  | 'users.manage'
  | 'settings.manage'
  | 'notifications.view'

export type EmploymentStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'terminated'
  | 'probation'

export interface Permission {
  id: string
  name: PermissionName
  description: string
}

export interface Role {
  id: string
  name: RoleName
  label: string
  permissions: PermissionName[]
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  role: RoleName
  departmentId?: string
  designationId?: string
  employmentStatus: EmploymentStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: string
  module?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  href?: string
}

export interface CompanySettings {
  companyName: string
  legalName?: string
  logoUrl?: string
  timezone: string
  dateFormat: string
  currencyCode: string
  currencyLocale: string
  fiscalYearStartMonth: number
  workWeekStart: 0 | 1 | 2 | 3 | 4 | 5 | 6
}
