import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { formatDate } from '@/utils/date'
import { showInfo } from '@/utils/toast'
import type { RecentLeaveRequest } from '../types'

export function RecentLeaveRequests({ data }: { data: RecentLeaveRequest[] }) {
  const navigate = useNavigate()

  if (data.length === 0) {
    return (
      <EmptyState
        title="No pending leave requests"
        description="New leave requests will appear here for review."
        actionLabel="Manage Leave"
        onAction={() => navigate('/leave')}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-card-title">Recent Leave Requests</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/leave')}>
          View All
        </Button>
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={row.employeeName} size="sm" />
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">{row.employeeName}</p>
                    <p className="text-xs text-surface-500">{row.employeeId}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{row.leaveType}</TableCell>
              <TableCell>{formatDate(row.startDate)}</TableCell>
              <TableCell>{formatDate(row.endDate)}</TableCell>
              <TableCell>{row.durationDays}d</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <TableActions
                  onView={() => {
                    showInfo('Leave details will be available in the Leave module.')
                    navigate('/leave')
                  }}
                  moreItems={
                    row.status === 'pending'
                      ? [
                          {
                            id: 'approve',
                            label: 'Approve',
                            onClick: () => showInfo('Leave approval will be implemented in a later module.'),
                          },
                          {
                            id: 'reject',
                            label: 'Reject',
                            danger: true,
                            onClick: () => showInfo('Leave rejection will be implemented in a later module.'),
                          },
                        ]
                      : []
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
