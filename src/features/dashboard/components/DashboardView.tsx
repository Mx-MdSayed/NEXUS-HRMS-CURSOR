import { useCallback, useEffect, useState } from 'react'
import { ErrorState } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/constants/roles'
import { dashboardService } from '../services/dashboardService'
import type { AdminDashboardData, EmployeeDashboardData } from '../types'
import { AdminDashboard } from './AdminDashboard'
import { DashboardHeader } from './DashboardHeader'
import { DashboardSkeleton } from './DashboardSkeleton'
import { EmployeeDashboard } from './EmployeeDashboard'

export function DashboardPage() {
  const { user, hasRole } = useAuth()
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null)
  const [employeeData, setEmployeeData] = useState<EmployeeDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      if (isEmployeeUser) {
        const data = await dashboardService.getEmployeeDashboard(user ?? undefined)
        setEmployeeData(data)
        setAdminData(null)
      } else {
        const data = await dashboardService.getAdminDashboard()
        setAdminData(data)
        setEmployeeData(null)
      }
    } catch {
      setHasError(true)
      setAdminData(null)
      setEmployeeData(null)
    } finally {
      setIsLoading(false)
    }
  }, [isEmployeeUser, user])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const userName = user?.firstName ?? user?.name ?? 'there'

  return (
    <div>
      <DashboardHeader userName={userName} isEmployee={isEmployeeUser} />

      {isLoading ? <DashboardSkeleton variant={isEmployeeUser ? 'employee' : 'admin'} /> : null}

      {!isLoading && hasError ? (
        <ErrorState
          title="Unable to load dashboard data."
          message="Please try again. If the problem continues, contact your administrator."
          onRetry={() => {
            void loadDashboard()
          }}
        />
      ) : null}

      {!isLoading && !hasError && isEmployeeUser && employeeData ? (
        <EmployeeDashboard data={employeeData} />
      ) : null}

      {!isLoading && !hasError && !isEmployeeUser && adminData ? (
        <AdminDashboard data={adminData} />
      ) : null}
    </div>
  )
}
