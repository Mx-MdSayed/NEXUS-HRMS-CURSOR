import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { attendanceService } from '@/features/attendance/services/attendanceService'
import { employeeService } from '@/features/employees'
import { formatDate } from '@/utils/date'
import { SalaryPreview } from '../components/SalaryPreview'
import { employeeSalaryService } from '../services/employeeSalaryService'
import { salaryCalculationService } from '../services/salaryCalculationService'
import type { EmployeeSalary, SalaryCalculationResult } from '../types'
import { formatSalaryAmount } from '../utils/money'
import { getSalaryErrorMessage } from '../utils/errors'

export function EmployeeSalaryPage() {
  const { employeeId = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SALARY_MANAGE) || hasPermission(PERMISSIONS.SALARY_ASSIGN)
  const canView = hasPermission(PERMISSIONS.SALARY_VIEW)
  const canRevise = hasPermission(PERMISSIONS.SALARY_REVISE) || canManage

  const [employeeName, setEmployeeName] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [designationName, setDesignationName] = useState('')
  const [current, setCurrent] = useState<EmployeeSalary | null>(null)
  const [history, setHistory] = useState<EmployeeSalary[]>([])
  const [preview, setPreview] = useState<SalaryCalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        if (!canView) {
          setError('You do not have permission to view salary information.')
          return
        }

        const linked = await attendanceService.resolveLinkedEmployeeId(user ?? undefined)
        if (!canManage && linked !== employeeId) {
          setError('You can only view your own compensation.')
          return
        }

        const employee = await employeeService.getEmployeeById(employeeId)
        const [depts, desigs, active, hist] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getDesignations(),
          employeeSalaryService.getEmployeeSalary(employeeId),
          employeeSalaryService.getSalaryHistory(employeeId),
        ])
        if (cancelled) return
        setEmployeeName(employee.fullName)
        setEmployeeCode(employee.employeeCode)
        setDepartmentName(depts.find((item) => item.id === employee.departmentId)?.name ?? '—')
        setDesignationName(desigs.find((item) => item.id === employee.designationId)?.name ?? '—')
        setCurrent(active)
        setHistory(hist)
        if (active) {
          setPreview(
            salaryCalculationService.calculateSalaryStructure(
              active.components.map((line) => ({
                componentId: line.componentId,
                fixedAmount: line.fixedAmount,
                percentage: line.percentage,
                displayOrder: line.displayOrder,
                override: line.override,
              })),
              active.currency,
            ),
          )
        }
      } catch (err) {
        if (!cancelled) setError(getSalaryErrorMessage(err, 'Failed to load employee salary.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canManage, canView, employeeId, user])

  if (isLoading) return <PageLoader label="Loading compensation" />
  if (error) return <ErrorState title="Unable to load compensation" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={employeeName || 'Employee compensation'}
        description={`${employeeCode} · ${departmentName} · ${designationName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: employeeCode || employeeId },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/employees/${employeeId}`)}>
              Employee profile
            </Button>
            {canRevise ? (
              <Button onClick={() => navigate('/salary/revisions')}>Create revision</Button>
            ) : null}
          </div>
        }
      />

      {!current ? (
        <EmptyState
          title="No salary assigned."
          description="Assign a salary structure to this employee to begin."
          actionLabel={canManage ? 'Assign salary' : undefined}
          onAction={canManage ? () => navigate('/salary/assignments/new') : undefined}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent>
                <p className="text-sm text-surface-500">Monthly gross</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatSalaryAmount(current.monthlyGross, current.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-surface-500">Annual gross</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatSalaryAmount(current.annualGross, current.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-surface-500">Monthly CTC</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatSalaryAmount(current.monthlyCTC, current.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-surface-500">Annual CTC</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatSalaryAmount(current.annualCTC, current.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="active" />
                  <span className="text-sm text-surface-500">
                    Effective {formatDate(current.effectiveFrom)}
                    {current.effectiveTo ? ` – ${formatDate(current.effectiveTo)}` : ''}
                  </span>
                </div>
                <p className="text-sm">
                  Structure:{' '}
                  <Link
                    to={`/salary/structures/${current.structureId}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {current.structureName} ({current.structureCode})
                  </Link>
                </p>
                <p className="text-sm text-surface-500">Currency: {current.currency}</p>
                {current.revisionReason ? (
                  <p className="text-sm">Reason: {current.revisionReason}</p>
                ) : null}
                {current.components.some((item) => item.override) ? (
                  <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-800 dark:bg-warning-950/40 dark:text-warning-200">
                    This package includes employee-specific overrides (structure master unchanged).
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <SalaryPreview result={preview} currency={current.currency} />
          </div>
        </>
      )}

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-card-title">Compensation history</h2>
          {history.length === 0 ? (
            <EmptyState title="No salary history available." description="Past packages will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-surface-200 text-xs uppercase text-surface-500 dark:border-surface-700">
                  <tr>
                    <th className="px-3 py-2">Effective From</th>
                    <th className="px-3 py-2">Effective To</th>
                    <th className="px-3 py-2">Monthly Gross</th>
                    <th className="px-3 py-2">Annual Gross</th>
                    <th className="px-3 py-2">Monthly CTC</th>
                    <th className="px-3 py-2">Annual CTC</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Changed By</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-surface-100 dark:border-surface-800"
                    >
                      <td className="px-3 py-2.5">{formatDate(item.effectiveFrom)}</td>
                      <td className="px-3 py-2.5">
                        {item.effectiveTo ? formatDate(item.effectiveTo) : '—'}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatSalaryAmount(item.monthlyGross, item.currency)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatSalaryAmount(item.annualGross, item.currency)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatSalaryAmount(item.monthlyCTC, item.currency)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatSalaryAmount(item.annualCTC, item.currency)}
                      </td>
                      <td className="px-3 py-2.5">{item.revisionReason ?? '—'}</td>
                      <td className="px-3 py-2.5">{item.updatedBy}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          status={item.status === 'superseded' ? 'inactive' : item.status}
                          label={item.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
