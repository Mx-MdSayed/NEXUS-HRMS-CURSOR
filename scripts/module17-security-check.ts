/**
 * Module 17 security / RBAC smoke checks (service + permission layer).
 */
import { ROLE_PERMISSIONS } from '../src/constants/rbac'
import { ROLES } from '../src/constants/roles'
import { PERMISSIONS } from '../src/constants/permissions'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../src/lib/permissions'
import { accessScopeService } from '../src/features/access-control/services/accessScopeService'
import type { User } from '../src/types'
import { sanitizeCsvCell } from '../src/utils/csv'

function user(role: User['role'], extras: Partial<User> = {}): User {
  return {
    id: `u_${role}`,
    name: role,
    email: `${role}@example.com`,
    role,
    status: 'active',
    employeeId: extras.employeeId,
    employeeRecordId: extras.employeeRecordId ?? extras.employeeId,
    departmentId: extras.departmentId,
    ...extras,
  }
}

let failed = 0
function assert(name: string, actual: boolean, expected: boolean) {
  const ok = actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) failed++
}

const employee = user(ROLES.EMPLOYEE, { employeeId: 'emp_self', departmentId: 'dept_hr' })
const manager = user(ROLES.MANAGER, { employeeId: 'emp_mgr', departmentId: 'dept_eng' })
const hr = user(ROLES.HR_ADMIN)
const admin = user(ROLES.SUPER_ADMIN)

assert('employee blocked from settings', hasPermission(employee, PERMISSIONS.SETTINGS_VIEW), false)
assert('employee blocked from users', hasPermission(employee, PERMISSIONS.USER_VIEW), false)
assert('employee blocked from payroll', hasPermission(employee, PERMISSIONS.PAYROLL_VIEW), false)
assert('employee blocked from roles', hasPermission(employee, PERMISSIONS.ROLE_VIEW), false)
assert('employee has ESS', hasPermission(employee, PERMISSIONS.ESS_VIEW), true)
assert('manager blocked from payroll finalize', hasPermission(manager, PERMISSIONS.PAYROLL_FINALIZE), false)
assert('hr has payroll', hasPermission(hr, PERMISSIONS.PAYROLL_VIEW), true)
assert('admin has all settings', hasAllPermissions(admin, [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE]), true)
assert(
  'hasAnyPermission works for hr',
  hasAnyPermission(hr, [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.PAYROLL_VIEW]),
  true,
)

assert(
  'employee own employee access',
  accessScopeService.canAccessEmployee(employee, 'emp_self'),
  true,
)
assert(
  'employee cannot access other employee',
  accessScopeService.canAccessEmployee(employee, 'emp_other'),
  false,
)
assert(
  'employee own payslip access',
  accessScopeService.canAccessPayslip(employee, 'emp_self'),
  true,
)
assert(
  'employee cannot access other payslip',
  accessScopeService.canAccessPayslip(employee, 'emp_other'),
  false,
)

assert('csv formula sanitize', sanitizeCsvCell('=cmd') === "'=cmd", true)
assert('csv plus sanitize', sanitizeCsvCell('+123') === "'+123", true)

console.log('HR permission count', ROLE_PERMISSIONS[ROLES.HR_ADMIN].length)
console.log('Employee permission count', ROLE_PERMISSIONS[ROLES.EMPLOYEE].length)

process.exit(failed ? 1 : 0)
