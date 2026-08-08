import {
  addDays,
  eachDayOfInterval,
  format,
  getDay,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { attendanceSettings } from '@/features/attendance/settings'
import type { Holiday } from '@/features/attendance/types'
import { leavePolicy } from '../policy'
import type {
  DayPortion,
  LeaveBalance,
  LeavePolicyConfig,
  LeaveRequest,
  LeaveType,
} from '../types'
import { ACTIVE_LEAVE_OVERLAP_STATUSES } from '../constants'

export function toDateKey(value: Date | string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey)
}

export function isWeekend(dateKey: string, weeklyOffDays = attendanceSettings.weeklyOffDays): boolean {
  const day = getDay(parseDateKey(dateKey))
  return weeklyOffDays.includes(day)
}

export function isHolidayDate(dateKey: string, holidays: Holiday[]): boolean {
  return holidays.some((item) => item.date === dateKey)
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)
  if (!isValid(start) || !isValid(end) || isAfter(start, end)) return []
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

/**
 * Working days in a leave range (excludes weekends/holidays per policy).
 */
export function calculateWorkingLeaveDays(
  startDate: string,
  endDate: string,
  holidays: Holiday[],
  policy: LeavePolicyConfig = leavePolicy,
): string[] {
  const dates = getDatesInRange(startDate, endDate)
  return dates.filter((dateKey) => {
    if (policy.excludeWeekends && isWeekend(dateKey) && !policy.countWeekendsAsLeave) {
      return false
    }
    if (policy.excludeHolidays && isHolidayDate(dateKey, holidays) && !policy.countHolidaysAsLeave) {
      return false
    }
    return true
  })
}

export function calculateLeaveDuration(
  startDate: string,
  endDate: string,
  dayPortion: DayPortion,
  holidays: Holiday[],
  policy: LeavePolicyConfig = leavePolicy,
): { duration: number; workingDates: string[] } {
  const workingDates = calculateWorkingLeaveDays(startDate, endDate, holidays, policy)
  if (workingDates.length === 0) {
    return { duration: 0, workingDates: [] }
  }
  if (dayPortion === 'half_day') {
    return { duration: 0.5, workingDates: workingDates.slice(0, 1) }
  }
  return { duration: workingDates.length, workingDates }
}

export function computeAvailableBalance(parts: {
  openingBalance: number
  allocated: number
  carryForward: number
  adjustment: number
  used: number
  pending: number
}): number {
  return (
    parts.openingBalance +
    parts.allocated +
    parts.carryForward +
    parts.adjustment -
    parts.used -
    parts.pending
  )
}

export function calculateLeaveBalance(balance: LeaveBalance): number {
  return computeAvailableBalance(balance)
}

export function calculateRemainingBalance(available: number, requested: number): number {
  return available - requested
}

export function calculateCarryForward(
  unused: number,
  maxCarryForwardDays: number,
  carryForwardAllowed: boolean,
): number {
  if (!carryForwardAllowed) return 0
  return Math.max(0, Math.min(unused, maxCarryForwardDays))
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export function validateLeaveOverlap(
  startDate: string,
  endDate: string,
  existing: LeaveRequest[],
  excludeRequestId?: string,
): { valid: boolean; message?: string } {
  const conflict = existing.find((item) => {
    if (excludeRequestId && item.id === excludeRequestId) return false
    if (!ACTIVE_LEAVE_OVERLAP_STATUSES.includes(item.status)) return false
    return rangesOverlap(startDate, endDate, item.startDate, item.endDate)
  })
  if (conflict) {
    return {
      valid: false,
      message: 'You already have a leave request covering part of this period.',
    }
  }
  return { valid: true }
}

export function validateLeavePolicy(input: {
  leaveType: LeaveType
  startDate: string
  endDate: string
  duration: number
  today: string
  hasAttachment: boolean
  availableBalance: number
  policy?: LeavePolicyConfig
}): { valid: boolean; messages: string[] } {
  const policy = input.policy ?? leavePolicy
  const messages: string[] = []

  if (input.leaveType.status !== 'active' || input.leaveType.isDeleted) {
    messages.push('Selected leave type is not active.')
  }

  const start = parseDateKey(input.startDate)
  const end = parseDateKey(input.endDate)
  if (!isValid(start) || !isValid(end)) {
    messages.push('Start and end dates must be valid.')
  } else if (isAfter(start, end)) {
    messages.push('End date cannot be before start date.')
  }

  if (input.duration <= 0) {
    messages.push('Requested duration must be greater than zero (working days only).')
  }

  if (
    input.leaveType.maximumConsecutiveDays > 0 &&
    input.duration > input.leaveType.maximumConsecutiveDays
  ) {
    messages.push(
      `Maximum consecutive days for this leave type is ${input.leaveType.maximumConsecutiveDays}.`,
    )
  }

  const today = startOfDay(parseDateKey(input.today))
  if (isValid(start)) {
    const noticeDeadline = startOfDay(addDays(today, input.leaveType.minimumNoticeDays))
    if (isBefore(start, noticeDeadline) && input.leaveType.minimumNoticeDays > 0) {
      messages.push(
        `Minimum notice period is ${input.leaveType.minimumNoticeDays} day(s). Please choose a later start date.`,
      )
    }
  }

  const requiresDoc =
    input.leaveType.requiresDocument ||
    (typeof input.leaveType.documentRequiredAfterDays === 'number' &&
      input.duration >= input.leaveType.documentRequiredAfterDays)

  if (requiresDoc && !input.hasAttachment) {
    messages.push('A supporting document is required for this leave request.')
  }

  if (input.leaveType.paid && !policy.allowNegativeBalanceForPaid) {
    if (input.availableBalance < input.duration) {
      messages.push('Insufficient leave balance for this request.')
    }
  }

  return { valid: messages.length === 0, messages }
}

export function refreshBalanceAvailable(balance: LeaveBalance): LeaveBalance {
  return {
    ...balance,
    available: computeAvailableBalance(balance),
    updatedAt: new Date().toISOString(),
  }
}
