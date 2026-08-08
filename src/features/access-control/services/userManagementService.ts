import { SYSTEM_ROLE_IDS, ROLES, ROLE_LABELS } from '@/constants/roles'
import type { PermissionName, RoleName, User, UserStatus } from '@/types'
import type {
  AccessActor,
  CreateUserInput,
  ManagedUser,
  UpdateUserInput,
  UserListFilters,
} from '../types'
import { AccessControlError } from './errors'
import { auditService } from './auditService'
import { roleService } from './roleService'

function delay(ms = 140): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nowIso(): string {
  return new Date().toISOString()
}

type InternalUser = ManagedUser & {
  password: string
}

const seedNow = '2026-08-01T09:00:00.000Z'

let users: InternalUser[] = [
  {
    id: 'usr_super_admin',
    employeeId: 'EMP-1001',
    employeeRecordId: 'emp-1001',
    employeeCode: 'EMP-1001',
    firstName: 'Ava',
    lastName: 'Admin',
    name: 'Ava Admin',
    email: 'admin@example.com',
    username: 'ava.admin',
    role: ROLES.SUPER_ADMIN,
    roleId: SYSTEM_ROLE_IDS.super_admin,
    roleIds: [SYSTEM_ROLE_IDS.super_admin],
    roleName: ROLE_LABELS.super_admin,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: '2026-08-08T08:10:00.000Z',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    designationId: 'des-hr-dir',
    designationName: 'HR Director',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_hr_admin',
    employeeId: 'EMP-1002',
    employeeRecordId: 'emp-1002',
    employeeCode: 'EMP-1002',
    firstName: 'Harper',
    lastName: 'HR',
    name: 'Harper HR',
    email: 'hr@example.com',
    username: 'harper.hr',
    role: ROLES.HR_ADMIN,
    roleId: SYSTEM_ROLE_IDS.hr_admin,
    roleIds: [SYSTEM_ROLE_IDS.hr_admin],
    roleName: ROLE_LABELS.hr_admin,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-08T07:45:00.000Z',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    designationId: 'des-hr-mgr',
    designationName: 'HR Manager',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_employee',
    employeeId: 'EMP-1003',
    employeeRecordId: 'emp-1003',
    employeeCode: 'EMP-1003',
    firstName: 'Eden',
    lastName: 'Employee',
    name: 'Eden Employee',
    email: 'employee@example.com',
    username: 'eden.employee',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-07T18:20:00.000Z',
    departmentId: 'dept-it',
    departmentName: 'Information Technology',
    designationId: 'des-dev',
    designationName: 'Developer',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_hr_manager',
    employeeId: 'EMP-2041',
    employeeRecordId: 'emp-2041',
    employeeCode: 'EMP-2041',
    firstName: 'Rahul',
    lastName: 'Sharma',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    username: 'rahul.sharma',
    role: ROLES.HR_MANAGER,
    roleId: SYSTEM_ROLE_IDS.hr_manager,
    roleIds: [SYSTEM_ROLE_IDS.hr_manager],
    roleName: ROLE_LABELS.hr_manager,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-06T11:00:00.000Z',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    designationName: 'HR Business Partner',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_manager',
    employeeId: 'EMP-1988',
    employeeRecordId: 'emp-1988',
    employeeCode: 'EMP-1988',
    firstName: 'Priya',
    lastName: 'Nair',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    username: 'priya.nair',
    role: ROLES.MANAGER,
    roleId: SYSTEM_ROLE_IDS.manager,
    roleIds: [SYSTEM_ROLE_IDS.manager],
    roleName: ROLE_LABELS.manager,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-05T10:15:00.000Z',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    designationName: 'Engineering Manager',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_pending',
    employeeId: 'EMP-2110',
    employeeRecordId: 'emp-2110',
    employeeCode: 'EMP-2110',
    firstName: 'Daniel',
    lastName: 'Okonkwo',
    name: 'Daniel Okonkwo',
    email: 'daniel.okonkwo@example.com',
    username: 'daniel.okonkwo',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'pending',
    employmentStatus: 'active',
    isActive: false,
    mustChangePassword: true,
    departmentName: 'Finance',
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z',
    password: 'TempPass123!',
  },
  {
    id: 'usr_inactive',
    employeeId: 'EMP-1875',
    employeeRecordId: 'emp-1875',
    employeeCode: 'EMP-1875',
    firstName: 'Mei',
    lastName: 'Chen',
    name: 'Mei Chen',
    email: 'mei.chen@example.com',
    username: 'mei.chen',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'inactive',
    employmentStatus: 'inactive',
    isActive: false,
    lastLoginAt: '2026-05-01T09:00:00.000Z',
    departmentName: 'Operations',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_suspended',
    employeeId: 'EMP-2201',
    employeeRecordId: 'emp-2201',
    employeeCode: 'EMP-2201',
    firstName: 'Aisha',
    lastName: 'Khan',
    name: 'Aisha Khan',
    email: 'aisha.khan@example.com',
    username: 'aisha.khan',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'suspended',
    employmentStatus: 'active',
    isActive: false,
    suspendedReason: 'Security review in progress',
    lastLoginAt: '2026-07-20T12:00:00.000Z',
    departmentName: 'Sales',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_emp_4',
    employeeId: 'EMP-2202',
    employeeRecordId: 'emp-2202',
    employeeCode: 'EMP-2202',
    firstName: 'Lucas',
    lastName: 'Meyer',
    name: 'Lucas Meyer',
    email: 'lucas.meyer@example.com',
    username: 'lucas.meyer',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-03T16:00:00.000Z',
    departmentName: 'Marketing',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_emp_5',
    employeeId: 'EMP-2198',
    employeeRecordId: 'emp-2198',
    employeeCode: 'EMP-2198',
    firstName: 'Sofia',
    lastName: 'Alvarez',
    name: 'Sofia Alvarez',
    email: 'sofia.alvarez@example.com',
    username: 'sofia.alvarez',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-02T14:30:00.000Z',
    departmentName: 'Customer Success',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_custom',
    employeeId: 'EMP-2195',
    employeeRecordId: 'emp-2195',
    employeeCode: 'EMP-2195',
    firstName: 'Noah',
    lastName: 'Patel',
    name: 'Noah Patel',
    email: 'noah.patel@example.com',
    username: 'noah.patel',
    role: ROLES.HR_MANAGER,
    roleId: 'role_custom_hr_ops',
    roleIds: ['role_custom_hr_ops'],
    roleName: 'HR Operations',
    status: 'active',
    employmentStatus: 'active',
    isActive: true,
    lastLoginAt: '2026-08-01T10:00:00.000Z',
    departmentName: 'Human Resources',
    createdAt: seedNow,
    updatedAt: seedNow,
    password: 'Password123!',
  },
  {
    id: 'usr_emp_6',
    employeeId: 'EMP-1750',
    employeeRecordId: 'emp-1750',
    employeeCode: 'EMP-1750',
    firstName: 'Ishan',
    lastName: 'Verma',
    name: 'Ishan Verma',
    email: 'ishan.verma@example.com',
    username: 'ishan.verma',
    role: ROLES.EMPLOYEE,
    roleId: SYSTEM_ROLE_IDS.employee,
    roleIds: [SYSTEM_ROLE_IDS.employee],
    roleName: ROLE_LABELS.employee,
    status: 'active',
    employmentStatus: 'probation',
    isActive: true,
    departmentName: 'Engineering',
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    password: 'Password123!',
  },
]

let userSeq = 100

function toPublic(user: InternalUser): ManagedUser {
  const { password: _password, ...rest } = user
  return rest
}

function requireActorPermission(actor: AccessActor, permission: PermissionName | PermissionName[]): void {
  if (!actor.hasPermission(permission)) {
    throw new AccessControlError('UNAUTHORIZED', 'You do not have permission for this action.')
  }
}

function countActiveSuperAdmins(excludeId?: string): number {
  return users.filter(
    (user) =>
      !user.deletedAt &&
      user.id !== excludeId &&
      user.role === ROLES.SUPER_ADMIN &&
      user.status === 'active' &&
      user.isActive,
  ).length
}

function assertNotLastSuperAdmin(target: InternalUser, nextStatus?: UserStatus, nextRole?: RoleName): void {
  const demotingRole = nextRole && nextRole !== ROLES.SUPER_ADMIN && target.role === ROLES.SUPER_ADMIN
  const disabling =
    nextStatus &&
    target.role === ROLES.SUPER_ADMIN &&
    (nextStatus === 'inactive' || nextStatus === 'suspended' || nextStatus === 'pending')
  if ((demotingRole || disabling) && countActiveSuperAdmins(target.id) === 0) {
    throw new AccessControlError(
      'LAST_SUPER_ADMIN',
      'Cannot deactivate, suspend, or demote the only Super Admin.',
    )
  }
}

function resolveRoleFields(roleId: string): {
  role: RoleName
  roleId: string
  roleIds: string[]
  roleName: string
} {
  const role = roleService.getRoleSync(roleId)
  if (!role) throw new AccessControlError('VALIDATION', 'Selected role is invalid.')
  const systemRole = role.systemRole ?? ROLES.EMPLOYEE
  return {
    role: systemRole,
    roleId: role.id,
    roleIds: [role.id],
    roleName: role.name,
  }
}

function isElevatedRole(role: RoleName): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_ADMIN || role === ROLES.HR_MANAGER
}

export const userManagementService = {
  async listUsers(filters: UserListFilters = {}, actor?: AccessActor): Promise<ManagedUser[]> {
    if (actor) requireActorPermission(actor, ['user.view', 'user.manage'])
    await delay()
    return users
      .filter((user) => !user.deletedAt)
      .filter((user) => {
        if (filters.role && user.role !== filters.role) return false
        if (filters.roleId && user.roleId !== filters.roleId) return false
        if (filters.status && user.status !== filters.status) return false
        if (filters.departmentId && user.departmentId !== filters.departmentId) return false
        if (filters.createdFrom && user.createdAt.slice(0, 10) < filters.createdFrom) return false
        if (filters.createdTo && user.createdAt.slice(0, 10) > filters.createdTo) return false
        if (filters.search) {
          const q = filters.search.toLowerCase()
          return (
            user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q) ||
            (user.username ?? '').toLowerCase().includes(q) ||
            (user.employeeCode ?? user.employeeId ?? '').toLowerCase().includes(q)
          )
        }
        return true
      })
      .map(toPublic)
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async getUser(id: string, actor?: AccessActor): Promise<ManagedUser | null> {
    if (actor) requireActorPermission(actor, ['user.view', 'user.manage'])
    await delay()
    const user = users.find((item) => item.id === id && !item.deletedAt)
    return user ? toPublic(user) : null
  },

  findByEmailSync(email: string): ManagedUser | null {
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && !item.deletedAt)
    return user ? toPublic(user) : null
  },

  findInternalByEmail(email: string): InternalUser | null {
    return users.find((item) => item.email.toLowerCase() === email.toLowerCase() && !item.deletedAt) ?? null
  },

  getActiveUserForEmployee(employeeRecordId: string): ManagedUser | null {
    const user = users.find(
      (item) =>
        !item.deletedAt &&
        item.employeeRecordId === employeeRecordId &&
        (item.status === 'active' || item.status === 'pending' || item.status === 'suspended'),
    )
    return user ? toPublic(user) : null
  },

  countUsersByRoleId(roleId: string): number {
    return users.filter((user) => !user.deletedAt && user.roleId === roleId).length
  },

  async createUser(input: CreateUserInput, actor: AccessActor, employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    departmentId?: string
    departmentName?: string
    designationId?: string
    designationName?: string
  }): Promise<ManagedUser> {
    requireActorPermission(actor, ['user.create', 'user.manage'])
    await delay()

    if (this.getActiveUserForEmployee(employee.id)) {
      throw new AccessControlError('CONFLICT', 'User account already exists for this employee.')
    }
    if (users.some((user) => !user.deletedAt && user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AccessControlError('CONFLICT', 'A user with this email already exists.')
    }

    const roleFields = resolveRoleFields(input.roleId)
    if (isElevatedRole(roleFields.role) && actor.role !== ROLES.SUPER_ADMIN && roleFields.role === ROLES.SUPER_ADMIN) {
      throw new AccessControlError('FORBIDDEN', 'Only Super Admin can create Super Admin accounts.')
    }

    const status = input.status
    const user: InternalUser = {
      id: `usr_${userSeq++}`,
      employeeId: employee.employeeCode,
      employeeRecordId: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      name: employee.fullName,
      email: input.email.trim().toLowerCase(),
      username: input.username?.trim() || undefined,
      ...roleFields,
      status,
      employmentStatus: 'active',
      isActive: status === 'active',
      mustChangePassword: input.mustChangePassword ?? true,
      departmentId: employee.departmentId,
      departmentName: employee.departmentName,
      designationId: employee.designationId,
      designationName: employee.designationName,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      password: input.temporaryPassword || 'TempPass123!',
    }
    users = [...users, user]
    await auditService.log({
      userId: actor.id,
      userName: actor.name,
      eventType: 'ACCOUNT_ACTIVATED',
      description: `Created user account for ${user.name}`,
      metadata: { targetUserId: user.id, role: user.roleName },
    })
    return toPublic(user)
  },

  async updateUser(id: string, input: UpdateUserInput, actor: AccessActor): Promise<ManagedUser> {
    requireActorPermission(actor, ['user.edit', 'user.manage'])
    await delay()
    const existing = users.find((user) => user.id === id && !user.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'User not found.')

    if (existing.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new AccessControlError('FORBIDDEN', 'Only Super Admin can modify Super Admin accounts.')
    }

    let roleFields: {
      role: RoleName
      roleId: string
      roleIds: string[]
      roleName: string
    } = {
      role: existing.role,
      roleId: existing.roleId,
      roleIds: existing.roleIds ?? [existing.roleId],
      roleName: existing.roleName,
    }
    if (input.roleId && input.roleId !== existing.roleId) {
      roleFields = resolveRoleFields(input.roleId)
      assertNotLastSuperAdmin(existing, undefined, roleFields.role)
      if (
        existing.role === ROLES.EMPLOYEE &&
        isElevatedRole(roleFields.role) &&
        !actor.hasPermission(['user.manage', 'role.manage'])
      ) {
        throw new AccessControlError('FORBIDDEN', 'Elevated role assignment requires additional permission.')
      }
    }
    if (input.status) assertNotLastSuperAdmin(existing, input.status)

    const previousRole = existing.roleName
    const next: InternalUser = {
      ...existing,
      email: input.email?.trim().toLowerCase() || existing.email,
      username: input.username !== undefined ? input.username.trim() || undefined : existing.username,
      ...roleFields,
      status: input.status ?? existing.status,
      isActive: (input.status ?? existing.status) === 'active',
      mustChangePassword: input.mustChangePassword ?? existing.mustChangePassword,
      suspendedReason:
        (input.status ?? existing.status) === 'suspended'
          ? input.suspendedReason ?? existing.suspendedReason
          : undefined,
      updatedAt: nowIso(),
    }
    users = users.map((user) => (user.id === id ? next : user))

    if (input.roleId && previousRole !== next.roleName) {
      await auditService.log({
        userId: actor.id,
        userName: actor.name,
        eventType: 'ROLE_CHANGED',
        description: `Changed role for ${next.name} from ${previousRole} to ${next.roleName}`,
        metadata: { targetUserId: next.id, previousRole, newRole: next.roleName },
      })
    }
    return toPublic(next)
  },

  async setStatus(
    id: string,
    status: UserStatus,
    actor: AccessActor,
    reason?: string,
  ): Promise<ManagedUser> {
    requireActorPermission(actor, ['user.edit', 'user.manage'])
    return this.updateUser(id, { status, suspendedReason: reason }, actor).then(async (user) => {
      const eventType =
        status === 'active'
          ? 'ACCOUNT_ACTIVATED'
          : status === 'suspended'
            ? 'ACCOUNT_SUSPENDED'
            : 'ACCOUNT_DEACTIVATED'
      await auditService.log({
        userId: actor.id,
        userName: actor.name,
        eventType,
        description: `Set ${user.name} status to ${status}${reason ? `: ${reason}` : ''}`,
        metadata: { targetUserId: user.id, status },
      })
      return user
    })
  },

  async resetPasswordFoundation(id: string, actor: AccessActor): Promise<void> {
    requireActorPermission(actor, ['user.edit', 'user.manage'])
    await delay()
    const existing = users.find((user) => user.id === id && !user.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'User not found.')
    if (existing.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new AccessControlError('FORBIDDEN', 'Only Super Admin can reset Super Admin passwords.')
    }
    users = users.map((user) =>
      user.id === id
        ? {
            ...user,
            password: 'TempPass123!',
            mustChangePassword: true,
            updatedAt: nowIso(),
          }
        : user,
    )
    await auditService.log({
      userId: actor.id,
      userName: actor.name,
      eventType: 'PASSWORD_RESET',
      description: `Password reset initiated for ${existing.name}`,
      metadata: { targetUserId: existing.id },
    })
  },

  async softDelete(id: string, actor: AccessActor): Promise<void> {
    requireActorPermission(actor, ['user.delete', 'user.manage'])
    await delay()
    const existing = users.find((user) => user.id === id && !user.deletedAt)
    if (!existing) throw new AccessControlError('NOT_FOUND', 'User not found.')
    assertNotLastSuperAdmin(existing, 'inactive')
    if (existing.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      throw new AccessControlError('FORBIDDEN', 'Cannot delete Super Admin accounts.')
    }
    users = users.map((user) =>
      user.id === id
        ? {
            ...user,
            status: 'inactive',
            isActive: false,
            deletedAt: nowIso(),
            deletedBy: actor.id,
            updatedAt: nowIso(),
          }
        : user,
    )
  },

  async authenticate(email: string, password: string): Promise<User | null> {
    await delay(80)
    const user = this.findInternalByEmail(email)
    if (!user || user.password !== password) return null
    if (user.status !== 'active' || !user.isActive) {
      throw new AccessControlError(
        'FORBIDDEN',
        user.status === 'pending'
          ? 'This account is pending activation.'
          : user.status === 'suspended'
            ? 'This account is suspended.'
            : 'This account is inactive.',
      )
    }
    users = users.map((item) =>
      item.id === user.id ? { ...item, lastLoginAt: nowIso(), updatedAt: nowIso() } : item,
    )
    return toPublic({ ...user, lastLoginAt: nowIso() })
  },

  markPasswordChanged(userId: string): void {
    users = users.map((user) =>
      user.id === userId
        ? { ...user, mustChangePassword: false, updatedAt: nowIso() }
        : user,
    )
  },

  getStats(): { active: number; inactive: number; suspended: number; pending: number } {
    const live = users.filter((user) => !user.deletedAt)
    return {
      active: live.filter((user) => user.status === 'active').length,
      inactive: live.filter((user) => user.status === 'inactive').length,
      suspended: live.filter((user) => user.status === 'suspended').length,
      pending: live.filter((user) => user.status === 'pending' || user.status === 'invited').length,
    }
  },
}
