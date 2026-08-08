import type { AdminDashboardData, EmployeeDashboardData } from '../types'
import { mockAdminDashboard } from '../data/mockAdminDashboard'
import { mockEmployeeDashboard } from '../data/mockEmployeeDashboard'
import { employeeService } from '@/features/employees'

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
 * Recent employees prefer employeeService when available (Module 5+).
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
    return data
  },

  async getEmployeeDashboard() {
    await delay()
    return structuredClone(mockEmployeeDashboard)
  },
}
