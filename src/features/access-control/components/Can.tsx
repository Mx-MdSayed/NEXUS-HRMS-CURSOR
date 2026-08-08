import type { ReactNode } from 'react'
import type { PermissionName } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface CanProps {
  permission?: PermissionName | PermissionName[]
  any?: PermissionName[]
  all?: PermissionName[]
  fallback?: ReactNode
  children: ReactNode
}

/** Component-level permission guard. Unauthorized actions should not render. */
export function Can({ permission, any, all, fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  let allowed = true
  if (permission) allowed = allowed && hasPermission(permission)
  if (any) allowed = allowed && hasAnyPermission(any)
  if (all) allowed = allowed && hasAllPermissions(all)

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
