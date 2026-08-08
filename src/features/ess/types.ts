import type {
  AttendanceCorrection,
  AttendanceRecord,
  AttendanceStatus,
  CalendarDayAttendance,
  EmployeeAttendanceStats,
} from '@/features/attendance/types'
import type { Employee } from '@/features/employees/types'
import type {
  LeaveBalance,
  LeaveRequestDetail,
  LeaveRequestFormValues,
  LeaveRequestListItem,
} from '@/features/leave/types'
import type { Payslip } from '@/features/payslip/types'
import type { EmployeeSalary } from '@/features/salary/types'

export type EssRequestType = 'attendance_correction' | 'profile_change' | 'leave' | 'document' | 'other'
export type EssRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn'
export type EssNotificationType = 'leave' | 'payslip' | 'attendance' | 'hr' | 'profile' | 'system'
export type EmployeeDocumentCategory = 'employment' | 'identity' | 'salary' | 'policy' | 'other'

export interface EssDashboardData {
  welcomeName: string
  photo?: string
  employeeCode: string
  department: string
  designation: string
  joiningDate: string
  kpis: Array<{
    id: string
    label: string
    value: string
    hint?: string
  }>
  todayAttendance?: AttendanceRecord
  leaveSummary: {
    available: number
    used: number
    pending: number
  }
  attendanceMonthSummary: EmployeeAttendanceStats
  recentActivity: Array<{
    id: string
    title: string
    description: string
    date: string
    type: EssRequestType | EssNotificationType
  }>
  quickActions: Array<{
    id: string
    label: string
    path: string
    description: string
  }>
}

export interface EssEditableProfile {
  personalEmail?: string
  phone: string
  alternatePhone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
  emergencyName?: string
  emergencyRelationship?: string
  emergencyPhone?: string
  emergencyAlternatePhone?: string
  emergencyAddress?: string
}

export interface ProfileChangeRequest {
  id: string
  employeeId: string
  field: string
  currentValue?: string
  requestedValue: string
  reason: string
  status: EssRequestStatus
  requestedAt: string
  requestedBy: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComment?: string
}

export interface EssRequest {
  id: string
  type: EssRequestType
  title: string
  description: string
  status: EssRequestStatus
  createdAt: string
  href: string
  sourceId: string
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  title: string
  description?: string
  category: EmployeeDocumentCategory
  fileName: string
  fileType: string
  issuedAt: string
  expiresAt?: string
  href?: string
}

export interface EssNotification {
  id: string
  employeeId: string
  title: string
  message: string
  type: EssNotificationType
  isRead: boolean
  createdAt: string
  href?: string
}

export interface EssAccountPreferences {
  employeeId: string
  emailNotifications: boolean
  payslipAlerts: boolean
  leaveAlerts: boolean
  attendanceReminders: boolean
  theme: 'system' | 'light' | 'dark'
}

export interface EssProfileData {
  employee: Employee
  editable: EssEditableProfile
  completeness: number
  changeRequests: ProfileChangeRequest[]
}

export interface EssAttendanceFilters {
  month?: string
  year?: number
  status?: AttendanceStatus | ''
}

export interface EssAttendanceData {
  employee: Employee
  monthKey: string
  records: AttendanceRecord[]
  stats: EmployeeAttendanceStats
  corrections: AttendanceCorrection[]
}

export interface EssLeaveData {
  balances: LeaveBalance[]
  history: LeaveRequestListItem[]
}

export interface EssSalaryData {
  current: EmployeeSalary | null
  history: EmployeeSalary[]
}

export type EssLeaveApplyValues = LeaveRequestFormValues
export type EssLeaveDetails = LeaveRequestDetail
export type EssPayslipDetails = Payslip
export type EssAttendanceCalendar = CalendarDayAttendance[]
