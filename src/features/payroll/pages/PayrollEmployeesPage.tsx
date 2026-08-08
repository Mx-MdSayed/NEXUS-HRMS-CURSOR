import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  PageLoader,
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
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService, type DepartmentOption } from '@/features/employees'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { payrollService } from '../services/payrollService'
import type { PayrollEmployee, PayrollRun } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'

interface PayrollEmployeeRow {
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentId: string
  departmentName: string
  designationName: string
  latestRun: PayrollRun
  latestPayroll: PayrollEmployee
  runCount: number
}

interface EmployeeFilters {
  search: string
  departmentId: string
}

const defaultFilters: EmployeeFilters = { search: '', departmentId: '' }

export function PayrollEmployeesPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canViewCompany = hasPermission(PERMISSIONS.PAYROLL_VIEW) || canManage
  const canViewEmployee = hasPermission(PERMISSIONS.PAYROLL_EMPLOYEE_VIEW)
  const selfServiceOnly = canViewEmployee && !canManage && !canViewCompany

  const [rows, setRows] = useState<PayrollEmployeeRow[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [filters, setFilters] = useState<EmployeeFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkedEmployeeId, setLinkedEmployeeId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [departmentRows, resolvedEmployeeId] = await Promise.all([
        employeeService.getDepartments(),
        selfServiceOnly ? attendanceService.resolveLinkedEmployeeId(user ?? undefined) : Promise.resolve(null),
      ])
      setDepartments(departmentRows)
      setLinkedEmployeeId(resolvedEmployeeId)

      const runs = await payrollService.getPayrollRuns({})
      const scopedRuns = selfServiceOnly && resolvedEmployeeId ? runs : runs
      const employeeRows = await Promise.all(
        scopedRuns.map(async (run) => {
          const employees = await payrollService.getRunEmployees(run.id)
          return employees.map((employee) => ({ run, employee }))
        }),
      )

      const latestByEmployee = new Map<string, PayrollEmployeeRow>()
      for (const item of employeeRows.flat()) {
        if (selfServiceOnly && item.employee.employeeId !== resolvedEmployeeId) continue
        const current = latestByEmployee.get(item.employee.employeeId)
        if (!current) {
          latestByEmployee.set(item.employee.employeeId, {
            employeeId: item.employee.employeeId,
            employeeCode: item.employee.employeeCode,
            employeeName: item.employee.employeeName,
            departmentId: item.employee.departmentId,
            departmentName: item.employee.departmentName,
            designationName: item.employee.designationName,
            latestRun: item.run,
            latestPayroll: item.employee,
            runCount: 1,
          })
          continue
        }
        current.runCount += 1
        if (item.run.monthKey.localeCompare(current.latestRun.monthKey) > 0) {
          latestByEmployee.set(item.employee.employeeId, {
            ...current,
            employeeCode: item.employee.employeeCode,
            employeeName: item.employee.employeeName,
            departmentId: item.employee.departmentId,
            departmentName: item.employee.departmentName,
            designationName: item.employee.designationName,
            latestRun: item.run,
            latestPayroll: item.employee,
          })
        }
      }
      setRows(Array.from(latestByEmployee.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName)))
    } catch (err) {
      setError(getPayrollErrorMessage(err, 'Unable to load payroll employees.'))
    } finally {
      setIsLoading(false)
    }
  }, [selfServiceOnly, user])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return rows.filter((row) => {
      if (filters.departmentId && row.departmentId !== filters.departmentId) return false
      if (!query) return true
      return `${row.employeeName} ${row.employeeCode} ${row.departmentName}`
        .toLowerCase()
        .includes(query)
    })
  }, [filters, rows])

  if (!canViewCompany && !canViewEmployee) {
    return <ErrorState title="Access denied" message="You do not have permission to view payroll employees." />
  }

  if (isLoading) return <PageLoader label="Loading payroll employees" />
  if (error) return <ErrorState title="Unable to load payroll employees" message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Employees"
        description="Browse employee payroll records across payroll runs."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees' },
        ]}
      />

      {selfServiceOnly ? (
        <Card className="border-primary-200 bg-primary-50/70 dark:border-primary-900 dark:bg-primary-950/30">
          <CardContent>
            <p className="text-sm text-primary-800 dark:text-primary-200">
              You can view your own payroll records only. Contact HR if your employee profile is not linked to
              your user account.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
        searchPlaceholder="Search employee, code, or department"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <Select
            label="Department"
            value={filters.departmentId}
            onChange={(event) => setFilters((current) => ({ ...current, departmentId: event.target.value }))}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ]}
          />
        }
      />

      {selfServiceOnly && !linkedEmployeeId ? (
        <EmptyState
          title="No linked employee profile found."
          description="Your user account is not linked to an employee payroll profile."
        />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No payroll employees found." description="No payroll data available." />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Latest Run</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.employeeId}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left font-medium text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => navigate(`/payroll/employees/${row.employeeId}`)}
                  >
                    {row.employeeName}
                  </button>
                  <div className="text-xs text-surface-500">{row.employeeCode}</div>
                </TableCell>
                <TableCell>
                  <div>{row.departmentName}</div>
                  <div className="text-xs text-surface-500">{row.designationName}</div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-left text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => navigate(`/payroll/runs/${row.latestRun.id}`)}
                  >
                    {row.latestRun.name}
                  </button>
                  <div className="text-xs text-surface-500">{row.latestRun.monthKey}</div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.latestPayroll.netSalary, row.latestPayroll.currency)}
                </TableCell>
                <TableCell className="tabular-nums">{row.runCount}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={payrollStatusTone(row.latestRun.status)}
                    label={payrollStatusLabel(row.latestRun.status)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions onView={() => navigate(`/payroll/employees/${row.employeeId}`)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  )
}
