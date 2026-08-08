import type { StatusTone } from '@/components/ui/StatusBadge'

export interface DashboardKpi {
  id: string
  label: string
  value: number | string
  subtitle: string
  icon: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  percentage?: number
}

export interface AttendanceOverviewItem {
  status: 'present' | 'absent' | 'late' | 'on_leave'
  label: string
  count: number
}

export interface AttendanceTrendPoint {
  date: string
  label: string
  present: number
  absent: number
  late: number
  leave: number
}

export interface DepartmentDistributionItem {
  id: string
  name: string
  employeeCount: number
  percentage: number
}

export interface LeaveSummary {
  pending: number
  approved: number
  rejected: number
  onLeaveToday: number
}

export interface RecentLeaveRequest {
  id: string
  employeeName: string
  employeeId: string
  avatarUrl?: string
  leaveType: string
  startDate: string
  endDate: string
  durationDays: number
  status: Extract<StatusTone, 'pending' | 'approved' | 'rejected'>
}

export interface RecentEmployee {
  id: string
  employeeId: string
  name: string
  department: string
  joiningDate: string
  status: 'active' | 'inactive'
  avatarUrl?: string
}

export interface TodayAttendanceRow {
  id: string
  employeeName: string
  employeeId: string
  checkIn?: string
  checkOut?: string
  status: Extract<StatusTone, 'present' | 'absent' | 'late'> | 'on_leave'
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  path: string
}

export interface PayrollSummary {
  periodLabel: string
  totalPayroll: number
  paidAmount: number
  pendingAmount: number
  employeesProcessed: number
  totalEmployees: number
  status: 'draft' | 'processing' | 'approved' | 'paid'
}

export interface UpcomingEvent {
  id: string
  personName: string
  type: 'birthday' | 'anniversary' | 'joining'
  date: string
  label: string
}

export interface ActivityItem {
  id: string
  description: string
  actorName: string
  createdAt: string
  icon: string
}

export interface NotificationPreviewItem {
  id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
}

export interface AdminDashboardData {
  generatedAt: string
  kpis: DashboardKpi[]
  attendanceOverview: AttendanceOverviewItem[]
  attendanceTrend: AttendanceTrendPoint[]
  departmentDistribution: DepartmentDistributionItem[]
  leaveSummary: LeaveSummary
  recentLeaveRequests: RecentLeaveRequest[]
  recentEmployees: RecentEmployee[]
  todayAttendance: TodayAttendanceRow[]
  quickActions: QuickAction[]
  payrollSummary: PayrollSummary
  upcomingEvents: UpcomingEvent[]
  recentActivity: ActivityItem[]
  notifications: NotificationPreviewItem[]
}

export interface EmployeeLeaveBalance {
  type: string
  remaining: number
  total: number
}

export interface EmployeeAttendanceToday {
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'not_checked_in'
  checkIn?: string
  checkOut?: string
}

export interface EmployeeMonthlyAttendance {
  present: number
  absent: number
  late: number
  leave: number
}

export interface EmployeePayslipPreview {
  periodLabel: string
  netSalary: number
  status: 'draft' | 'processing' | 'paid'
  issuedAt: string
}

export interface EmployeeDashboardData {
  generatedAt: string
  attendanceToday: EmployeeAttendanceToday
  monthlyAttendance: EmployeeMonthlyAttendance
  leaveBalances: EmployeeLeaveBalance[]
  pendingLeaveCount: number
  latestPayslip: EmployeePayslipPreview | null
  quickActions: QuickAction[]
  upcomingEvents: UpcomingEvent[]
  notifications: NotificationPreviewItem[]
  recentActivity: ActivityItem[]
}
