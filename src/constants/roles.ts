import type { RoleName } from '@/types'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  EMPLOYEE: 'employee',
} as const satisfies Record<string, RoleName>

export const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'Super Admin',
  hr_admin: 'HR Admin',
  employee: 'Employee',
}

export const ROLE_LIST: RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.EMPLOYEE,
]
