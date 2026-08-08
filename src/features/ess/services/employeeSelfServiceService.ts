import { format, parseISO } from 'date-fns'
import type { User } from '@/types'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import type { AttendanceStatus } from '@/features/attendance/types'
import { employeeService } from '@/features/employees/services/employeeService'
import type { Employee } from '@/features/employees/types'
import { leaveService } from '@/features/leave/services/leaveService'
import { payslipService } from '@/features/payslip/services/payslipService'
import { employeeSalaryService } from '@/features/salary/services/employeeSalaryService'
import { authService, type ChangePasswordInput } from '@/services/auth'
import { calculateProfileCompleteness } from '../utils/profileCompleteness'
import type {
  EssAccountPreferences,
  EssAttendanceFilters,
  EssDashboardData,
  EssEditableProfile,
  EssLeaveApplyValues,
  EssRequest,
} from '../types'
import { essDocumentService } from './essDocumentService'
import { essNotificationService } from './essNotificationService'
import { EssServiceError } from './errors'
import { profileChangeRequestService } from './profileChangeRequestService'

const preferencesDb = new Map<string, EssAccountPreferences>()

function actorName(user: User): string {
  return user.name || user.email || 'Employee'
}

function currentMonthKey(): string {
  return attendanceService.getSettingsToday().slice(0, 7)
}

function defaultPreferences(employeeId: string): EssAccountPreferences {
  return {
    employeeId,
    emailNotifications: true,
    payslipAlerts: true,
    leaveAlerts: true,
    attendanceReminders: true,
    theme: 'system',
  }
}

function toEditableProfile(employee: Employee): EssEditableProfile {
  const emergency = employee.emergencyContacts[0]
  return {
    personalEmail: employee.personalEmail ?? '',
    phone: employee.phone,
    alternatePhone: employee.alternatePhone ?? '',
    addressLine1: employee.address.line1,
    addressLine2: employee.address.line2 ?? '',
    city: employee.address.city,
    state: employee.address.state,
    country: employee.address.country,
    postalCode: employee.address.postalCode,
    emergencyName: emergency?.name ?? '',
    emergencyRelationship: emergency?.relationship ?? '',
    emergencyPhone: emergency?.phone ?? '',
    emergencyAlternatePhone: emergency?.alternatePhone ?? '',
    emergencyAddress: emergency?.address ?? '',
  }
}

function sumLeaveSummary(balances: Array<{ available: number; used: number; pending: number }>) {
  return balances.reduce(
    (acc, item) => ({
      available: acc.available + item.available,
      used: acc.used + item.used,
      pending: acc.pending + item.pending,
    }),
    { available: 0, used: 0, pending: 0 },
  )
}

function statusToRequestStatus(status: string): EssRequest['status'] {
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'withdrawn') return 'withdrawn'
  if (status === 'under_review' || status === 'processing') return 'under_review'
  return 'pending'
}

export async function requireCurrentEmployee(user?: User | null): Promise<Employee> {
  if (!user) throw new EssServiceError('UNAUTHORIZED', 'Sign in is required for self-service.')
  const employeeId = await attendanceService.resolveLinkedEmployeeId(user)
  if (!employeeId) {
    throw new EssServiceError('UNAUTHORIZED', 'Your user account is not linked to an employee record.')
  }

  try {
    return await employeeService.getEmployeeById(employeeId)
  } catch {
    throw new EssServiceError('NOT_FOUND', 'Linked employee record was not found.')
  }
}

export const employeeSelfServiceService = {
  async getCurrentEmployee(user?: User | null): Promise<Employee> {
    return requireCurrentEmployee(user)
  },

  async getDashboard(user?: User | null): Promise<EssDashboardData> {
    const employee = await requireCurrentEmployee(user)
    const monthKey = currentMonthKey()
    const [
      departments,
      designations,
      attendancePage,
      today,
      leaveBalances,
      leaveHistory,
      salary,
      payslips,
      notifications,
      corrections,
    ] = await Promise.all([
      employeeService.getDepartments(),
      employeeService.getDesignations(),
      attendanceService.getEmployeeAttendancePage(employee.id, monthKey, {
        employeeId: employee.id,
        role: user?.role,
      }),
      attendanceService.getTodayAttendance({ employeeId: employee.id }),
      leaveService.getEmployeeLeaveBalances(employee.id),
      leaveService.getLeaveRequests({ employeeId: employee.id }, 1, 5),
      employeeSalaryService.getEmployeeSalary(employee.id),
      payslipService.getEmployeePayslips(employee.id),
      essNotificationService.getNotifications(employee.id),
      attendanceService.getCorrectionRequests({ employeeId: employee.id }),
    ])

    const leaveSummary = sumLeaveSummary(leaveBalances)
    const todayAttendance = today.rows.find((row) => row.employeeId === employee.id)?.attendance
    const unread = notifications.filter((item) => !item.isRead).length
    const recentActivity = [
      ...leaveHistory.data.map((item) => ({
        id: `leave-${item.id}`,
        title: `${item.leaveTypeName} leave ${item.status}`,
        description: `${item.startDate} to ${item.endDate}`,
        date: item.appliedAt,
        type: 'leave' as const,
      })),
      ...corrections.slice(0, 3).map((item) => ({
        id: `attendance-${item.id}`,
        title: `Attendance correction ${item.status}`,
        description: `${item.date} requested as ${item.requestedStatus.replaceAll('_', ' ')}`,
        date: item.requestedAt,
        type: 'attendance_correction' as const,
      })),
      ...notifications.slice(0, 3).map((item) => ({
        id: `notification-${item.id}`,
        title: item.title,
        description: item.message,
        date: item.createdAt,
        type: item.type,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)

    return {
      welcomeName: employee.firstName || employee.fullName,
      photo: employee.profilePhoto,
      employeeCode: employee.employeeCode,
      department: departments.find((item) => item.id === employee.departmentId)?.name ?? employee.departmentId,
      designation:
        designations.find((item) => item.id === employee.designationId)?.name ?? employee.designationId,
      joiningDate: employee.joiningDate,
      kpis: [
        {
          id: 'attendance',
          label: 'Attendance',
          value: `${attendancePage.stats.attendancePercentage}%`,
          hint: `${attendancePage.stats.presentDays} present days this month`,
        },
        {
          id: 'leave',
          label: 'Leave Available',
          value: String(leaveSummary.available),
          hint: `${leaveSummary.pending} pending days`,
        },
        {
          id: 'salary',
          label: 'Monthly Net',
          value: salary ? String(salary.monthlyNet) : '0',
          hint: salary?.currency,
        },
        {
          id: 'payslips',
          label: 'Payslips',
          value: String(payslips.length),
          hint: unread ? `${unread} unread notifications` : 'All caught up',
        },
      ],
      todayAttendance,
      leaveSummary,
      attendanceMonthSummary: attendancePage.stats,
      recentActivity,
      quickActions: [
        {
          id: 'apply-leave',
          label: 'Apply Leave',
          path: '/employee/leave/apply',
          description: 'Submit a leave request',
        },
        {
          id: 'attendance-correction',
          label: 'Correct Attendance',
          path: '/employee/attendance/calendar',
          description: 'Request correction for a date',
        },
        {
          id: 'view-payslips',
          label: 'View Payslips',
          path: '/employee/payslips',
          description: 'Open salary documents',
        },
        {
          id: 'update-profile',
          label: 'Update Profile',
          path: '/employee/profile',
          description: 'Maintain contact details',
        },
      ],
    }
  },

  async getProfile(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return {
      employee,
      editable: toEditableProfile(employee),
      completeness: calculateProfileCompleteness(employee),
      changeRequests: await profileChangeRequestService.getMyRequests(employee.id),
    }
  },

  async updateEditableProfile(user: User | null | undefined, data: EssEditableProfile): Promise<Employee> {
    const employee = await requireCurrentEmployee(user)
    return employeeService.updateOwnPersonalInfo(employee.id, data, actorName(user!))
  },

  async getProfileCompleteness(user?: User | null): Promise<number> {
    const employee = await requireCurrentEmployee(user)
    return calculateProfileCompleteness(employee)
  },

  async createProfileChangeRequest(
    user: User | null | undefined,
    data: { field: string; currentValue?: string; requestedValue: string; reason: string },
  ) {
    const employee = await requireCurrentEmployee(user)
    return profileChangeRequestService.createRequest(
      { employeeId: employee.id, ...data },
      actorName(user!),
    )
  },

  async getAttendance(user: User | null | undefined, filters: EssAttendanceFilters = {}) {
    const employee = await requireCurrentEmployee(user)
    const monthKey = filters.month || `${filters.year ?? new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const page = await attendanceService.getEmployeeAttendancePage(employee.id, monthKey, {
      employeeId: employee.id,
      role: user?.role,
    })
    const records = filters.status
      ? page.records.filter((item) => item.status === filters.status)
      : page.records
    const corrections = await attendanceService.getCorrectionRequests({ employeeId: employee.id })
    return { employee, monthKey, records, stats: page.stats, corrections }
  },

  async getAttendanceCalendar(user: User | null | undefined, monthKey: string) {
    const employee = await requireCurrentEmployee(user)
    return attendanceService.getCalendarAttendance(employee.id, monthKey, {
      employeeId: employee.id,
      role: user?.role,
    })
  },

  async getAttendanceDetails(user: User | null | undefined, date: string) {
    const employee = await requireCurrentEmployee(user)
    const records = await attendanceService.getAttendanceByEmployee(employee.id, date.slice(0, 7))
    return records.find((item) => item.date === date) ?? null
  },

  async createAttendanceCorrection(
    user: User | null | undefined,
    data: {
      date: string
      requestedStatus: AttendanceStatus
      requestedCheckIn?: string
      requestedCheckOut?: string
      reason: string
    },
  ) {
    const employee = await requireCurrentEmployee(user)
    return attendanceService.createCorrectionRequest(
      { ...data, employeeId: employee.id },
      actorName(user!),
    )
  },

  async getMyAttendanceCorrections(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return attendanceService.getCorrectionRequests({ employeeId: employee.id })
  },

  async getLeaveBalance(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return leaveService.getEmployeeLeaveBalances(employee.id)
  },

  async getLeaveHistory(user: User | null | undefined, filters = {}) {
    const employee = await requireCurrentEmployee(user)
    return leaveService.getLeaveRequests({ ...filters, employeeId: employee.id }, 1, 200)
  },

  async applyLeave(user: User | null | undefined, values: EssLeaveApplyValues) {
    const employee = await requireCurrentEmployee(user)
    return leaveService.createLeaveRequest(
      { ...values, employeeId: employee.id },
      actorName(user!),
      employee.id,
    )
  },

  async getLeaveDetails(user: User | null | undefined, id: string) {
    const employee = await requireCurrentEmployee(user)
    const request = await leaveService.getLeaveRequestById(id)
    if (request.employeeId !== employee.id) {
      throw new EssServiceError('UNAUTHORIZED', 'You can only view your own leave requests.')
    }
    return request
  },

  async cancelLeave(user: User | null | undefined, id: string, reason = 'Cancelled by employee') {
    const employee = await requireCurrentEmployee(user)
    const request = await leaveService.getLeaveRequestById(id)
    if (request.employeeId !== employee.id) {
      throw new EssServiceError('UNAUTHORIZED', 'You can only cancel your own leave requests.')
    }
    return leaveService.cancelLeaveRequest(id, reason, actorName(user!))
  },

  async getCurrentSalary(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return employeeSalaryService.getEmployeeSalary(employee.id)
  },

  async getSalaryHistory(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return employeeSalaryService.getSalaryHistory(employee.id)
  },

  async getPayslips(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return payslipService.getEmployeePayslips(employee.id)
  },

  async getPayslipById(user: User | null | undefined, id: string) {
    const employee = await requireCurrentEmployee(user)
    const payslip = await payslipService.getPayslipById(id)
    if (payslip.employeeId !== employee.id) {
      throw new EssServiceError('UNAUTHORIZED', 'You can only view your own payslips.')
    }
    return payslip
  },

  async getDocuments(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return essDocumentService.getDocuments(employee.id)
  },

  async getRequests(user?: User | null): Promise<EssRequest[]> {
    const employee = await requireCurrentEmployee(user)
    const [leaveRows, corrections, profileChanges] = await Promise.all([
      leaveService.getLeaveRequests({ employeeId: employee.id }, 1, 200),
      attendanceService.getCorrectionRequests({ employeeId: employee.id }),
      profileChangeRequestService.getMyRequests(employee.id),
    ])

    return [
      ...leaveRows.data.map((item) => ({
        id: `leave-${item.id}`,
        type: 'leave' as const,
        title: `${item.leaveTypeName} leave`,
        description: `${item.startDate} to ${item.endDate} (${item.duration} day${item.duration === 1 ? '' : 's'})`,
        status: statusToRequestStatus(item.status),
        createdAt: item.appliedAt,
        href: `/employee/leave/${item.id}`,
        sourceId: item.id,
      })),
      ...corrections.map((item) => ({
        id: `attendance-${item.id}`,
        type: 'attendance_correction' as const,
        title: `Attendance correction for ${format(parseISO(item.date), 'MMM d, yyyy')}`,
        description: `Requested ${item.requestedStatus.replaceAll('_', ' ')}`,
        status: statusToRequestStatus(item.status),
        createdAt: item.requestedAt,
        href: `/employee/requests/attendance-${item.id}`,
        sourceId: item.id,
      })),
      ...profileChanges.map((item) => ({
        id: `profile-${item.id}`,
        type: 'profile_change' as const,
        title: `Profile change: ${item.field}`,
        description: item.requestedValue,
        status: item.status,
        createdAt: item.requestedAt,
        href: `/employee/requests/profile-${item.id}`,
        sourceId: item.id,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getRequestById(user: User | null | undefined, id: string): Promise<EssRequest> {
    const requests = await this.getRequests(user)
    const request = requests.find((item) => item.id === id || item.sourceId === id)
    if (!request) throw new EssServiceError('NOT_FOUND', 'Request not found.')
    return request
  },

  async getNotifications(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return essNotificationService.getNotifications(employee.id)
  },

  async markNotificationAsRead(user: User | null | undefined, id: string) {
    const employee = await requireCurrentEmployee(user)
    return essNotificationService.markAsRead(employee.id, id)
  },

  async markAllNotificationsAsRead(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    return essNotificationService.markAllAsRead(employee.id)
  },

  async changePassword(_user: User | null | undefined, data: ChangePasswordInput) {
    return authService.changePassword(data)
  },

  async getPreferences(user?: User | null) {
    const employee = await requireCurrentEmployee(user)
    if (!preferencesDb.has(employee.id)) preferencesDb.set(employee.id, defaultPreferences(employee.id))
    return structuredClone(preferencesDb.get(employee.id)!)
  },

  async updatePreferences(user: User | null | undefined, data: Partial<EssAccountPreferences>) {
    const employee = await requireCurrentEmployee(user)
    const current = preferencesDb.get(employee.id) ?? defaultPreferences(employee.id)
    const next: EssAccountPreferences = { ...current, ...data, employeeId: employee.id }
    preferencesDb.set(employee.id, next)
    return structuredClone(next)
  },
}
