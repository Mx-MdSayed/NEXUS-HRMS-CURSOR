import type { AdminDashboardData, EmployeeDashboardData } from '../types'
import { mockAdminDashboard } from '../data/mockAdminDashboard'
import { mockEmployeeDashboard } from '../data/mockEmployeeDashboard'
import { employeeService } from '@/features/employees'
import { departmentService } from '@/features/organization/services/departmentService'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { format } from 'date-fns'

function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export interface DashboardService {
  getAdminDashboard(): Promise<AdminDashboardData>
  getEmployeeDashboard(user?: { email?: string; employeeId?: string | null; name?: string }): Promise<EmployeeDashboardData>
}

/**
 * Dashboard data adapter.
 * Live services preferred when available (employees, departments, attendance).
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

    try {
      const today = await attendanceService.getTodayAttendance()
      const setKpi = (id: string, value: number, subtitle?: string) => {
        const kpi = data.kpis.find((item) => item.id === id)
        if (!kpi) return
        kpi.value = value
        if (subtitle) kpi.subtitle = subtitle
      }
      setKpi('present-today', today.stats.present, 'Present today')
      setKpi('absent-today', today.stats.absent, 'Absent today')
      setKpi('on-leave', today.stats.onLeave, 'Today')
      setKpi('late-today', today.stats.late, 'Needs attention')

      data.attendanceOverview = [
        { status: 'present', label: 'Present', count: today.stats.present },
        { status: 'absent', label: 'Absent', count: today.stats.absent },
        { status: 'late', label: 'Late', count: today.stats.late },
        { status: 'on_leave', label: 'On Leave', count: today.stats.onLeave },
      ]

      data.todayAttendance = today.rows
        .filter((row) => row.status !== 'not_marked' && row.status !== 'week_off' && row.status !== 'holiday')
        .slice(0, 8)
        .map((row) => ({
          id: row.employeeId,
          employeeName: row.fullName,
          employeeId: row.employeeCode,
          checkIn: row.attendance?.checkIn
            ? format(new Date(row.attendance.checkIn), 'hh:mm a')
            : undefined,
          checkOut: row.attendance?.checkOut
            ? format(new Date(row.attendance.checkOut), 'hh:mm a')
            : undefined,
          status:
            row.status === 'half_day'
              ? 'present'
              : (row.status as 'present' | 'absent' | 'late' | 'on_leave'),
        }))

      data.leaveSummary = {
        ...data.leaveSummary,
        onLeaveToday: today.stats.onLeave,
      }
    } catch {
      // Keep mock attendance values if attendance service is unavailable.
    }

    return data
  },

  async getEmployeeDashboard(user) {
    await delay()
    const data = structuredClone(mockEmployeeDashboard)
    if (!user) return data

    try {
      const employeeId = await attendanceService.resolveLinkedEmployeeId(user)
      if (!employeeId) return data
      const todayKey = attendanceService.getSettingsToday()
      const monthKey = todayKey.slice(0, 7)
      const page = await attendanceService.getEmployeeAttendancePage(employeeId, monthKey)
      const todayRecord = page.records.find((item) => item.date === todayKey)
      const rawStatus = todayRecord?.status
      const mappedStatus: EmployeeDashboardData['attendanceToday']['status'] =
        rawStatus === 'present' || rawStatus === 'late' || rawStatus === 'absent' || rawStatus === 'on_leave'
          ? rawStatus
          : rawStatus === 'half_day'
            ? 'present'
            : 'not_checked_in'
      data.attendanceToday = {
        status: mappedStatus,
        checkIn: todayRecord?.checkIn
          ? format(new Date(todayRecord.checkIn), 'hh:mm a')
          : undefined,
        checkOut: todayRecord?.checkOut
          ? format(new Date(todayRecord.checkOut), 'hh:mm a')
          : undefined,
      }
      data.monthlyAttendance = {
        present: page.stats.presentDays,
        absent: page.stats.absentDays,
        late: page.stats.lateDays,
        leave: page.stats.leaveDays,
      }
    } catch {
      // Keep mock employee attendance if service unavailable.
    }

    return data
  },
}
