import type { AdminDashboardData, EmployeeDashboardData } from '../types'
import { mockAdminDashboard } from '../data/mockAdminDashboard'
import { mockEmployeeDashboard } from '../data/mockEmployeeDashboard'

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
 * Swap mock responses for real API calls in later modules without redesigning UI.
 */
export const dashboardService: DashboardService = {
  async getAdminDashboard() {
    await delay()
    return structuredClone(mockAdminDashboard)
  },

  async getEmployeeDashboard() {
    await delay()
    return structuredClone(mockEmployeeDashboard)
  },
}
