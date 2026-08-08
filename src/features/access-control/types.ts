import type {
  PermissionName,
  PermissionScope,
  RoleName,
  User,
  UserStatus,
} from '@/types'

export type RoleStatus = 'active' | 'inactive'

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'SETTINGS_CHANGED'
  | 'SESSION_SIGNED_OUT'

export interface PermissionDefinition {
  id: string
  code: PermissionName
  name: string
  module: string
  category: string
  action: string
  description: string
  isSystemPermission: boolean
  defaultScope?: PermissionScope
}

export interface RoleDefinition {
  id: string
  code: string
  name: string
  description: string
  systemRole?: RoleName
  isSystem: boolean
  status: RoleStatus
  permissions: PermissionName[]
  scopes: Partial<Record<PermissionName, PermissionScope>>
  createdAt: string
  updatedAt: string
  deletedAt?: string
  deletedBy?: string
}

export interface ManagedUser extends User {
  employeeCode?: string
  departmentName?: string
  designationName?: string
  roleName: string
  roleId: string
}

export interface UserListFilters {
  search?: string
  role?: RoleName | ''
  roleId?: string
  status?: UserStatus | ''
  departmentId?: string
  createdFrom?: string
  createdTo?: string
}

export interface CreateUserInput {
  employeeRecordId: string
  email: string
  username?: string
  roleId: string
  status: UserStatus
  temporaryPassword?: string
  mustChangePassword?: boolean
}

export interface UpdateUserInput {
  email?: string
  username?: string
  roleId?: string
  status?: UserStatus
  mustChangePassword?: boolean
  suspendedReason?: string
}

export interface RoleFormInput {
  name: string
  description: string
  status: RoleStatus
  permissions: PermissionName[]
  scopes?: Partial<Record<PermissionName, PermissionScope>>
}

export interface LoginActivity {
  id: string
  userId: string
  userName: string
  email: string
  loggedInAt: string
  ipPlaceholder: string
  devicePlaceholder: string
  browserPlaceholder: string
  status: 'success' | 'failed'
}

export interface UserSession {
  id: string
  userId: string
  userName: string
  devicePlaceholder: string
  loginAt: string
  lastActiveAt: string
  status: 'active' | 'signed_out'
  isCurrent?: boolean
}

export interface SecurityEvent {
  id: string
  userId?: string
  userName?: string
  eventType: SecurityEventType
  description: string
  timestamp: string
  metadata?: Record<string, string>
}

export interface AccessActor {
  id: string
  name: string
  role: RoleName
  permissions: PermissionName[]
  hasPermission: (permission: PermissionName | PermissionName[]) => boolean
}

export interface SecurityDashboardStats {
  activeUsers: number
  inactiveUsers: number
  suspendedUsers: number
  pendingUsers: number
  recentLogins: LoginActivity[]
  recentEvents: SecurityEvent[]
}
