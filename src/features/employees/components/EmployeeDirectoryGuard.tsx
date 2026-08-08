import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/constants/roles'
import { PERMISSIONS } from '@/constants/permissions'
import { PageLoader } from '@/components/ui'

export function EmployeeDirectoryGuard({ children }: { children: ReactNode }) {
  const { isLoading, hasRole, hasPermission, user } = useAuth()

  if (isLoading) return <PageLoader label="Checking access" />

  if (hasRole(ROLES.EMPLOYEE) && !hasPermission(PERMISSIONS.EMPLOYEE_VIEW)) {
    // Prefer the employee's own record when linked by email; otherwise profile.
    return <Navigate to="/profile" replace state={{ fromEmployees: true, email: user?.email }} />
  }

  if (!hasPermission(PERMISSIONS.EMPLOYEE_VIEW)) {
    return <Navigate to="/403" replace />
  }

  return children
}
