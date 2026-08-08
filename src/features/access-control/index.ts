export { Can } from './components/Can'
export { useAccessActor } from './hooks/useAccessActor'
export { PERMISSION_CATALOG, PERMISSION_MODULES } from './data/permissionCatalog'
export { accessScopeService } from './services/accessScopeService'
export { auditService } from './services/auditService'
export { AccessControlError, getAccessControlErrorMessage } from './services/errors'
export {
  applyPermissionDependencies,
  describeRoleCapabilities,
  getEffectivePermissions,
  getPermissionScope,
  roleService,
} from './services/roleService'
export { securityService } from './services/securityService'
export { userManagementService } from './services/userManagementService'
export { UserListPage } from './pages/UserListPage'
export { UserCreatePage } from './pages/UserCreatePage'
export { UserDetailPage, UserEditPage } from './pages/UserDetailPages'
export { RoleListPage, RoleCreatePage, RoleEditPage, RoleDetailPage } from './pages/RolePages'
export { PermissionsPage, PermissionMatrixPage } from './pages/PermissionPages'
export {
  SecurityDashboardPage,
  LoginActivityPage,
  SessionsPage,
} from './pages/SecurityPages'
export type * from './types'
