import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  PageLoader,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { payrollService } from '../services/payrollService'
import type { PayrollEmployee, PayrollRun } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'

interface RevisionConsumptionRow {
  employee: PayrollEmployee
  run: PayrollRun
  snapshotCount: number
}

export function PayrollRevisionsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canView = hasPermission(PERMISSIONS.PAYROLL_VIEW) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)

  const [rows, setRows] = useState<RevisionConsumptionRow[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const runs = await payrollService.getPayrollRuns({})
        const calculatedRuns = runs.filter((run) => run.status === 'calculated' || run.status === 'finalized')
        const employeeGroups = await Promise.all(
          calculatedRuns.map(async (run) => {
            const employees = await payrollService.getRunEmployees(run.id)
            return employees
              .filter((employee) => employee.status === 'calculated' && employee.salarySnapshotIds.length > 1)
              .map((employee) => ({
                employee,
                run,
                snapshotCount: employee.salarySnapshotIds.length,
              }))
          }),
        )
        if (!cancelled) setRows(employeeGroups.flat())
      } catch (err) {
        if (!cancelled) setError(getPayrollErrorMessage(err, 'Unable to load revision consumption.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(({ employee, run }) =>
      `${employee.employeeName} ${employee.employeeCode} ${employee.departmentName} ${run.name}`
        .toLowerCase()
        .includes(query),
    )
  }, [rows, search])

  if (!canView) {
    return <ErrorState title="Access denied" message="You do not have permission to view payroll revisions." />
  }
  if (isLoading) return <PageLoader label="Loading payroll revisions" />
  if (error) return <ErrorState title="Unable to load payroll revisions" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Revisions"
        description="Understand how salary revisions are consumed during payroll calculation."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Revisions' },
        ]}
        actions={<Button onClick={() => navigate('/salary/revisions')}>Open salary revisions</Button>}
      />

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            Mid-month revision handling
          </h2>
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Payroll does not own a separate revision workflow. Mid-month salary changes are created in the
            Salary module and payroll consumes the resulting overlapping EmployeeSalary snapshots during
            calculation. When a calculated payroll employee has more than one salarySnapshotId, it means the
            month was split across revision snapshots.
          </p>
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Use Salary Revisions to create, approve, or inspect compensation changes. This page is a read-only
            foundation view for payroll impact only.
          </p>
        </CardContent>
      </Card>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employee, run, or department"
        onReset={() => setSearch('')}
      />

      {filteredRows.length === 0 ? (
        <EmptyState
          title="No mid-month revision consumption found."
          description="Calculated payroll rows with multiple salary snapshots will appear here."
          actionLabel="Open salary revisions"
          onAction={() => navigate('/salary/revisions')}
        />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Payroll Run</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Snapshots</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Net</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(({ employee, run, snapshotCount }) => (
              <TableRow key={`${employee.id}-${run.id}`}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left font-medium text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => navigate(`/payroll/employees/${employee.employeeId}?runId=${run.id}`)}
                  >
                    {employee.employeeName}
                  </button>
                  <div className="text-xs text-surface-500">{employee.employeeCode}</div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-left text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => navigate(`/payroll/runs/${run.id}`)}
                  >
                    {run.name}
                  </button>
                  <div className="text-xs text-surface-500">{run.monthKey}</div>
                </TableCell>
                <TableCell>{employee.departmentName}</TableCell>
                <TableCell className="tabular-nums">{snapshotCount}</TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(employee.grossEarnings, employee.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(employee.netSalary, employee.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <TableActions
                    onView={() => navigate(`/payroll/employees/${employee.employeeId}?runId=${run.id}`)}
                    moreItems={[
                      {
                        id: 'salary-revisions',
                        label: 'Open salary revisions',
                        onClick: () => navigate('/salary/revisions'),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  )
}
