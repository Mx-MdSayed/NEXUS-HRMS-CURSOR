import { useNavigate } from 'react-router-dom'
import {
  Avatar,
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
import { formatDate } from '@/utils/date'
import type { RecentEmployee } from '../types'

export function RecentEmployees({ data }: { data: RecentEmployee[] }) {
  const navigate = useNavigate()

  if (data.length === 0) {
    return (
      <EmptyState
        title="No recent employees"
        description="Newly joined employees will appear here."
        actionLabel="View Employees"
        onAction={() => navigate('/employees')}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-card-title">Recent Employees</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
          View All
        </Button>
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Joining Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={row.name} src={row.avatarUrl} size="sm" />
                  <span className="font-medium text-surface-900 dark:text-surface-50">{row.name}</span>
                </div>
              </TableCell>
              <TableCell>{row.employeeId}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{formatDate(row.joiningDate)}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
