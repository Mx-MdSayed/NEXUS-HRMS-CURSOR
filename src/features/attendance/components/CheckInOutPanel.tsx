import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from '@/components/ui'
import { formatDate, formatDateTime } from '@/utils/date'
import type { AttendanceRecord } from '../types'
import { attendanceService } from '../services/attendanceService'

export function CheckInOutPanel({
  record,
  onCheckIn,
  onCheckOut,
  loading,
  dateLabel,
}: {
  record?: AttendanceRecord | null
  onCheckIn: () => void
  onCheckOut: () => void
  loading?: boolean
  dateLabel: string
}) {
  const checkedIn = Boolean(record?.checkIn)
  const checkedOut = Boolean(record?.checkOut)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Check-In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-surface-500">{dateLabel}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Status</p>
            <div className="mt-1">
              {record ? <StatusBadge status={record.status} /> : <StatusBadge status="not_marked" />}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Work Hours</p>
            <p className="mt-1 text-sm font-medium">
              {attendanceService.formatWorkHours(record?.workMinutes ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Check In</p>
            <p className="mt-1 text-sm font-medium">
              {record?.checkIn ? formatDateTime(record.checkIn) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Check Out</p>
            <p className="mt-1 text-sm font-medium">
              {record?.checkOut ? formatDateTime(record.checkOut) : '—'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onCheckIn}
            disabled={checkedIn}
            isLoading={loading}
            aria-label="Check in"
          >
            Check In
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCheckOut}
            disabled={!checkedIn || checkedOut}
            isLoading={loading}
            aria-label="Check out"
          >
            Check Out
          </Button>
        </div>
        <p className="text-xs text-surface-500">
          Date reference: {formatDate(dateLabel)}. Duplicate check-in/out is blocked by the service.
        </p>
      </CardContent>
    </Card>
  )
}
