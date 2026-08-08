export type RoleName = 'super_admin' | 'hr_admin' | 'hr_manager' | 'manager' | 'employee'

export type PermissionName =
  | 'dashboard.view'
  | 'profile.view'
  | 'profile.edit'
  | 'employee.view'
  | 'employee.create'
  | 'employee.edit'
  | 'employee.delete'
  | 'employee.manage'
  | 'employee.export'
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
  | 'attendance.export'
  | 'leave.view'
  | 'leave.create'
  | 'leave.apply'
  | 'leave.edit'
  | 'leave.cancel'
  | 'leave.approve'
  | 'leave.reject'
  | 'leave.manage'
  | 'leave.type.manage'
  | 'leave.balance.manage'
  | 'leave.export'
  | 'salary.view'
  | 'salary.create'
  | 'salary.edit'
  | 'salary.delete'
  | 'salary.manage'
  | 'salary.assign'
  | 'salary.revise'
  | 'salary.component.manage'
  | 'salary.export'
  | 'payroll.view'
  | 'payroll.create'
  | 'payroll.edit'
  | 'payroll.calculate'
  | 'payroll.process'
  | 'payroll.approve'
  | 'payroll.reject'
  | 'payroll.delete'
  | 'payroll.manage'
  | 'payroll.settings.manage'
  | 'payroll.employee.view'
  | 'payroll.finalize'
  | 'payroll.export'
  | 'payslip.view'
  | 'payslip.generate'
  | 'payslip.print'
  | 'payslip.download'
  | 'payslip.manage'
  | 'reports.view'
  | 'report.view'
  | 'report.employee'
  | 'report.attendance'
  | 'report.leave'
  | 'report.salary'
  | 'report.payroll'
  | 'report.payslip'
  | 'report.department'
  | 'report.workforce'
  | 'report.export'
  | 'report.admin'
  | 'notification.view'
  | 'notification.manage'
  | 'notification.template.manage'
  | 'notification.settings.manage'
  | 'workflow.view'
  | 'workflow.create'
  | 'workflow.approve'
  | 'workflow.reject'
  | 'workflow.manage'
  | 'workflow.admin'
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.manage'
  | 'user.export'
  | 'role.view'
  | 'role.create'
  | 'role.edit'
  | 'role.delete'
  | 'role.manage'
  | 'permission.view'
  | 'permission.manage'
  | 'security.view'
  | 'security.manage'
  | 'settings.view'
  | 'settings.manage'
  | 'company.manage'
  | 'organization.manage'
  | 'location.manage'
  | 'schedule.manage'
  | 'holiday.manage'
  | 'leave-policy.manage'
  | 'attendance-settings.manage'
  | 'payroll-settings.manage'
  | 'payslip-settings.manage'
  | 'localization.manage'
  | 'branding.manage'
  | 'notification-settings.manage'
  | 'workflow-settings.manage'
  | 'ess.view'

export type EmploymentStatus =
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'terminated'
  | 'probation'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'invited' | 'locked'

export type PermissionScope = 'all' | 'department' | 'team' | 'own' | 'assigned'

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
  employeeRecordId?: string
  firstName: string
  lastName: string
  name: string
  email: string
  username?: string
  role: RoleName
  roleIds?: string[]
  avatarUrl?: string
  profilePhoto?: string
  status: UserStatus
  employmentStatus: EmploymentStatus
  isActive: boolean
  mustChangePassword?: boolean
  suspendedReason?: string
  lastLoginAt?: string
  departmentId?: string
  designationId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  deletedBy?: string
}

export interface NavigationItem {
  id: string
  label: string
  /** Label used for employee self-service navigation when provided. */
  selfServiceLabel?: string
  /** Route used when the item is rendered in the employee self-service portal. */
  selfServicePath?: string
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
  companyId: string
  companyName: string
  legalName?: string
  registrationNumber?: string
  taxId?: string
  email?: string
  hrEmail?: string
  supportEmail?: string
  phone?: string
  website?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  logoUrl?: string
  timezone: string
  dateFormat: string
  currencyCode: string
  currencyLocale: string
  fiscalYearStartMonth: number
  workWeekStart: 0 | 1 | 2 | 3 | 4 | 5 | 6
  status: 'active' | 'inactive'
  employeeIdPrefix: string
  employeeIdNextNumber: number
  payslipPrefix: string
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
