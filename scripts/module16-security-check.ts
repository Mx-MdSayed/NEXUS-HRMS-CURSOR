import { ROLE_PERMISSIONS } from '../src/constants/rbac'
import { ROLES } from '../src/constants/roles'
import { PERMISSIONS } from '../src/constants/permissions'
import { hasPermission } from '../src/lib/permissions'
import type { User } from '../src/types'

function user(role: User['role']): User {
  return {
    id: `u_${role}`,
    name: role,
    email: `${role}@example.com`,
    role,
    status: 'active',
  }
}

const cases: Array<[string, User, keyof typeof PERMISSIONS | string, boolean]> = [
  ['employee settings.view', user(ROLES.EMPLOYEE), PERMISSIONS.SETTINGS_VIEW, false],
  ['employee company.manage', user(ROLES.EMPLOYEE), PERMISSIONS.COMPANY_MANAGE, false],
  ['employee payroll-settings', user(ROLES.EMPLOYEE), PERMISSIONS.PAYROLL_SETTINGS_MANAGE_GLOBAL, false],
  ['employee leave-policy', user(ROLES.EMPLOYEE), PERMISSIONS.LEAVE_POLICY_MANAGE, false],
  ['employee workflow', user(ROLES.EMPLOYEE), PERMISSIONS.WORKFLOW_SETTINGS_MANAGE, false],
  ['employee branding', user(ROLES.EMPLOYEE), PERMISSIONS.BRANDING_MANAGE, false],
  ['manager settings.view', user(ROLES.MANAGER), PERMISSIONS.SETTINGS_VIEW, false],
  ['hr settings.view', user(ROLES.HR_ADMIN), PERMISSIONS.SETTINGS_VIEW, true],
  ['hr settings.manage', user(ROLES.HR_ADMIN), PERMISSIONS.SETTINGS_MANAGE, true],
  ['hr leave-policy', user(ROLES.HR_ADMIN), PERMISSIONS.LEAVE_POLICY_MANAGE, true],
  ['hr workflow', user(ROLES.HR_ADMIN), PERMISSIONS.WORKFLOW_SETTINGS_MANAGE, true],
  ['hr branding', user(ROLES.HR_ADMIN), PERMISSIONS.BRANDING_MANAGE, true],
]

let failed = 0
for (const [name, u, perm, expected] of cases) {
  const actual = hasPermission(u, perm as never)
  const ok = actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${actual}, expected ${expected}`)
  if (!ok) failed++
}

console.log(
  'HR settings-related perms:',
  ROLE_PERMISSIONS[ROLES.HR_ADMIN]
    .filter(
      (p) =>
        p.includes('settings') ||
        p.startsWith('company.') ||
        p.startsWith('organization.') ||
        p.includes('branding') ||
        p.includes('holiday') ||
        p.includes('schedule') ||
        p.includes('location') ||
        p.includes('leave-policy') ||
        p.includes('localization') ||
        p.includes('workflow-settings'),
    )
    .join(', '),
)

process.exit(failed ? 1 : 0)
