/**
 * DEVELOPMENT-ONLY authentication configuration.
 * Never use these credentials or this adapter in production.
 * Replace mockAuthService with a real backend-backed authService.
 */
import type { RoleName, User } from '@/types'
import { ROLES } from '@/constants/roles'

export interface DevAuthAccount {
  email: string
  /** Development-only plaintext password for the mock adapter. */
  password: string
  role: RoleName
  firstName: string
  lastName: string
  employeeId: string
}

export const DEV_AUTH_ACCOUNTS: DevAuthAccount[] = [
  {
    email: 'admin@example.com',
    password: 'Password123!',
    role: ROLES.SUPER_ADMIN,
    firstName: 'Ava',
    lastName: 'Admin',
    employeeId: 'EMP-1001',
  },
  {
    email: 'hr@example.com',
    password: 'Password123!',
    role: ROLES.HR_ADMIN,
    firstName: 'Harper',
    lastName: 'HR',
    employeeId: 'EMP-1002',
  },
  {
    email: 'employee@example.com',
    password: 'Password123!',
    role: ROLES.EMPLOYEE,
    firstName: 'Eden',
    lastName: 'Employee',
    employeeId: 'EMP-1003',
  },
]

export function toPublicUser(account: DevAuthAccount, now = new Date().toISOString()): User {
  return {
    id: `usr_${account.role}`,
    employeeId: account.employeeId,
    firstName: account.firstName,
    lastName: account.lastName,
    name: `${account.firstName} ${account.lastName}`,
    email: account.email,
    role: account.role,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  }
}
