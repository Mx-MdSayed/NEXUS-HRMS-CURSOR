import { ROLES } from '@/constants/roles'
import type { PermissionName, User } from '@/types'
import { getEffectivePermissions, getPermissionScope } from './roleService'

function linkedEmployeeMatches(user: User, employeeIdOrCode: string): boolean {
  return (
    user.employeeRecordId === employeeIdOrCode ||
    user.employeeId === employeeIdOrCode ||
    Boolean(user.employeeId && employeeIdOrCode.toUpperCase() === user.employeeId.toUpperCase())
  )
}

function sameDepartment(user: User, targetDepartmentId?: string): boolean {
  return Boolean(user.departmentId && targetDepartmentId && user.departmentId === targetDepartmentId)
}

export const accessScopeService = {
  canAccessEmployee(
    user: User | null | undefined,
    employeeId: string,
    targetDepartmentId?: string,
  ): boolean {
    if (!user) return false
    const permissions = getEffectivePermissions(user)
    if (!permissions.includes('employee.view') && user.role === ROLES.EMPLOYEE) {
      return linkedEmployeeMatches(user, employeeId)
    }
    if (!permissions.includes('employee.view')) return linkedEmployeeMatches(user, employeeId)
    const scope = getPermissionScope(user, 'employee.view')
    if (scope === 'all') return true
    if (scope === 'own') return linkedEmployeeMatches(user, employeeId)
    if (scope === 'department') return sameDepartment(user, targetDepartmentId) || linkedEmployeeMatches(user, employeeId)
    if (scope === 'team' || scope === 'assigned') {
      // Team graph is approximate in mock data: department peers + self.
      return sameDepartment(user, targetDepartmentId) || linkedEmployeeMatches(user, employeeId)
    }
    return false
  },

  canAccessAttendance(user: User | null | undefined, employeeId: string, departmentId?: string): boolean {
    if (!user) return false
    if (!getEffectivePermissions(user).includes('attendance.view')) {
      return linkedEmployeeMatches(user, employeeId)
    }
    const scope = getPermissionScope(user, 'attendance.view')
    if (scope === 'all') return true
    if (scope === 'own') return linkedEmployeeMatches(user, employeeId)
    return sameDepartment(user, departmentId) || linkedEmployeeMatches(user, employeeId)
  },

  canAccessLeave(user: User | null | undefined, employeeId: string, departmentId?: string): boolean {
    if (!user) return false
    if (!getEffectivePermissions(user).includes('leave.view')) {
      return linkedEmployeeMatches(user, employeeId)
    }
    const scope = getPermissionScope(user, 'leave.view')
    if (scope === 'all') return true
    if (scope === 'own') return linkedEmployeeMatches(user, employeeId)
    return sameDepartment(user, departmentId) || linkedEmployeeMatches(user, employeeId)
  },

  canAccessSalary(user: User | null | undefined, employeeId: string): boolean {
    if (!user) return false
    const permissions = getEffectivePermissions(user)
    if (!permissions.includes('salary.view')) return false
    const scope = getPermissionScope(user, 'salary.view')
    if (scope === 'all') return true
    return linkedEmployeeMatches(user, employeeId)
  },

  canAccessPayslip(user: User | null | undefined, employeeId: string): boolean {
    if (!user) return false
    const permissions = getEffectivePermissions(user)
    if (!permissions.includes('payslip.view')) return false
    const scope = getPermissionScope(user, 'payslip.view')
    if (scope === 'all') return true
    return linkedEmployeeMatches(user, employeeId)
  },

  canAccessPayroll(user: User | null | undefined, _payrollId?: string): boolean {
    if (!user) return false
    return getEffectivePermissions(user).includes('payroll.view')
  },

  canAccessReport(user: User | null | undefined, reportType: string): boolean {
    if (!user) return false
    const permissions = getEffectivePermissions(user)
    if (permissions.includes('report.admin') || permissions.includes('report.view')) {
      const map: Record<string, PermissionName> = {
        employees: 'report.employee',
        attendance: 'report.attendance',
        leave: 'report.leave',
        salary: 'report.salary',
        payroll: 'report.payroll',
        payslips: 'report.payslip',
        departments: 'report.department',
        workforce: 'report.workforce',
      }
      const required = map[reportType]
      return required ? permissions.includes(required) || permissions.includes('report.admin') : true
    }
    return false
  },

  hasPermissionScope(user: User | null | undefined, permission: PermissionName): boolean {
    return getEffectivePermissions(user).includes(permission)
  },
}
