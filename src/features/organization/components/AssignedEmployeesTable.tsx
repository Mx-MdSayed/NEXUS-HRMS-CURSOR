import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  DataTable,
  EmptyState,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { EmployeeListItem } from '@/features/employees/types'
import { formatDate } from '@/utils/date'

export function AssignedEmployeesTable({
  employees,
  mode,
  emptyTitle,
}: {
  employees: EmployeeListItem[]
  mode: 'department' | 'designation'
  emptyTitle: string
}) {
  const navigate = useNavigate()

  if (employees.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="Assigned employees will appear here."
      />
    )
  }

  return (
    <DataTable>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Employee ID</TableHead>
          <TableHead>{mode === 'department' ? 'Designation' : 'Department'}</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow
            key={employee.id}
            className="cursor-pointer"
            onClick={() => navigate(`/employees/${employee.id}`)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={employee.fullName} src={employee.profilePhoto} size="sm" />
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">
                    {employee.fullName}
                  </p>
                  <p className="text-xs text-surface-500">{employee.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">{employee.employeeCode}</TableCell>
            <TableCell>
              {mode === 'department' ? employee.designationName : employee.departmentName}
            </TableCell>
            <TableCell>{formatDate(employee.joiningDate)}</TableCell>
            <TableCell>
              <StatusBadge status={employee.employmentStatus} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  )
}
