import type { AttendanceSource, AttendanceStatus, CorrectionRequestStatus, HolidayType } from './types'

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  half_day: 'Half Day',
  on_leave: 'On Leave',
  holiday: 'Holiday',
  week_off: 'Week Off',
}

export const ATTENDANCE_STATUS_OPTIONS = (
  Object.entries(ATTENDANCE_STATUS_LABELS) as Array<[AttendanceStatus, string]>
).map(([value, label]) => ({ value, label }))

export const TODAY_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...ATTENDANCE_STATUS_OPTIONS,
  { value: 'not_marked', label: 'Not Marked' },
]

export const ATTENDANCE_SOURCE_LABELS: Record<AttendanceSource, string> = {
  manual: 'Manual',
  self_check_in: 'Self Check-In',
  admin_entry: 'Admin Entry',
  correction: 'Correction',
  import: 'Import',
  leave: 'Leave',
}

export const CORRECTION_STATUS_LABELS: Record<CorrectionRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const CORRECTION_STATUS_OPTIONS = (
  Object.entries(CORRECTION_STATUS_LABELS) as Array<[CorrectionRequestStatus, string]>
).map(([value, label]) => ({ value, label }))

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  public: 'Public Holiday',
  company: 'Company Holiday',
  optional: 'Optional Holiday',
}

export const STATUSES_REQUIRING_TIMES: AttendanceStatus[] = ['present', 'late', 'half_day']
export const STATUSES_WITHOUT_TIMES: AttendanceStatus[] = [
  'absent',
  'on_leave',
  'holiday',
  'week_off',
]
