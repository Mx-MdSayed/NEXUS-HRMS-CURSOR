import { useMemo } from 'react'
import type { PermissionName } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import type { AccessActor } from '../types'

export function useAccessActor(): AccessActor {
  const { user, hasPermission } = useAuth()
  return useMemo(
    () => ({
      id: user?.id ?? 'anonymous',
      name: user?.name ?? 'Unknown',
      role: user?.role ?? 'employee',
      permissions: [],
      hasPermission: (permission: PermissionName | PermissionName[]) => hasPermission(permission),
    }),
    [hasPermission, user?.id, user?.name, user?.role],
  )
}
