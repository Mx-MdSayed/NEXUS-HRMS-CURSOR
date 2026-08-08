import { getPermissionsForRole, ROLE_PERMISSIONS, setRolePermissionOverride } from '@/constants/rbac'
import { PERMISSION_DEPENDENCIES } from '@/constants/permissions'
import { ROLE_LABELS, ROLES, SYSTEM_ROLE_IDS } from '@/constants/roles'
import type { PermissionName, PermissionScope, RoleName, User } from '@/types'
import type { AccessActor, RoleDefinition, RoleFormInput } from '../types'
import { AccessControlError } from './errors'
import { auditService } from './auditService'

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nowIso(): string {
  return new Date().toISOString()
}

function systemRoleDefinition(role: RoleName, description: string): RoleDefinition {
  const stamp = '2025-01-01T00:00:00.000Z'
  return {
    id: SYSTEM_ROLE_IDS[role],
    code: role,
    name: ROLE_LABELS[role],
    description,
    systemRole: role,
    isSystem: true,
    status: 'active',
    permissions: [...ROLE_PERMISSIONS[role]],
    scopes: defaultScopesForRole(role),
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function defaultScopesForRole(role: RoleName): Partial<Record<PermissionName, PermissionScope>> {
  if (role === ROLES.EMPLOYEE) {
    return {
      'attendance.view': 'own',
      'leave.view': 'own',
      'salary.view': 'own',
      'payslip.view': 'own',
      'employee.view': 'own',
    }
  }
  if (role === ROLES.MANAGER) {
    return {
      'attendance.view': 'team',
      'leave.view': 'team',
      'employee.view': 'team',
      'workflow.view': 'team',
    }
  }
  if (role === ROLES.HR_MANAGER) {
    return {
      'attendance.view': 'department',
      'leave.view': 'department',
      'employee.view': 'department',
      'report.view': 'department',
    }
  }
  return {
    'attendance.view': 'all',
    'leave.view': 'all',
    'employee.view': 'all',
    'salary.view': 'all',
    'payroll.view': 'all',
  }
}

let roles: RoleDefinition[] = [
  systemRoleDefinition(ROLES.SUPER_ADMIN, 'Full system access including security and settings.'),
  systemRoleDefinition(ROLES.HR_ADMIN, 'Operational HR access including salary and payroll.'),
  systemRoleDefinition(ROLES.HR_MANAGER, 'HR management and approvals without user/role administration.'),
  systemRoleDefinition(ROLES.MANAGER, 'Team-level attendance, leave, and employee visibility.'),
  systemRoleDefinition(ROLES.EMPLOYEE, 'Employee self-service access only.'),
  {
    id: 'role_custom_hr_ops',
    code: 'custom_hr_ops',
    name: 'HR Operations',
    description: 'Custom role for HR operations without payroll finalize.',
    isSystem: false,
    status: 'active',
    permissions: [
      ...ROLE_PERMISSIONS[ROLES.HR_MANAGER],
      'salary.view',
      'payslip.view',
      'payslip.generate',
    ],
    scopes: defaultScopesForRole(ROLES.HR_MANAGER),
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
  },
]

let customSeq = 1

function requireActorPermission(actor: AccessActor, permission: PermissionName | PermissionName[]): void {
  if (!actor.hasPermission(permission)) {
    throw new AccessControlError('UNAUTHORIZED', 'You do not have permission for this action.')
  }
}

export function applyPermissionDependencies(permissions: PermissionName[]): PermissionName[] {
  const set = new Set(permissions)
  let changed = true
  while (changed) {
    changed = false
    for (const permission of [...set]) {
      const deps = PERMISSION_DEPENDENCIES[permission] ?? []
      for (const dep of deps) {
        if (!set.has(dep)) {
          set.add(dep)
          changed = true
        }
      }
    }
  }
  return Array.from(set)
}

export function describeRoleCapabilities(permissions: PermissionName[]): string[] {
  const checks: Array<[PermissionName, string]> = [
    ['employee.view', 'View employees'],
    ['employee.create', 'Create employees'],
    ['leave.manage', 'Manage leave'],
    ['leave.approve', 'Approve leave'],
    ['attendance.approve', 'Approve attendance corrections'],
    ['salary.view', 'View salary'],
    ['salary.manage', 'Manage salary'],
    ['payroll.view', 'View payroll'],
    ['payroll.finalize', 'Finalize payroll'],
    ['report.view', 'View reports'],
    ['user.manage', 'Manage users'],
    ['role.manage', 'Manage roles'],
  ]
  return checks.filter(([code]) => permissions.includes(code)).map(([, label]) => label)
}

export const roleService = {
  async listRoles(filters: { search?: string; status?: string; systemOnly?: boolean } = {}): Promise<RoleDefinition[]> {
    await delay()
    return roles
      .filter((role) => !role.deletedAt)
      .filter((role) => {
        if (filters.status && role.status !== filters.status) return false
        if (filters.systemOnly === true && !role.isSystem) return false
        if (filters.systemOnly === false && role.isSystem) return false
        if (filters.search) {
          const q = filters.search.toLowerCase()
          return (
            role.name.toLowerCase().includes(q) ||
            role.description.toLowerCase().includes(q) ||
            role.code.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async getRole(id: string): Promise<RoleDefinition | null> {
    await delay()
    return roles.find((role) => role.id === id && !role.deletedAt) ?? null
  },

  getRoleSync(id: string): RoleDefinition | null {
    return roles.find((role) => role.id === id && !role.deletedAt) ?? null
  },

  getRoleBySystemRole(role: RoleName): RoleDefinition | null {
    return roles.find((item) => item.systemRole === role && !item.deletedAt) ?? null
  },

  getPermissionsForRoleId(roleId: string): PermissionName[] {
    const role = this.getRoleSync(roleId)
    if (!role) return []
    if (role.systemRole) return getPermissionsForRole(role.systemRole)
    return [...role.permissions]
  },

  async createRole(input: RoleFormInput, actor: AccessActor): Promise<RoleDefinition> {
    requireActorPermission(actor, ['role.create', 'role.manage'])
    await delay()
    const permissions = applyPermissionDependencies(input.permissions)
    const role: RoleDefinition = {
      id: `role_custom_${customSeq++}`,
      code: `custom_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`.slice(0, 40),
      name: input.name.trim(),
      description: input.description.trim(),
      isSystem: false,
      status: input.status,
      permissions,
      scopes: input.scopes ?? {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    roles = [...roles, role]
    await auditService.log({
      userId: actor.id,
      userName: actor.name,
      eventType: 'PERMISSION_CHANGED',
      description: `Created role ${role.name}`,
      metadata: { roleId: role.id },
    })
    return role
  },

  async updateRole(id: string, input: RoleFormInput, actor: AccessActor): Promise<RoleDefinition> {
    requireActorPermission(actor, ['role.edit', 'role.manage'])
    await delay()
    const existing = roles.find((role) => role.id === id && !role.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'Role not found.')
    if (existing.isSystem && existing.systemRole === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new AccessControlError('FORBIDDEN', 'Only Super Admin can modify the Super Admin role.')
    }

    const permissions = applyPermissionDependencies(input.permissions)
    const previous = [...existing.permissions]
    const added = permissions.filter((item) => !previous.includes(item))
    const removed = previous.filter((item) => !permissions.includes(item))

    const next: RoleDefinition = {
      ...existing,
      name: existing.isSystem ? existing.name : input.name.trim(),
      description: input.description.trim(),
      status: existing.isSystem ? existing.status : input.status,
      permissions,
      scopes: input.scopes ?? existing.scopes,
      updatedAt: nowIso(),
    }
    roles = roles.map((role) => (role.id === id ? next : role))

    if (next.systemRole) {
      setRolePermissionOverride(next.systemRole, permissions)
    }

    await auditService.log({
      userId: actor.id,
      userName: actor.name,
      eventType: 'PERMISSION_CHANGED',
      description: `Updated permissions for role ${next.name}`,
      metadata: {
        roleId: next.id,
        added: added.join(','),
        removed: removed.join(','),
      },
    })
    return next
  },

  async duplicateRole(id: string, actor: AccessActor): Promise<RoleDefinition> {
    requireActorPermission(actor, ['role.create', 'role.manage'])
    const source = await this.getRole(id)
    if (!source) throw new AccessControlError('NOT_FOUND', 'Role not found.')
    return this.createRole(
      {
        name: `${source.name} Copy`,
        description: source.description,
        status: 'active',
        permissions: [...source.permissions],
        scopes: { ...source.scopes },
      },
      actor,
    )
  },

  async deactivateRole(id: string, actor: AccessActor, assignedUserCount: number): Promise<RoleDefinition> {
    requireActorPermission(actor, ['role.edit', 'role.manage'])
    await delay()
    const existing = roles.find((role) => role.id === id && !role.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'Role not found.')
    if (existing.isSystem) {
      throw new AccessControlError('FORBIDDEN', 'System roles cannot be deactivated permanently. Update permissions instead.')
    }
    if (assignedUserCount > 0) {
      throw new AccessControlError('CONFLICT', 'Reassign users before deleting or deactivating this role.')
    }
    const next = { ...existing, status: 'inactive' as const, updatedAt: nowIso() }
    roles = roles.map((role) => (role.id === id ? next : role))
    return next
  },

  async softDeleteRole(id: string, actor: AccessActor, assignedUserCount: number): Promise<void> {
    requireActorPermission(actor, ['role.delete', 'role.manage'])
    await delay()
    const existing = roles.find((role) => role.id === id && !role.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'Role not found.')
    if (existing.isSystem) {
      throw new AccessControlError('FORBIDDEN', 'System roles cannot be permanently deleted.')
    }
    if (assignedUserCount > 0) {
      throw new AccessControlError('CONFLICT', 'Reassign users before deleting this role.')
    }
    roles = roles.map((role) =>
      role.id === id
        ? { ...role, deletedAt: nowIso(), deletedBy: actor.id, status: 'inactive', updatedAt: nowIso() }
        : role,
    )
  },
}

export function getEffectivePermissions(user: User | null | undefined): PermissionName[] {
  if (!user) return []
  const roleIds = user.roleIds?.length ? user.roleIds : [SYSTEM_ROLE_IDS[user.role]]
  const set = new Set<PermissionName>()
  for (const roleId of roleIds) {
    for (const permission of roleService.getPermissionsForRoleId(roleId)) {
      set.add(permission)
    }
  }
  if (set.size === 0) {
    for (const permission of getPermissionsForRole(user.role)) set.add(permission)
  }
  return Array.from(set)
}

export function getPermissionScope(
  user: User | null | undefined,
  permission: PermissionName,
): PermissionScope {
  if (!user) return 'own'
  const roleIds = user.roleIds?.length ? user.roleIds : [SYSTEM_ROLE_IDS[user.role]]
  let best: PermissionScope = 'own'
  const rank: Record<PermissionScope, number> = {
    own: 1,
    assigned: 2,
    team: 3,
    department: 4,
    all: 5,
  }
  for (const roleId of roleIds) {
    const role = roleService.getRoleSync(roleId)
    const scope = role?.scopes[permission]
    if (scope && rank[scope] > rank[best]) best = scope
  }
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.HR_ADMIN) return roleIds.length ? best === 'own' ? 'all' : best : 'all'
  return best
}
