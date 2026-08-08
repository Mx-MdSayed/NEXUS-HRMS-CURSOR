import { format, parseISO, subDays } from 'date-fns'
import { enrichAttendanceMetrics, isWeekOff, toDateKey } from '../utils/calculations'
import type { AttendanceCorrection, AttendanceRecord, AttendanceAuditEvent } from '../types'
import { initialHolidays } from './mockHolidays'

const TODAY = '2026-08-08'
const employeeIds = [
  'emp-1001',
  'emp-1002',
  'emp-1003',
  'emp-2041',
  'emp-1988',
  'emp-2110',
  'emp-1875',
  'emp-2201',
  'emp-2202',
  'emp-2198',
  'emp-2195',
  'emp-1750',
  'emp-1600',
  'emp-1555',
  'emp-1400',
]

function iso(dateKey: string, time: string): string {
  return `${dateKey}T${time}:00.000`
}

function makeRecord(
  employeeId: string,
  date: string,
  partial: Partial<AttendanceRecord> & Pick<AttendanceRecord, 'status' | 'source'>,
): AttendanceRecord {
  const metrics = enrichAttendanceMetrics({
    date,
    checkIn: partial.checkIn,
    checkOut: partial.checkOut,
    status: partial.status,
  })
  const now = `${date}T12:00:00.000Z`
  return {
    id: `att-${employeeId}-${date}`,
    employeeId,
    date,
    checkIn: partial.checkIn,
    checkOut: partial.checkOut,
    remarks: partial.remarks,
    source: partial.source,
    correctionStatus: partial.correctionStatus,
    correctedBy: partial.correctedBy,
    correctedAt: partial.correctedAt,
    createdAt: now,
    updatedAt: now,
    createdBy: partial.createdBy ?? 'System',
    updatedBy: partial.updatedBy ?? 'System',
    ...metrics,
    status: partial.status === 'absent' || partial.status === 'on_leave' || partial.status === 'holiday' || partial.status === 'week_off'
      ? partial.status
      : metrics.status,
  }
}

function buildHistory(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = parseISO(TODAY)

  for (let offset = 0; offset < 18; offset += 1) {
    const date = toDateKey(subDays(today, offset))
    const holiday = initialHolidays.find((item) => item.date === date)

    employeeIds.forEach((employeeId, index) => {
      if (isWeekOff(date)) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'week_off',
            source: 'admin_entry',
          }),
        )
        return
      }

      if (holiday) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'holiday',
            source: 'admin_entry',
            remarks: holiday.name,
          }),
        )
        return
      }

      // Today: mix of statuses, some not marked (skip creating record for a few)
      if (date === TODAY) {
        if (index === 12 || index === 13) return // not marked
        if (index % 11 === 0) {
          records.push(
            makeRecord(employeeId, date, {
              status: 'absent',
              source: 'admin_entry',
            }),
          )
          return
        }
        if (index % 9 === 0) {
          records.push(
            makeRecord(employeeId, date, {
              status: 'on_leave',
              source: 'admin_entry',
              remarks: 'Approved leave',
            }),
          )
          return
        }
        if (index % 5 === 0) {
          records.push(
            makeRecord(employeeId, date, {
              status: 'late',
              source: 'self_check_in',
              checkIn: iso(date, '10:05'),
              checkOut: undefined,
            }),
          )
          return
        }
        records.push(
          makeRecord(employeeId, date, {
            status: 'present',
            source: 'self_check_in',
            checkIn: iso(date, index % 2 === 0 ? '09:20' : '09:35'),
            checkOut: index < 4 ? undefined : iso(date, '18:05'),
          }),
        )
        return
      }

      // Historical days
      const pattern = (index + offset) % 7
      if (pattern === 0) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'absent',
            source: 'admin_entry',
          }),
        )
      } else if (pattern === 1) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'late',
            source: 'self_check_in',
            checkIn: iso(date, '10:12'),
            checkOut: iso(date, '18:10'),
          }),
        )
      } else if (pattern === 2) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'half_day',
            source: 'admin_entry',
            checkIn: iso(date, '09:25'),
            checkOut: iso(date, '13:10'),
          }),
        )
      } else if (pattern === 3 && index % 4 === 0) {
        records.push(
          makeRecord(employeeId, date, {
            status: 'on_leave',
            source: 'admin_entry',
          }),
        )
      } else {
        records.push(
          makeRecord(employeeId, date, {
            status: 'present',
            source: 'self_check_in',
            checkIn: iso(date, '09:28'),
            checkOut: iso(date, '18:02'),
          }),
        )
      }
    })
  }

  return records
}

export const initialAttendance: AttendanceRecord[] = buildHistory()

export const initialCorrections: AttendanceCorrection[] = [
  {
    id: 'corr-1',
    attendanceId: `att-emp-1003-2026-08-05`,
    employeeId: 'emp-1003',
    date: '2026-08-05',
    currentStatus: 'absent',
    requestedStatus: 'present',
    requestedCheckIn: iso('2026-08-05', '09:40'),
    requestedCheckOut: iso('2026-08-05', '18:05'),
    reason: 'Forgot to check in after network outage.',
    status: 'pending',
    requestedAt: '2026-08-06T09:00:00.000Z',
    requestedBy: 'Eden Employee',
  },
  {
    id: 'corr-2',
    attendanceId: `att-emp-2201-2026-08-04`,
    employeeId: 'emp-2201',
    date: '2026-08-04',
    currentStatus: 'late',
    currentCheckIn: iso('2026-08-04', '10:12'),
    currentCheckOut: iso('2026-08-04', '18:10'),
    requestedStatus: 'present',
    requestedCheckIn: iso('2026-08-04', '09:25'),
    requestedCheckOut: iso('2026-08-04', '18:10'),
    reason: 'Incorrect check-in captured by kiosk.',
    status: 'approved',
    requestedAt: '2026-08-04T19:00:00.000Z',
    requestedBy: 'Aisha Khan',
    reviewedBy: 'Harper HR',
    reviewedAt: '2026-08-05T10:00:00.000Z',
    reviewComment: 'Verified with manager.',
  },
  {
    id: 'corr-3',
    employeeId: 'emp-2198',
    date: '2026-08-03',
    currentStatus: 'absent',
    requestedStatus: 'on_leave',
    reason: 'Leave was approved but attendance marked absent.',
    status: 'rejected',
    requestedAt: '2026-08-03T16:00:00.000Z',
    requestedBy: 'Sofia Alvarez',
    reviewedBy: 'Harper HR',
    reviewedAt: '2026-08-04T11:00:00.000Z',
    reviewComment: 'Leave request not found for this date.',
  },
]

export const initialAuditEvents: AttendanceAuditEvent[] = [
  {
    id: 'aud-1',
    attendanceId: 'att-emp-2201-2026-08-04',
    employeeId: 'emp-2201',
    date: '2026-08-04',
    action: 'correction_approved',
    oldValue: 'late',
    newValue: 'present',
    changedBy: 'Harper HR',
    changedAt: '2026-08-05T10:00:00.000Z',
    reason: 'Verified with manager.',
  },
]

export { TODAY as MOCK_TODAY }
export function todayKey(): string {
  // Prefer app demo "today" for consistency with mock dataset; fall back to real local date.
  return format(new Date(), 'yyyy-MM-dd') === TODAY ? TODAY : TODAY
}
