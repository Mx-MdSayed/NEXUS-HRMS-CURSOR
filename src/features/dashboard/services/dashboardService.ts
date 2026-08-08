import type { AdminDashboardData, EmployeeDashboardData } from '../types'
import { mockAdminDashboard } from '../data/mockAdminDashboard'
import { mockEmployeeDashboard } from '../data/mockEmployeeDashboard'
import { employeeService } from '@/features/employees'
import { departmentService } from '@/features/organization/services/departmentService'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'

function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export interface DashboardService {
  getAdminDashboard(): Promise<AdminDashboardData>
  getEmployeeDashboard(): Promise<EmployeeDashboardData>
}

/**
 * Dashboard data adapter.
 * Recent employees and department KPI prefer live services when available.
 */
export const dashboardService: DashboardService = {
  async getAdminDashboard() {
    await delay()
    const data = structuredClone(mockAdminDashboard)
    try {
      const recent = await employeeService.getEmployees({
        page: 1,
        pageSize: 5,
        sortBy: 'joiningDate',
        sortDirection: 'desc',
      })
      if (recent.data.length > 0) {
        data.recentEmployees = recent.data.map((employee) => ({
          id: employee.id,
          employeeId: employee.employeeCode,
          name: employee.fullName,
          department: employee.departmentName,
          joiningDate: employee.joiningDate,
          status: employee.employmentStatus,
          avatarUrl: employee.profilePhoto,
        }))
      }
    } catch {
      // Keep mock recent employees if employee service is unavailable.
    }

    try {
      const activeDepartments = listActiveDepartmentOptions()
      const departmentsKpi = data.kpis.find((item) => item.id === 'departments')
      if (departmentsKpi) {
        departmentsKpi.value = activeDepartments.length
        departmentsKpi.subtitle = 'Active departments'
      }

      const distribution = await departmentService.getDepartments({ status: 'active' }, 1, 50)
      if (distribution.data.length > 0) {
        const totalEmployees = distribution.data.reduce(
          (sum, department) => sum + department.employeeCount,
          0,
        )
        data.departmentDistribution = distribution.data.map((department) => ({
          id: department.id,
          name: department.name,
          employeeCount: department.employeeCount,
          percentage:
            totalEmployees > 0
              ? Math.round((department.employeeCount / totalEmployees) * 100)
              : 0,
        }))
      }
    } catch {
      // Keep mock department metrics if organization services are unavailable.
    }

    return data
  },

  async getEmployeeDashboard() {
    await delay()
    return structuredClone(mockEmployeeDashboard)
  },
}
