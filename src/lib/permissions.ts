import type { PermissionName, RoleName, User } from '@/types'
import { getPermissionsForRole } from '@/constants/rbac'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'

export function getUserPermissions(user: User | null | undefined): PermissionName[] {
  if (!user) return []
  return getPermissionsForRole(user.role)
}

export function hasRole(user: User | null | undefined, role: RoleName | RoleName[]): boolean {
  if (!user) return false
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(user.role)
}

function isReportPermission(permission: PermissionName): boolean {
  return permission === PERMISSIONS.REPORTS_VIEW || permission.startsWith('report.')
}

export function hasPermission(
  user: User | null | undefined,
  permission: PermissionName | PermissionName[],
): boolean {
  if (!user) return false
  const permissions = getUserPermissions(user)
  const required = Array.isArray(permission) ? permission : [permission]
  if (permissions.includes(PERMISSIONS.REPORT_ADMIN) && required.some(isReportPermission)) {
    return true
  }
  return required.some((item) => permissions.includes(item))
}

export function hasAnyPermission(
  user: User | null | undefined,
  permissions: PermissionName[],
): boolean {
  return hasPermission(user, permissions)
}

export function hasAllPermissions(
  user: User | null | undefined,
  permissions: PermissionName[],
): boolean {
  if (!user) return false
  const userPermissions = getUserPermissions(user)
  return permissions.every((permission) => userPermissions.includes(permission))
}

export function isEmployee(user: User | null | undefined): boolean {
  return hasRole(user, ROLES.EMPLOYEE)
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  return hasRole(user, ROLES.SUPER_ADMIN)
}
