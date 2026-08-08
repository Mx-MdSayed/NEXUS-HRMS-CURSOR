import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { employeeService } from '@/features/employees/services/employeeService'
import { DEV_AUTH_ACCOUNTS } from '@/services/auth/devAuthConfig'
import { getPermissionsForRole } from '@/constants/rbac'

export interface WorkflowApprover {
  id: string
  name: string
  email?: string
}

async function employeeByEmail(email: string): Promise<WorkflowApprover | null> {
  const employee = await employeeService.getEmployeeByEmail(email)
  return employee ? { id: employee.id, name: employee.fullName, email: employee.email } : null
}

async function employeeById(id?: string): Promise<WorkflowApprover | null> {
  if (!id) return null
  try {
    const employee = await employeeService.getEmployeeById(id)
    return { id: employee.id, name: employee.fullName, email: employee.email }
  } catch {
    return null
  }
}

async function hrFallback(): Promise<WorkflowApprover> {
  for (const account of DEV_AUTH_ACCOUNTS) {
    const permissions = getPermissionsForRole(account.role)
    if (account.role === ROLES.HR_ADMIN || permissions.includes(PERMISSIONS.WORKFLOW_APPROVE)) {
      const employee = await employeeByEmail(account.email)
      if (employee) return employee
    }
  }
  return { id: 'emp-1002', name: 'Harper HR', email: 'hr@example.com' }
}

async function managerOrHr(employeeId: string): Promise<WorkflowApprover> {
  try {
    const employee = await employeeService.getEmployeeById(employeeId)
    const manager = await employeeById(employee.reportingManagerId)
    if (manager && manager.id !== employeeId) return manager
  } catch {
    // Fallback below.
  }
  return hrFallback()
}

export const workflowRoutingService = {
  getApproverForLeave(employeeId: string): Promise<WorkflowApprover> {
    return managerOrHr(employeeId)
  },

  getApproverForAttendance(employeeId: string): Promise<WorkflowApprover> {
    return managerOrHr(employeeId)
  },

  getApproverForProfile(employeeId: string): Promise<WorkflowApprover> {
    return managerOrHr(employeeId)
  },

  async getApproverForPayroll(): Promise<WorkflowApprover> {
    const superAdmin = DEV_AUTH_ACCOUNTS.find((account) => account.role === ROLES.SUPER_ADMIN)
    if (superAdmin) {
      const employee = await employeeByEmail(superAdmin.email)
      if (employee) return employee
    }
    return hrFallback()
  },

  getHrFallback: hrFallback,
}
