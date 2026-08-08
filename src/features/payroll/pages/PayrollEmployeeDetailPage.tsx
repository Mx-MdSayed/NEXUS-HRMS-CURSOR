import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  StatCard,
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
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService, type Employee } from '@/features/employees'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate } from '@/utils/date'
import { PayrollBreakdown } from '../components/PayrollBreakdown'
import { PAYROLL_EMPLOYEE_STATUS_LABELS } from '../constants'
import { payrollEmployeeService } from '../services/payrollEmployeeService'
import { payrollService } from '../services/payrollService'
import type { PayrollEmployee, PayrollEmployeeStatus, PayrollRun } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'
import type { StatusTone } from '@/components/ui'

const EMPLOYEE_STATUS_TONE: Record<PayrollEmployeeStatus, StatusTone> = {
  pending: 'pending',
  ready: 'active',
  calculated: 'approved',
  error: 'rejected',
  excluded: 'inactive',
}

export function PayrollEmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('runId') ?? undefined
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()

  const canManage = hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canViewCompany = canManage || hasPermission(PERMISSIONS.PAYROLL_VIEW)
  const canViewEmployee = hasPermission(PERMISSIONS.PAYROLL_EMPLOYEE_VIEW)
  const mustViewOwn = user?.role === 'employee' && !canManage

  const [identity, setIdentity] = useState<Employee | null>(null)
  const [records, setRecords] = useState<PayrollEmployee[]>([])
  const [runsById, setRunsById] = useState<Map<string, PayrollRun>>(new Map())
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  const load = useCallback(async () => {
    if (!employeeId) return
    setIsLoading(true)
    setError(null)
    setUnauthorized(false)
    try {
      if (mustViewOwn || (!canViewCompany && canViewEmployee)) {
        const linkedEmployeeId = await attendanceService.resolveLinkedEmployeeId(user ?? undefined)
        if (!linkedEmployeeId || linkedEmployeeId !== employeeId) {
          setUnauthorized(true)
          return
        }
      }

      const [employeeIdentity, runs] = await Promise.all([
        employeeService.getEmployeeById(employeeId).catch(() => null),
        payrollService.getPayrollRuns({}),
      ])
      const runMap = new Map(runs.map((run) => [run.id, run]))
      let payrollRows: PayrollEmployee[]
      if (runId) {
        const row = await payrollEmployeeService.getEmployeePayrollByRun(runId, employeeId)
        payrollRows = [row, ...(await payrollEmployeeService.getEmployeePayroll(employeeId))]
      } else {
        payrollRows = await payrollEmployeeService.getEmployeePayroll(employeeId)
      }

      const uniqueRows = Array.from(new Map(payrollRows.map((row) => [row.id, row])).values()).sort((a, b) => {
        const aRun = runMap.get(a.payrollRunId)
        const bRun = runMap.get(b.payrollRunId)
        return (bRun?.monthKey ?? b.updatedAt).localeCompare(aRun?.monthKey ?? a.updatedAt)
      })

      setIdentity(employeeIdentity)
      setRunsById(runMap)
      setRecords(uniqueRows)
      setSelectedRun(runId ? runMap.get(runId) ?? null : runMap.get(uniqueRows[0]?.payrollRunId ?? '') ?? null)
    } catch (err) {
      setError(getPayrollErrorMessage(err, 'Unable to load employee payroll.'))
    } finally {
      setIsLoading(false)
    }
  }, [canViewCompany, canViewEmployee, employeeId, mustViewOwn, runId, user])

  useEffect(() => {
    void load()
  }, [load])

  const selectedRecord = useMemo(() => {
    if (runId) return records.find((record) => record.payrollRunId === runId) ?? null
    return records[0] ?? null
  }, [records, runId])

  if (!canViewCompany && !canViewEmployee) {
    return <ErrorState title="Access denied" message="You do not have permission to view payroll data." />
  }
  if (isLoading) return <PageLoader label="Loading employee payroll" />
  if (unauthorized) {
    return <ErrorState title="Access denied" message="You can only view your own payroll records." />
  }
  if (error) return <ErrorState title="Unable to load employee payroll" message={error} onRetry={load} />

  if (!selectedRecord) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Employee Payroll"
          description="Payroll details for the selected employee."
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Payroll', href: '/payroll' },
            { label: 'Employees', href: '/payroll/employees' },
            { label: employeeId ?? 'Employee' },
          ]}
        />
        <EmptyState
          title="No salary information found for this employee."
          description="No payroll data available."
        />
      </div>
    )
  }

  const displayName = identity?.fullName ?? selectedRecord.employeeName
  const employeeCode = identity?.employeeCode ?? selectedRecord.employeeCode
  const runForSelected = selectedRun ?? runsById.get(selectedRecord.payrollRunId) ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        description={`Payroll details for ${employeeCode}.`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees', href: '/payroll/employees' },
          { label: displayName },
        ]}
        actions={
          runForSelected ? (
            <Button variant="secondary" onClick={() => navigate(`/payroll/runs/${runForSelected.id}`)}>
              View payroll run
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Employee identity
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-surface-500">Employee code</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-50">{employeeCode}</dd>
                </div>
                <div>
                  <dt className="text-surface-500">Department</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-50">
                    {selectedRecord.departmentName}
                  </dd>
                </div>
                <div>
                  <dt className="text-surface-500">Designation</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-50">
                    {selectedRecord.designationName}
                  </dd>
                </div>
                <div>
                  <dt className="text-surface-500">Joined</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-50">
                    {identity ? formatDate(identity.joiningDate) : '—'}
                  </dd>
                </div>
              </dl>
            </div>
            <StatusBadge
              status={EMPLOYEE_STATUS_TONE[selectedRecord.status]}
              label={PAYROLL_EMPLOYEE_STATUS_LABELS[selectedRecord.status]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Working Days" value={String(selectedRecord.workingDays)} />
        <StatCard title="Payable Days" value={String(selectedRecord.payableDays)} />
        <StatCard title="Present Days" value={String(selectedRecord.presentDays)} />
        <StatCard title="Unpaid Leave" value={String(selectedRecord.unpaidLeaveDays)} />
        <StatCard title="Paid Leave" value={String(selectedRecord.paidLeaveDays)} />
        <StatCard title="Half Days" value={String(selectedRecord.halfDays)} />
        <StatCard title="Overtime Hours" value={String(selectedRecord.overtimeHours)} />
        <StatCard title="Late Minutes" value={String(selectedRecord.lateMinutes)} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Salary breakdown
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {runForSelected?.name ?? selectedRecord.payrollRunId}
                {runForSelected ? ` · ${runForSelected.monthKey}` : null}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-500">Net Salary</p>
              <p className="font-display text-xl font-semibold tabular-nums text-surface-900 dark:text-surface-50">
                {formatSalaryAmount(selectedRecord.netSalary, selectedRecord.currency)}
              </p>
            </div>
          </div>
          {selectedRecord.components.length === 0 ? (
            <EmptyState
              title="No salary information found for this employee."
              description="No payroll data available."
            />
          ) : (
            <PayrollBreakdown employee={selectedRecord} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Payroll history</h2>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const run = runsById.get(record.payrollRunId)
                return (
                  <TableRow key={record.id} selected={record.id === selectedRecord.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-brand-700 hover:underline dark:text-brand-300"
                        onClick={() =>
                          navigate(`/payroll/employees/${record.employeeId}?runId=${record.payrollRunId}`)
                        }
                      >
                        {run?.name ?? record.payrollRunId}
                      </button>
                      <div className="text-xs text-surface-500">{run?.monthKey ?? '—'}</div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatSalaryAmount(record.grossEarnings, record.currency)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatSalaryAmount(record.totalDeductions, record.currency)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatSalaryAmount(record.netSalary, record.currency)}
                    </TableCell>
                    <TableCell>
                      {run ? (
                        <StatusBadge status={payrollStatusTone(run.status)} label={payrollStatusLabel(run.status)} />
                      ) : (
                        <StatusBadge
                          status={EMPLOYEE_STATUS_TONE[record.status]}
                          label={PAYROLL_EMPLOYEE_STATUS_LABELS[record.status]}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TableActions
                        onView={() =>
                          navigate(`/payroll/employees/${record.employeeId}?runId=${record.payrollRunId}`)
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
