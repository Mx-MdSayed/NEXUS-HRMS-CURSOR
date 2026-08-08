import type { EmploymentStatus, PermissionName, RoleName } from '@/types'

export const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'Super Admin',
  hr_admin: 'HR Admin',
  manager: 'Manager',
  employee: 'Employee',
  finance: 'Finance',
}

export const ROLES: RoleName[] = [
  'super_admin',
  'hr_admin',
  'manager',
  'employee',
  'finance',
]

export const PERMISSIONS: PermissionName[] = [
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.delete',
  'departments.manage',
  'designations.manage',
  'attendance.view',
  'attendance.manage',
  'leave.view',
  'leave.manage',
  'payroll.view',
  'payroll.manage',
  'reports.view',
  'users.manage',
  'settings.manage',
  'notifications.view',
]

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated',
  probation: 'Probation',
}

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'probation',
]
