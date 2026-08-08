export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'week_off'

export type AttendanceSource =
  | 'manual'
  | 'self_check_in'
  | 'admin_entry'
  | 'correction'
  | 'import'
  | 'leave'

export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected'
export type HolidayType = 'public' | 'company' | 'optional'

export interface AttendanceSettings {
  standardStartTime: string // HH:mm
  standardEndTime: string // HH:mm
  gracePeriodMinutes: number
  halfDayThresholdHours: number
  fullDayHours: number
  weeklyOffDays: number[] // 0=Sun ... 6=Sat
  halfDayAttendanceValue: number
}

export interface Holiday {
  id: string
  name: string
  date: string // yyyy-MM-dd
  type: HolidayType
  description?: string
}

export interface AttendanceAuditEvent {
  id: string
  attendanceId: string
  employeeId: string
  date: string
  action: string
  oldValue?: string
  newValue?: string
  changedBy: string
  changedAt: string
  reason?: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string // yyyy-MM-dd
  checkIn?: string // ISO datetime
  checkOut?: string // ISO datetime
  status: AttendanceStatus
  workMinutes: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  remarks?: string
  source: AttendanceSource
  correctionStatus?: CorrectionRequestStatus
  correctedBy?: string
  correctedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface AttendanceCorrection {
  id: string
  attendanceId?: string
  employeeId: string
  date: string
  currentStatus?: AttendanceStatus
  currentCheckIn?: string
  currentCheckOut?: string
  requestedStatus: AttendanceStatus
  requestedCheckIn?: string
  requestedCheckOut?: string
  reason: string
  status: CorrectionRequestStatus
  requestedAt: string
  requestedBy: string
  reviewedBy?: string
  reviewedAt?: string
  reviewComment?: string
}

export interface AttendanceFormValues {
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: AttendanceStatus
  remarks?: string
}

export interface TodayAttendanceRow {
  employeeId: string
  employeeCode: string
  fullName: string
  email: string
  profilePhoto?: string
  departmentId: string
  departmentName: string
  designationId: string
  designationName: string
  attendance?: AttendanceRecord
  status: AttendanceStatus | 'not_marked'
}

export interface TodayAttendanceStats {
  totalEmployees: number
  present: number
  absent: number
  late: number
  halfDay: number
  onLeave: number
  notMarked: number
  holiday: number
  weekOff: number
}

export interface AttendanceSummaryRow {
  employeeId: string
  employeeCode: string
  fullName: string
  departmentName: string
  workingDays: number
  present: number
  absent: number
  late: number
  halfDay: number
  onLeave: number
  holiday: number
  weekOff: number
  totalWorkMinutes: number
  attendancePercentage: number
}

export interface EmployeeAttendanceStats {
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  leaveDays: number
  holidayDays: number
  weekOffDays: number
  averageWorkMinutes: number
  attendancePercentage: number
}

export interface AttendanceFilters {
  search?: string
  departmentId?: string
  designationId?: string
  status?: AttendanceStatus | 'not_marked' | ''
  date?: string
  employeeId?: string
  month?: string // yyyy-MM
}

export interface CorrectionFilters {
  search?: string
  status?: CorrectionRequestStatus | ''
  employeeId?: string
}

export interface CalendarDayAttendance {
  date: string
  status?: AttendanceStatus | 'not_marked'
  record?: AttendanceRecord
  isHoliday?: boolean
  holidayName?: string
  isWeekOff?: boolean
}
