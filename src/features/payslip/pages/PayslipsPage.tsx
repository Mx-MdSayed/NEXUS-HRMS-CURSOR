import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  PageLoader,
  Pagination,
  Select,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type StatusTone,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { SALARY_CURRENCY_OPTIONS } from '@/constants/currencies'
import { useAuth } from '@/contexts/AuthContext'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService } from '@/features/employees/services/employeeService'
import type { DepartmentOption } from '@/features/employees/types'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate } from '@/utils/date'
import { PayslipActions } from '../components/PayslipActions'
import { payslipService } from '../services/payslipService'
import type { Payslip, PayslipFilters, PayslipStatus } from '../types'
import { getPayslipErrorMessage } from '../utils/errors'

const defaultFilters: PayslipFilters = {
  search: '',
  month: 7,
  year: 2026,
  departmentId: '',
  employeeId: '',
  status: '',
  currency: '',
}

const statusTone: Record<PayslipStatus, StatusTone> = {
  generated: 'draft',
  published: 'approved',
  archived: 'inactive',
}

const monthOptions = [
  { value: '', label: 'All months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export function PayslipsPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const isEmployee = user?.role === ROLES.EMPLOYEE
  const canManage = hasPermission(PERMISSIONS.PAYSLIP_MANAGE)
  const canView = hasPermission(PERMISSIONS.PAYSLIP_VIEW) || canManage

  const [rows, setRows] = useState<Payslip[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [filters, setFilters] = useState<PayslipFilters>(defaultFilters)
  const [linkedEmployeeId, setLinkedEmployeeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function loadDepartments() {
      if (isEmployee) return
      try {
        const departmentRows = await employeeService.getDepartments()
        if (!cancelled) setDepartments(departmentRows)
      } catch {
        if (!cancelled) setDepartments([])
      }
    }
    void loadDepartments()
    return () => {
      cancelled = true
    }
  }, [isEmployee])

  useEffect(() => {
    let cancelled = false
    async function resolveEmployee() {
      if (!isEmployee) {
        setLinkedEmployeeId(null)
        return
      }
      const employeeId = await attendanceService.resolveLinkedEmployeeId(user)
      if (!cancelled) setLinkedEmployeeId(employeeId)
    }
    void resolveEmployee()
    return () => {
      cancelled = true
    }
  }, [isEmployee, user])

  const load = useCallback(async () => {
    if (isEmployee && !linkedEmployeeId) {
      setIsLoading(false)
      setRows([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = isEmployee
        ? await payslipService.getEmployeePayslips(linkedEmployeeId!)
        : await payslipService.getPayslips(filters)
      setRows(result)
      setPage(1)
    } catch (err) {
      setError(getPayslipErrorMessage(err, 'Failed to load payslips.'))
    } finally {
      setIsLoading(false)
    }
  }, [filters, isEmployee, linkedEmployeeId])

  useEffect(() => {
    if (!isEmployee || linkedEmployeeId !== null) void load()
  }, [isEmployee, linkedEmployeeId, load])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [page, rows],
  )

  if (!canView) {
    return <ErrorState title="Access denied" message="You do not have permission to view payslips." />
  }

  if (isLoading) return <PageLoader label="Loading payslips" />

  if (isEmployee && !linkedEmployeeId) {
    return (
      <ErrorState
        title="Employee profile not linked"
        message="Your user account is not linked to an employee record."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? 'My Payslips' : 'Payslips'}
        description={
          isEmployee
            ? 'View your generated salary documents.'
            : 'Generate, publish, print, and archive salary documents from finalized payroll snapshots.'
        }
        breadcrumbs={[{ label: 'Home' }, { label: 'Payslips' }]}
        actions={
          canManage ? (
            <Button
              variant="secondary"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => navigate('/payslips/settings')}
            >
              Payslip Settings
            </Button>
          ) : null
        }
      />

      {!isEmployee ? (
        <FilterBar
          searchValue={filters.search ?? ''}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          searchPlaceholder="Search payslip, employee, department…"
          onReset={() => setFilters(defaultFilters)}
          filters={
            <>
              <Select
                label="Month"
                value={String(filters.month ?? '')}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    month: event.target.value ? Number(event.target.value) : '',
                  }))
                }
                options={monthOptions}
              />
              <Select
                label="Year"
                value={String(filters.year ?? '')}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    year: event.target.value ? Number(event.target.value) : '',
                  }))
                }
                options={[
                  { value: '', label: 'All years' },
                  { value: '2026', label: '2026' },
                ]}
              />
              <Select
                label="Department"
                value={filters.departmentId ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, departmentId: event.target.value }))
                }
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.map((item) => ({ value: item.name, label: item.name })),
                ]}
              />
              <Select
                label="Status"
                value={filters.status ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as PayslipFilters['status'],
                  }))
                }
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'generated', label: 'Generated' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <Select
                label="Currency"
                value={filters.currency ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    currency: event.target.value as PayslipFilters['currency'],
                  }))
                }
                options={[{ value: '', label: 'All currencies' }, ...SALARY_CURRENCY_OPTIONS]}
              />
            </>
          }
        />
      ) : null}

      {error ? (
        <ErrorState title="Unable to load payslips" message={error} />
      ) : (
        <>
          <DataTable
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No payslips found."
            emptyDescription="Payslips are available after finalized payroll snapshots are generated."
            columnCount={8}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Payslip</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                      onClick={() => navigate(`/payslips/${payslip.id}`)}
                    >
                      {payslip.payslipNumber}
                    </button>
                    <div className="text-xs text-surface-500">{payslip.payrollRunId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payslip.employeeNameSnapshot}</div>
                    <div className="text-xs text-surface-500">{payslip.employeeCodeSnapshot}</div>
                  </TableCell>
                  <TableCell>{payslip.monthKey}</TableCell>
                  <TableCell>
                    <div>{payslip.departmentSnapshot}</div>
                    <div className="text-xs text-surface-500">{payslip.designationSnapshot}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatSalaryAmount(payslip.netSalary, payslip.currency)}
                  </TableCell>
                  <TableCell>{formatDate(payslip.generatedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={statusTone[payslip.status]}
                      label={payslip.status.replace('_', ' ')}
                    />
                  </TableCell>
                  <TableCell>
                    <PayslipActions
                      payslip={payslip}
                      compact
                      className="justify-end"
                      onArchive={(archived) =>
                        setRows((prev) => prev.map((row) => (row.id === archived.id ? archived : row)))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
