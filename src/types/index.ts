export type RoleName = 'super_admin' | 'hr_admin' | 'employee'

export type PermissionName =
  | 'dashboard.view'
  | 'profile.view'
  | 'profile.edit'
  | 'employee.view'
  | 'employee.create'
  | 'employee.edit'
  | 'employee.delete'
  | 'employee.manage'
  | 'department.view'
  | 'department.create'
  | 'department.edit'
  | 'department.delete'
  | 'department.manage'
  | 'designation.view'
  | 'designation.create'
  | 'designation.edit'
  | 'designation.delete'
  | 'designation.manage'
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  | 'attendance.manage'
  | 'attendance.correct'
  | 'attendance.approve'
  | 'leave.view'
  | 'leave.create'
  | 'leave.approve'
  | 'leave.reject'
  | 'leave.manage'
  | 'payroll.view'
  | 'payroll.manage'
  | 'payroll.approve'
  | 'payslip.view'
  | 'payslip.manage'
  | 'reports.view'
  | 'notification.view'
  | 'notification.manage'
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'settings.view'
  | 'settings.manage'

export type EmploymentStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'terminated'
  | 'probation'

export type UserStatus = 'active' | 'inactive' | 'invited' | 'locked'

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

/** Authenticated application user — never includes passwords or secrets. */
export interface User {
  id: string
  employeeId?: string
  firstName: string
  lastName: string
  name: string
  email: string
  role: RoleName
  avatarUrl?: string
  status: UserStatus
  employmentStatus: EmploymentStatus
  isActive: boolean
  lastLoginAt?: string
  departmentId?: string
  designationId?: string
  createdAt: string
  updatedAt: string
}

export interface NavigationItem {
  id: string
  label: string
  /** Label used for employee self-service navigation when provided. */
  selfServiceLabel?: string
  path: string
  icon: string
  module?: string
  requiredPermission?: PermissionName | PermissionName[]
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

export interface AuthSession {
  user: User
  accessToken: string
  expiresAt: string
  rememberMe: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResult {
  session: AuthSession
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'UNEXPECTED'
