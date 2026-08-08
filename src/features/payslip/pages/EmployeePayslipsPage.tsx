import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DataTable,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type StatusTone,
} from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService } from '@/features/employees/services/employeeService'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate } from '@/utils/date'
import { PayslipActions } from '../components/PayslipActions'
import { payslipService } from '../services/payslipService'
import type { Payslip, PayslipStatus } from '../types'
import { getPayslipErrorMessage } from '../utils/errors'

const statusTone: Record<PayslipStatus, StatusTone> = {
  generated: 'draft',
  published: 'approved',
  archived: 'inactive',
}

export function EmployeePayslipsPage() {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rows, setRows] = useState<Payslip[]>([])
  const [employeeName, setEmployeeName] = useState('Employee')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!employeeId) return
    setIsLoading(true)
    setError(null)
    try {
      if (user?.role === ROLES.EMPLOYEE) {
        const linkedEmployeeId = await attendanceService.resolveLinkedEmployeeId(user)
        if (!linkedEmployeeId || linkedEmployeeId !== employeeId) {
          setError('You can only view your own payslips.')
          setRows([])
          return
        }
      }
      const [payslips, employee] = await Promise.all([
        payslipService.getEmployeePayslips(employeeId),
        employeeService.getEmployeeById(employeeId).catch(() => null),
      ])
      setRows(payslips)
      setEmployeeName(employee?.fullName ?? payslips[0]?.employeeNameSnapshot ?? 'Employee')
    } catch (err) {
      setError(getPayslipErrorMessage(err, 'Failed to load employee payslips.'))
    } finally {
      setIsLoading(false)
    }
  }, [employeeId, user])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) return <PageLoader label="Loading employee payslips" />
  if (error) return <ErrorState title="Unable to load employee payslips" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employeeName} Payslips`}
        description="Employee salary documents generated from finalized payroll snapshots."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payslips', href: '/payslips' },
          { label: employeeName },
        ]}
      />

      <DataTable
        isEmpty={rows.length === 0}
        emptyTitle="No payslips found."
        emptyDescription="Payslips will appear after payroll is finalized and generated."
        columnCount={6}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Payslip</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((payslip) => (
            <TableRow key={payslip.id}>
              <TableCell>
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                  onClick={() => navigate(`/payslips/${payslip.id}`)}
                >
                  {payslip.payslipNumber}
                </button>
              </TableCell>
              <TableCell>{payslip.monthKey}</TableCell>
              <TableCell className="tabular-nums">
                {formatSalaryAmount(payslip.netSalary, payslip.currency)}
              </TableCell>
              <TableCell>{formatDate(payslip.generatedAt)}</TableCell>
              <TableCell>
                <StatusBadge status={statusTone[payslip.status]} label={payslip.status} />
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
    </div>
  )
}
