import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { PermissionName, RoleName } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui'

interface PermissionRouteProps {
  children: ReactNode
  permission?: PermissionName | PermissionName[]
  role?: RoleName | RoleName[]
}

export function PermissionRoute({ children, permission, role }: PermissionRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth()

  if (isLoading) {
    return <PageLoader label="Checking access" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const allowedByPermission = permission ? hasPermission(permission) : true
  const allowedByRole = role ? hasRole(role) : true

  if (!allowedByPermission || !allowedByRole) {
    return <Navigate to="/403" replace />
  }

  return children
}
