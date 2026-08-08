import type { LeaveCategory, LeaveRequestStatus, LeaveTypeStatus } from './types'

export const LEAVE_REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  WITHDRAWN: 'withdrawn',
} as const satisfies Record<string, LeaveRequestStatus>

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  withdrawn: 'Withdrawn',
}

export const LEAVE_REQUEST_STATUS_OPTIONS: { value: LeaveRequestStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export const LEAVE_TYPE_STATUS_LABELS: Record<LeaveTypeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export const LEAVE_CATEGORY_LABELS: Record<LeaveCategory, string> = {
  casual: 'Casual',
  sick: 'Sick',
  earned: 'Earned / Annual',
  unpaid: 'Unpaid',
  maternity: 'Maternity',
  paternity: 'Paternity',
  other: 'Other',
}

export const LEAVE_CATEGORY_OPTIONS: { value: LeaveCategory; label: string }[] = (
  Object.keys(LEAVE_CATEGORY_LABELS) as LeaveCategory[]
).map((value) => ({ value, label: LEAVE_CATEGORY_LABELS[value] }))

export const HALF_DAY_TYPE_OPTIONS = [
  { value: 'first_half', label: 'First Half' },
  { value: 'second_half', label: 'Second Half' },
] as const

export const DAY_PORTION_OPTIONS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day', label: 'Half Day' },
] as const

export const ACTIVE_LEAVE_OVERLAP_STATUSES: LeaveRequestStatus[] = [
  LEAVE_REQUEST_STATUSES.PENDING,
  LEAVE_REQUEST_STATUSES.APPROVED,
]

export const LEAVE_ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
export const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024
export const LEAVE_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]

/** Demo anchor year for leave balances and calendar. */
export const LEAVE_DEMO_YEAR = 2026
export const LEAVE_DEMO_TODAY = '2026-08-07'
