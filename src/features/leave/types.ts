import type { EmploymentType, Gender } from '@/features/employees/types'
import type { StatusTone } from '@/components/ui/StatusBadge'

export type LeaveRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn'

export type LeaveTypeStatus = 'active' | 'inactive'

export type LeaveCategory =
  | 'casual'
  | 'sick'
  | 'earned'
  | 'unpaid'
  | 'maternity'
  | 'paternity'
  | 'other'

export type HalfDayType = 'first_half' | 'second_half'

export type DayPortion = 'full_day' | 'half_day'

export type ApplicableGender = Gender | 'all'

export type ApplicableEmploymentType = EmploymentType | 'all'

export interface LeaveType {
  id: string
  code: string
  name: string
  description?: string
  category: LeaveCategory
  paid: boolean
  annualAllocation: number
  carryForwardAllowed: boolean
  maxCarryForwardDays: number
  requiresApproval: boolean
  requiresDocument: boolean
  /** When duration exceeds this many days, document is required (sick leave). */
  documentRequiredAfterDays?: number
  minimumNoticeDays: number
  maximumConsecutiveDays: number
  applicableGender: ApplicableGender
  applicableEmploymentTypes: ApplicableEmploymentType[]
  status: LeaveTypeStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface LeaveTypeFormValues {
  name: string
  code: string
  description: string
  category: LeaveCategory
  paid: boolean
  annualAllocation: number
  carryForwardAllowed: boolean
  maxCarryForwardDays: number
  requiresApproval: boolean
  requiresDocument: boolean
  documentRequiredAfterDays?: number
  minimumNoticeDays: number
  maximumConsecutiveDays: number
  applicableGender: ApplicableGender
  applicableEmploymentTypes: ApplicableEmploymentType[]
  status: LeaveTypeStatus
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveTypeId: string
  year: number
  openingBalance: number
  allocated: number
  carryForward: number
  used: number
  pending: number
  available: number
  adjustment: number
  updatedAt: string
  updatedBy?: string
}

export interface LeaveBalanceAdjustment {
  id: string
  employeeId: string
  leaveTypeId: string
  year: number
  oldBalance: number
  adjustment: number
  newBalance: number
  reason: string
  adjustedBy: string
  adjustedAt: string
}

export interface LeaveAttachment {
  name: string
  size: number
  fileType: string
  /** Mock object URL / data reference — no cloud storage in Module 8. */
  dataUrl?: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  duration: number
  isHalfDay: boolean
  halfDayType?: HalfDayType
  reason: string
  attachment?: LeaveAttachment
  status: LeaveRequestStatus
  appliedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  withdrawnAt?: string
  comments?: string
  /** Working dates covered (excluding weekends/holidays when policy excludes them). */
  workingDates: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface LeaveRequestFormValues {
  employeeId?: string
  leaveTypeId: string
  startDate: string
  endDate: string
  dayPortion: DayPortion
  halfDayType?: HalfDayType
  reason: string
  attachment?: LeaveAttachment | null
}

export interface LeaveAuditEvent {
  id: string
  action:
    | 'submitted'
    | 'edited'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'withdrawn'
    | 'balance_adjusted'
    | 'type_created'
    | 'type_updated'
    | 'type_deactivated'
    | 'type_activated'
    | 'type_deleted'
  employeeId?: string
  requestId?: string
  leaveTypeId?: string
  balanceId?: string
  user: string
  dateTime: string
  previousValue?: string
  newValue?: string
  reason?: string
}

export interface LeaveRequestFilters {
  search?: string
  employeeId?: string
  leaveTypeId?: string
  status?: LeaveRequestStatus | ''
  departmentId?: string
  startDate?: string
  endDate?: string
  year?: number
}

export interface LeaveBalanceFilters {
  year?: number
  employeeId?: string
  departmentId?: string
  leaveTypeId?: string
  search?: string
}

export interface LeaveCalendarFilters {
  month: string // yyyy-MM
  employeeId?: string
  departmentId?: string
  status?: LeaveRequestStatus | ''
  /** When true (default for employees), only own leave unless manage permission. */
  selfOnly?: boolean
}

export interface LeaveRequestListItem {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentId: string
  departmentName: string
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeCode: string
  paid: boolean
  startDate: string
  endDate: string
  duration: number
  isHalfDay: boolean
  halfDayType?: HalfDayType
  status: LeaveRequestStatus
  appliedAt: string
  reason: string
}

export interface LeaveBalanceListItem {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentId: string
  departmentName: string
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeCode: string
  year: number
  openingBalance: number
  allocated: number
  carryForward: number
  used: number
  pending: number
  adjustment: number
  available: number
}

export interface LeaveRequestDetail extends LeaveRequestListItem {
  attachment?: LeaveAttachment
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  withdrawnAt?: string
  comments?: string
  workingDates: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  balance?: LeaveBalance
}

export interface LeaveOverviewStats {
  totalRequests: number
  pending: number
  approved: number
  rejected: number
  cancelled: number
  onLeaveToday: number
  availableLeave?: number
  approvedThisMonth?: number
  upcomingCount?: number
}

export interface UpcomingLeaveItem {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  leaveTypeName: string
  startDate: string
  endDate: string
  duration: number
  status: LeaveRequestStatus
}

export interface OnLeaveTodayItem {
  id: string
  employeeId: string
  employeeName: string
  departmentName: string
  leaveTypeName: string
  startDate: string
  endDate: string
  status: LeaveRequestStatus
}

export interface LeaveCalendarDayEntry {
  requestId: string
  employeeId: string
  employeeName: string
  leaveTypeCode: string
  leaveTypeName: string
  status: LeaveRequestStatus
  isHalfDay: boolean
}

export interface LeaveCalendarDay {
  date: string
  entries: LeaveCalendarDayEntry[]
}

export interface LeavePolicyConfig {
  excludeWeekends: boolean
  excludeHolidays: boolean
  allowHalfDay: boolean
  allowNegativeBalanceForPaid: boolean
  allowCancelApprovedFuture: boolean
  countWeekendsAsLeave: boolean
  countHolidaysAsLeave: boolean
}

export interface PaginatedLeaveRequests {
  data: LeaveRequestListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginatedLeaveBalances {
  data: LeaveBalanceListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type LeaveStatusTone = Extract<
  StatusTone,
  'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn' | 'active' | 'inactive'
>

export interface PayrollLeaveSummary {
  employeeId: string
  year: number
  month: string
  paidLeaveDays: number
  unpaidLeaveDays: number
  leaveWithoutPayDays: number
  approvedLeaveDays: number
}
