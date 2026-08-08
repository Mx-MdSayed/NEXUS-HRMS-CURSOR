import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/components/ui'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import type { EmployeeDashboardData } from '../types'
import { NotificationPreview } from './NotificationPreview'
import { QuickActions } from './QuickActions'
import { RecentActivityFeed } from './RecentActivityFeed'
import { UpcomingEvents } from './UpcomingEvents'

function AttendanceStatusBadge({
  status,
}: {
  status: EmployeeDashboardData['attendanceToday']['status']
}) {
  if (status === 'on_leave') return <Badge variant="info">On Leave</Badge>
  if (status === 'not_checked_in') return <Badge variant="neutral">Not Checked In</Badge>
  return <StatusBadge status={status} />
}

export function EmployeeDashboard({ data }: { data: EmployeeDashboardData }) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AttendanceStatusBadge status={data.attendanceToday.status} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-surface-500">Checked In</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-surface-50">
                  {data.attendanceToday.checkIn ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-surface-500">Checked Out</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-surface-50">
                  {data.attendanceToday.checkOut ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Attendance This Month</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Present', value: data.monthlyAttendance.present },
              { label: 'Absent', value: data.monthlyAttendance.absent },
              { label: 'Late', value: data.monthlyAttendance.late },
              { label: 'Leave', value: data.monthlyAttendance.leave },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-800"
              >
                <p className="text-xs text-surface-500">{item.label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Leave Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.leaveBalances.map((balance) => (
              <div key={balance.type} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-surface-600 dark:text-surface-300">{balance.type}</span>
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {balance.remaining} / {balance.total} days
                </span>
              </div>
            ))}
            <p className="text-xs text-surface-500">Pending leave requests: {data.pendingLeaveCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Latest Payslip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.latestPayslip ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-surface-500">{data.latestPayslip.periodLabel}</p>
                  <StatusBadge status={data.latestPayslip.status} />
                </div>
                <p className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
                  {formatCurrency(data.latestPayslip.netSalary)}
                </p>
                <p className="text-xs text-surface-500">
                  Issued {formatDate(data.latestPayslip.issuedAt)}
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/payslips')}>
                  View Payslip
                </Button>
              </>
            ) : (
              <p className="text-sm text-surface-500">No payslip available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickActions actions={data.quickActions} />

      <div className="grid gap-4 xl:grid-cols-3">
        <UpcomingEvents events={data.upcomingEvents} />
        <NotificationPreview items={data.notifications} />
        <RecentActivityFeed items={data.recentActivity} />
      </div>
    </div>
  )
}
