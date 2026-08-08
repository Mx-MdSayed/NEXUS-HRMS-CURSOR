import { PERMISSIONS } from '@/constants/permissions'
import type { PermissionName } from '@/types'

/**
 * Central route → permission map for Module 17 security audit.
 * UI navigation and PermissionRoute should stay aligned with this map.
 */
export const ROUTE_PERMISSION_MAP: Array<{
  path: string
  permission: PermissionName | PermissionName[]
  notes?: string
}> = [
  { path: '/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: '/employees', permission: PERMISSIONS.EMPLOYEE_VIEW },
  { path: '/employees/new', permission: PERMISSIONS.EMPLOYEE_CREATE },
  { path: '/employees/:id', permission: PERMISSIONS.EMPLOYEE_VIEW },
  { path: '/employees/:id/edit', permission: PERMISSIONS.EMPLOYEE_EDIT },
  { path: '/departments', permission: PERMISSIONS.DEPARTMENT_VIEW },
  { path: '/designations', permission: PERMISSIONS.DESIGNATION_VIEW },
  { path: '/attendance', permission: PERMISSIONS.ATTENDANCE_VIEW },
  { path: '/leave', permission: PERMISSIONS.LEAVE_VIEW },
  { path: '/salary', permission: PERMISSIONS.SALARY_VIEW },
  { path: '/payroll', permission: PERMISSIONS.PAYROLL_VIEW },
  { path: '/payroll/new', permission: [PERMISSIONS.PAYROLL_CREATE, PERMISSIONS.PAYROLL_MANAGE] },
  { path: '/payslips', permission: PERMISSIONS.PAYSLIP_VIEW },
  { path: '/reports', permission: PERMISSIONS.REPORTS_VIEW },
  { path: '/notifications', permission: PERMISSIONS.NOTIFICATION_VIEW },
  { path: '/workflows', permission: PERMISSIONS.WORKFLOW_VIEW },
  { path: '/users', permission: PERMISSIONS.USER_VIEW },
  { path: '/roles', permission: PERMISSIONS.ROLE_VIEW },
  { path: '/permissions', permission: PERMISSIONS.PERMISSION_VIEW },
  { path: '/security', permission: PERMISSIONS.SECURITY_VIEW },
  { path: '/settings', permission: PERMISSIONS.SETTINGS_VIEW },
  { path: '/settings/payroll', permission: [PERMISSIONS.PAYROLL_SETTINGS_MANAGE_GLOBAL, PERMISSIONS.SETTINGS_VIEW] },
  { path: '/employee/*', permission: PERMISSIONS.ESS_VIEW, notes: 'Employee self-service portal' },
]

export const SENSITIVE_ACTION_PERMISSIONS = {
  createEmployee: PERMISSIONS.EMPLOYEE_CREATE,
  editEmployee: PERMISSIONS.EMPLOYEE_EDIT,
  deleteEmployee: PERMISSIONS.EMPLOYEE_DELETE,
  approveLeave: PERMISSIONS.LEAVE_APPROVE,
  rejectLeave: PERMISSIONS.LEAVE_REJECT,
  approveAttendance: PERMISSIONS.ATTENDANCE_APPROVE,
  finalizePayroll: PERMISSIONS.PAYROLL_FINALIZE,
  manageUsers: PERMISSIONS.USER_MANAGE,
  manageRoles: PERMISSIONS.ROLE_MANAGE,
  managePermissions: PERMISSIONS.PERMISSION_MANAGE,
  manageSettings: PERMISSIONS.SETTINGS_MANAGE,
} as const
