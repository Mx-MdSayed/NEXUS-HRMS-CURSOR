import type { RoleName } from '@/types'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  HR_MANAGER: 'hr_manager',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const satisfies Record<string, RoleName>

export const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'Super Admin',
  hr_admin: 'HR Admin',
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
}

export const ROLE_LIST: RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.MANAGER,
  ROLES.EMPLOYEE,
]

export const SYSTEM_ROLE_IDS: Record<RoleName, string> = {
  super_admin: 'role_super_admin',
  hr_admin: 'role_hr_admin',
  hr_manager: 'role_hr_manager',
  manager: 'role_manager',
  employee: 'role_employee',
}
