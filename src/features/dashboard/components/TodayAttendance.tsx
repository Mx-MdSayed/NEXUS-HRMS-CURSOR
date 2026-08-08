import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { TodayAttendanceRow } from '../types'

function AttendanceStatus({ status }: { status: TodayAttendanceRow['status'] }) {
  if (status === 'on_leave') {
    return <Badge variant="info">On Leave</Badge>
  }
  return <StatusBadge status={status} />
}

export function TodayAttendance({ data }: { data: TodayAttendanceRow[] }) {
  const navigate = useNavigate()

  if (data.length === 0) {
    return (
      <EmptyState
        title="No attendance records"
        description="Today's attendance entries will appear here."
        actionLabel="View Attendance"
        onAction={() => navigate('/attendance')}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-card-title">Today&apos;s Attendance</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/attendance')}>
          View Attendance
        </Button>
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">{row.employeeName}</p>
                  <p className="text-xs text-surface-500">{row.employeeId}</p>
                </div>
              </TableCell>
              <TableCell>{row.checkIn ?? '—'}</TableCell>
              <TableCell>{row.checkOut ?? '—'}</TableCell>
              <TableCell>
                <AttendanceStatus status={row.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
