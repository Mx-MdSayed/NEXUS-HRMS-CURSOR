import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'
import { formatDate } from '@/utils/date'
import { employeeSalaryService } from '../services/employeeSalaryService'
import type { EmployeeSalary, SalaryAssignmentFilters } from '../types'
import { formatSalaryAmount } from '../utils/money'

type AssignmentRow = EmployeeSalary & {
  employeeName: string
  employeeCode: string
  departmentId: string
}

const defaultFilters: SalaryAssignmentFilters = { search: '', departmentId: '', status: '' }

export function SalaryAssignmentsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canAssign = hasPermission(PERMISSIONS.SALARY_ASSIGN) || hasPermission(PERMISSIONS.SALARY_MANAGE)
  const canView = hasPermission(PERMISSIONS.SALARY_VIEW)

  const [rows, setRows] = useState<AssignmentRow[]>([])
  const [filters, setFilters] = useState<SalaryAssignmentFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await employeeSalaryService.getAssignments(filters))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  if (!canView) {
    return <ErrorState title="Access denied" message="You cannot view salary assignments." />
  }

  const departments = listActiveDepartmentOptions()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Assignments"
        description="Active employee compensation packages (payroll snapshots)."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Assignments' },
        ]}
        actions={
          canAssign ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/salary/assignments/new')}
            >
              Assign salary
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search employee or structure…"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <Select
            label="Department"
            value={filters.departmentId ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, departmentId: event.target.value }))
            }
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
            ]}
          />
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load assignments" message="Please try again." />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No salary assigned."
          emptyDescription="Assign a salary structure to an employee to begin."
          columnCount={7}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Monthly Gross</TableHead>
              <TableHead>Annual CTC</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    to={`/salary/${row.employeeId}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.employeeName}
                  </Link>
                  <div className="text-xs text-surface-500">{row.employeeCode}</div>
                </TableCell>
                <TableCell>{row.structureName}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.monthlyGross, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.annualCTC, row.currency)}
                </TableCell>
                <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status === 'superseded' ? 'inactive' : row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions onView={() => navigate(`/salary/${row.employeeId}`)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  )
}
