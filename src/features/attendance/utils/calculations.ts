import {
  addDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isValid,
  parse,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { attendanceSettings } from '../settings'
import type {
  AttendanceRecord,
  AttendanceStatus,
  EmployeeAttendanceStats,
  Holiday,
} from '../types'

export function toDateKey(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

export function combineDateAndTime(dateKey: string, timeHHmm: string): Date {
  return parse(`${dateKey} ${timeHHmm}`, 'yyyy-MM-dd HH:mm', new Date())
}

export function formatWorkDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0h 0m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

export function calculateWorkMinutes(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0
  const start = parseISO(checkIn)
  const end = parseISO(checkOut)
  if (!isValid(start) || !isValid(end)) return 0
  return Math.max(0, differenceInMinutes(end, start))
}

export function calculateLateMinutes(checkIn: string | undefined, dateKey: string): number {
  if (!checkIn) return 0
  const checkInDate = parseISO(checkIn)
  if (!isValid(checkInDate)) return 0
  const threshold = combineDateAndTime(
    dateKey,
    attendanceSettings.standardStartTime,
  )
  threshold.setMinutes(threshold.getMinutes() + attendanceSettings.gracePeriodMinutes)
  const late = differenceInMinutes(checkInDate, threshold)
  return late > 0 ? late : 0
}

export function calculateEarlyLeaveMinutes(
  checkOut: string | undefined,
  dateKey: string,
): number {
  if (!checkOut) return 0
  const checkOutDate = parseISO(checkOut)
  if (!isValid(checkOutDate)) return 0
  const end = combineDateAndTime(dateKey, attendanceSettings.standardEndTime)
  const early = differenceInMinutes(end, checkOutDate)
  return early > 0 ? early : 0
}

export function deriveStatusFromCheckIn(
  checkInIso: string,
  dateKey: string,
): Extract<AttendanceStatus, 'present' | 'late'> {
  return calculateLateMinutes(checkInIso, dateKey) > 0 ? 'late' : 'present'
}

export function maybeDeriveHalfDay(
  status: AttendanceStatus,
  workMinutes: number,
): AttendanceStatus {
  if (status !== 'present' && status !== 'late') return status
  const thresholdMinutes = attendanceSettings.halfDayThresholdHours * 60
  if (workMinutes > 0 && workMinutes < thresholdMinutes) return 'half_day'
  return status
}

export function calculateOvertimeMinutes(workMinutes: number): number {
  const fullDayMinutes = attendanceSettings.fullDayHours * 60
  return Math.max(0, workMinutes - fullDayMinutes)
}

export function isWeekOff(dateKey: string): boolean {
  const date = parseISO(dateKey)
  return attendanceSettings.weeklyOffDays.includes(getDay(date))
}

export function findHoliday(dateKey: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((item) => item.date === dateKey)
}

export function attendanceDayValue(status: AttendanceStatus): number {
  if (status === 'present' || status === 'late') return 1
  if (status === 'half_day') return attendanceSettings.halfDayAttendanceValue
  return 0
}

export function calculateAttendancePercentage(
  presentEquivalentDays: number,
  applicableWorkingDays: number,
): number {
  if (applicableWorkingDays <= 0) return 0
  return Math.round((presentEquivalentDays / applicableWorkingDays) * 1000) / 10
}

export function getMonthDateKeys(monthKey: string): string[] {
  const start = startOfMonth(parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date()))
  const end = endOfMonth(start)
  return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'))
}

export function calculateWorkingDaysInMonth(
  monthKey: string,
  holidays: Holiday[],
  leaveDates: Set<string> = new Set(),
): {
  calendarDays: number
  weekOffDays: number
  holidayDays: number
  leaveDays: number
  applicableWorkingDays: number
  dateKeys: string[]
} {
  const dateKeys = getMonthDateKeys(monthKey)
  let weekOffDays = 0
  let holidayDays = 0
  let leaveDays = 0
  let applicableWorkingDays = 0

  dateKeys.forEach((dateKey) => {
    if (isWeekOff(dateKey)) {
      weekOffDays += 1
      return
    }
    if (findHoliday(dateKey, holidays)) {
      holidayDays += 1
      return
    }
    if (leaveDates.has(dateKey)) {
      leaveDays += 1
      return
    }
    applicableWorkingDays += 1
  })

  return {
    calendarDays: dateKeys.length,
    weekOffDays,
    holidayDays,
    leaveDays,
    applicableWorkingDays,
    dateKeys,
  }
}

export function buildEmployeeMonthStats(
  records: AttendanceRecord[],
  monthKey: string,
  holidays: Holiday[],
): EmployeeAttendanceStats {
  const working = calculateWorkingDaysInMonth(monthKey, holidays)
  let presentDays = 0
  let absentDays = 0
  let lateDays = 0
  let halfDays = 0
  let leaveDays = 0
  let holidayDays = 0
  let weekOffDays = 0
  let totalWorkMinutes = 0
  let presentEquivalent = 0

  const byDate = new Map(records.map((item) => [item.date, item]))

  working.dateKeys.forEach((dateKey) => {
    const record = byDate.get(dateKey)
    if (!record) {
      if (isWeekOff(dateKey)) weekOffDays += 1
      else if (findHoliday(dateKey, holidays)) holidayDays += 1
      return
    }
    totalWorkMinutes += record.workMinutes
    switch (record.status) {
      case 'present':
        presentDays += 1
        presentEquivalent += 1
        break
      case 'late':
        lateDays += 1
        presentEquivalent += 1
        break
      case 'half_day':
        halfDays += 1
        presentEquivalent += attendanceSettings.halfDayAttendanceValue
        break
      case 'absent':
        absentDays += 1
        break
      case 'on_leave':
        leaveDays += 1
        break
      case 'holiday':
        holidayDays += 1
        break
      case 'week_off':
        weekOffDays += 1
        break
      default:
        break
    }
  })

  const workedDayCount = presentDays + lateDays + halfDays
  return {
    presentDays,
    absentDays,
    lateDays,
    halfDays,
    leaveDays,
    holidayDays,
    weekOffDays,
    averageWorkMinutes: workedDayCount > 0 ? Math.round(totalWorkMinutes / workedDayCount) : 0,
    attendancePercentage: calculateAttendancePercentage(
      presentEquivalent,
      working.applicableWorkingDays,
    ),
  }
}

export function enrichAttendanceMetrics(
  partial: Pick<AttendanceRecord, 'date' | 'checkIn' | 'checkOut' | 'status'>,
): Pick<
  AttendanceRecord,
  'workMinutes' | 'overtimeMinutes' | 'lateMinutes' | 'earlyLeaveMinutes' | 'status'
> {
  const workMinutes = calculateWorkMinutes(partial.checkIn, partial.checkOut)
  let status = partial.status
  if (partial.checkIn && (status === 'present' || status === 'late')) {
    status = deriveStatusFromCheckIn(partial.checkIn, partial.date)
  }
  if (partial.checkOut) {
    status = maybeDeriveHalfDay(status, workMinutes)
  }
  return {
    status,
    workMinutes,
    overtimeMinutes: calculateOvertimeMinutes(workMinutes),
    lateMinutes: calculateLateMinutes(partial.checkIn, partial.date),
    earlyLeaveMinutes: calculateEarlyLeaveMinutes(partial.checkOut, partial.date),
  }
}

export function shiftMonth(monthKey: string, delta: number): string {
  const base = parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date())
  return format(addDays(startOfMonth(base), delta * 32), 'yyyy-MM')
}
