import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  PageLoader,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui'
import type { StatusTone } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPayslipErrorMessage,
  payslipService,
  type BulkGenerationPreview,
  type Payslip,
} from '@/features/payslip'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { PayrollRunSummary } from '../components/PayrollRunSummary'
import { PAYROLL_EMPLOYEE_STATUS_LABELS } from '../constants'
import { payrollService } from '../services/payrollService'
import type {
  DepartmentPayrollSummary,
  PayrollAuditEvent,
  PayrollEmployee,
  PayrollEmployeeStatus,
  PayrollRun,
} from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'

const EMPLOYEE_STATUS_TONE: Record<PayrollEmployeeStatus, StatusTone> = {
  pending: 'pending',
  ready: 'active',
  calculated: 'approved',
  error: 'rejected',
  excluded: 'inactive',
}

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const actor = user?.name ?? 'System'

  const canView = hasPermission(PERMISSIONS.PAYROLL_VIEW) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canCalculate =
    hasPermission(PERMISSIONS.PAYROLL_CALCULATE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canProcess =
    hasPermission(PERMISSIONS.PAYROLL_PROCESS) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canApprove =
    hasPermission(PERMISSIONS.PAYROLL_APPROVE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canReject = hasPermission(PERMISSIONS.PAYROLL_REJECT) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canEdit = hasPermission(PERMISSIONS.PAYROLL_EDIT) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canDelete =
    hasPermission(PERMISSIONS.PAYROLL_DELETE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canGeneratePayslip =
    hasPermission(PERMISSIONS.PAYSLIP_GENERATE) || hasPermission(PERMISSIONS.PAYSLIP_MANAGE)

  const [run, setRun] = useState<PayrollRun | null>(null)
  const [employees, setEmployees] = useState<PayrollEmployee[]>([])
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentPayrollSummary[]>([])
  const [auditEvents, setAuditEvents] = useState<PayrollAuditEvent[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [bulkPreview, setBulkPreview] = useState<BulkGenerationPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [payslipActionLoading, setPayslipActionLoading] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [runRow, employeeRows, departmentRows, auditRows] = await Promise.all([
        payrollService.getPayrollRunById(id),
        payrollService.getRunEmployees(id),
        payrollService.getDepartmentSummary(id),
        payrollService.getAuditEvents(id),
      ])
      let runPayslips: Payslip[] = []
      let preview: BulkGenerationPreview | null = null
      if (runRow.status === 'finalized') {
        const [allPayslips, previewRow] = await Promise.all([
          payslipService.getPayslips({}),
          payslipService.getBulkGenerationPreview(id),
        ])
        runPayslips = allPayslips.filter((payslip) => payslip.payrollRunId === id)
        preview = previewRow
      }
      setRun(runRow)
      setEmployees(employeeRows)
      setDepartmentSummary(departmentRows)
      setAuditEvents(auditRows)
      setPayslips(runPayslips)
      setBulkPreview(preview)
    } catch (err) {
      setError(getPayrollErrorMessage(err, 'Failed to load payroll run.'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const actions = useMemo(() => {
    if (!run || run.status === 'finalized' || run.status === 'cancelled') return []
    return [
      ...(canCalculate && ['draft', 'processing'].includes(run.status)
        ? [
            {
              label: 'Calculate',
              onClick: () =>
                runAction(
                  'calculate',
                  () => payrollService.calculatePayrollRun(run.id, actor),
                  'Payroll calculated successfully.',
                ),
            },
          ]
        : []),
      ...(canCalculate && run.status === 'calculated'
        ? [
            {
              label: 'Recalculate',
              onClick: () =>
                runAction(
                  'recalculate',
                  () => payrollService.recalculatePayrollRun(run.id, actor),
                  'Payroll recalculated successfully.',
                ),
            },
          ]
        : []),
      ...(canProcess && run.status === 'calculated'
        ? [
            {
              label: 'Submit',
              onClick: () =>
                runAction(
                  'submit',
                  () => payrollService.submitForApproval(run.id, actor),
                  'Payroll submitted for approval.',
                ),
            },
          ]
        : []),
      ...(canApprove && (run.status === 'pending_approval' || run.status === 'calculated')
        ? [
            {
              label: 'Approve',
              onClick: () =>
                runAction(
                  'approve',
                  () => payrollService.approvePayrollRun(run.id, actor),
                  'Payroll approved successfully.',
                ),
            },
          ]
        : []),
      ...(canReject && (run.status === 'pending_approval' || run.status === 'approved')
        ? [
            {
              label: 'Reject',
              variant: 'danger' as const,
              onClick: () => setRejectOpen(true),
            },
          ]
        : []),
      ...(canProcess && run.status === 'approved'
        ? [
            {
              label: 'Finalize',
              onClick: () =>
                runAction(
                  'finalize',
                  () => payrollService.finalizePayrollRun(run.id, actor),
                  'Payroll finalized successfully.',
                ),
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              label: 'Cancel',
              variant: 'danger' as const,
              onClick: () => setCancelOpen(true),
            },
          ]
        : []),
    ]
    // runAction is stable enough for this event-list use because it reads current state on click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, canApprove, canCalculate, canDelete, canProcess, canReject, run])

  const payslipsByPayrollEmployeeId = useMemo(
    () => new Map(payslips.map((payslip) => [payslip.payrollEmployeeId, payslip])),
    [payslips],
  )

  async function runAction(
    label: string,
    fn: () => Promise<PayrollRun>,
    successMessage: string,
  ) {
    setActionLoading(true)
    try {
      await fn()
      showSuccess(successMessage)
      await load()
    } catch (err) {
      showError(getPayrollErrorMessage(err, `Failed to ${label} payroll.`))
    } finally {
      setActionLoading(false)
    }
  }

  async function runPayslipAction(label: string, fn: () => Promise<unknown>, successMessage: string) {
    setPayslipActionLoading(label)
    try {
      await fn()
      showSuccess(successMessage)
      await load()
    } catch (err) {
      showError(getPayslipErrorMessage(err, `Failed to ${label}.`))
    } finally {
      setPayslipActionLoading(null)
    }
  }

  if (!canView) {
    return <ErrorState title="Access denied" message="You do not have permission to view payroll runs." />
  }
  if (isLoading) return <PageLoader label="Loading payroll run" />
  if (error || !run) {
    return <ErrorState title="Unable to load payroll run" message={error ?? 'Payroll run not found.'} />
  }

  const isLocked = run.status === 'finalized'
  const canEditRun = canEdit && ['draft', 'calculated'].includes(run.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title={run.name}
        description={`${run.monthKey} payroll processing details and employee results.`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Runs', href: '/payroll/runs' },
          { label: run.name },
        ]}
        actions={
          <>
            {canEditRun ? (
              <Button variant="secondary" onClick={() => navigate(`/payroll/runs/${run.id}/edit`)}>
                Edit
              </Button>
            ) : null}
            {run.status === 'finalized' && canGeneratePayslip ? (
              <Button
                variant="success"
                isLoading={payslipActionLoading === 'generate all payslips'}
                disabled={!bulkPreview || bulkPreview.remaining === 0}
                onClick={() =>
                  void runPayslipAction(
                    'generate all payslips',
                    () => payslipService.generateAllPayslips(run.id, actor),
                    bulkPreview?.remaining
                      ? `Generated ${bulkPreview.remaining} payslip(s).`
                      : 'All payslips are already generated.',
                  )
                }
              >
                Generate All Payslips
              </Button>
            ) : null}
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'primary'}
                isLoading={actionLoading}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </>
        }
      />

      {isLocked ? (
        <Card className="border-success-200 bg-success-50/70 dark:border-success-900 dark:bg-success-950/30">
          <CardContent>
            <p className="text-sm font-medium text-success-800 dark:text-success-200">
              This payroll run is finalized and locked. Employee calculations, totals, and audit history are
              read-only.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {run.status === 'finalized' && bulkPreview ? (
        <Card className="border-info-100 bg-info-50/70 dark:border-info-950 dark:bg-info-950/30">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-info-700 dark:text-info-100">
                  Payslip generation
                </p>
                <p className="mt-1 text-sm text-info-700 dark:text-info-100">
                  {bulkPreview.alreadyGenerated} of {bulkPreview.total} payslips generated;{' '}
                  {bulkPreview.remaining} remaining.
                </p>
              </div>
              {canGeneratePayslip && bulkPreview.remaining > 0 ? (
                <Button
                  size="sm"
                  variant="success"
                  isLoading={payslipActionLoading === 'generate all payslips'}
                  onClick={() =>
                    void runPayslipAction(
                      'generate all payslips',
                      () => payslipService.generateAllPayslips(run.id, actor),
                      `Generated ${bulkPreview.remaining} payslip(s).`,
                    )
                  }
                >
                  Generate remaining
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Run summary</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Created by {run.createdBy}; last updated by {run.updatedBy}.
              </p>
            </div>
            <StatusBadge status={payrollStatusTone(run.status)} label={payrollStatusLabel(run.status)} />
          </div>
          <PayrollRunSummary run={run} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Employees</h2>
          {employees.length === 0 ? (
            <EmptyState title="No employees in this payroll run." description="Create a run with employees first." />
          ) : (
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Unpaid</TableHead>
                  <TableHead>OT</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const payslip = payslipsByPayrollEmployeeId.get(employee.id)
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left font-medium text-brand-700 hover:underline dark:text-brand-300"
                          onClick={() =>
                            navigate(`/payroll/employees/${employee.employeeId}?runId=${run.id}`)
                          }
                        >
                          {employee.employeeName}
                        </button>
                        <div className="text-xs text-surface-500">{employee.employeeCode}</div>
                      </TableCell>
                      <TableCell>
                        <div>{employee.departmentName}</div>
                        <div className="text-xs text-surface-500">{employee.designationName}</div>
                      </TableCell>
                      <TableCell className="tabular-nums">{employee.presentDays}</TableCell>
                      <TableCell className="tabular-nums">{employee.unpaidLeaveDays}</TableCell>
                      <TableCell className="tabular-nums">{employee.overtimeHours}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(employee.grossEarnings, employee.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(employee.totalDeductions, employee.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(employee.netSalary, employee.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={EMPLOYEE_STATUS_TONE[employee.status]}
                          label={PAYROLL_EMPLOYEE_STATUS_LABELS[employee.status]}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <TableActions
                            onView={() => navigate(`/payroll/employees/${employee.employeeId}?runId=${run.id}`)}
                          />
                          {run.status === 'finalized' && payslip ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/payslips/${payslip.id}`)}
                            >
                              View Payslip
                            </Button>
                          ) : null}
                          {run.status === 'finalized' && !payslip && canGeneratePayslip ? (
                            <Button
                              size="sm"
                              variant="success"
                              disabled={employee.status !== 'calculated'}
                              isLoading={payslipActionLoading === `generate payslip ${employee.id}`}
                              onClick={() =>
                                void runPayslipAction(
                                  `generate payslip ${employee.id}`,
                                  () => payslipService.generatePayslip(employee.id, actor),
                                  'Payslip generated successfully.',
                                )
                              }
                            >
                              Generate Payslip
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              Department summary
            </h2>
            {departmentSummary.length === 0 ? (
              <EmptyState
                title="No department summary yet."
                description="Calculate payroll to populate department totals."
              />
            ) : (
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Employer Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentSummary.map((department) => (
                    <TableRow key={department.departmentId}>
                      <TableCell>{department.departmentName}</TableCell>
                      <TableCell className="tabular-nums">{department.employees}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(department.grossPayroll, run.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(department.deductions, run.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(department.netPayroll, run.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatSalaryAmount(department.employerCost, run.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Audit trail</h2>
            {auditEvents.length === 0 ? (
              <EmptyState title="No audit events found." description="Payroll actions will appear here." />
            ) : (
              <ul className="divide-y divide-surface-200 dark:divide-surface-800">
                {auditEvents.map((event) => (
                  <li key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium capitalize text-surface-900 dark:text-surface-50">
                        {event.action.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-surface-500">{formatDateTime(event.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-surface-600 dark:text-surface-300">
                      {event.user}
                      {event.previousStatus || event.newStatus ? (
                        <>
                          {' '}
                          moved status from {event.previousStatus ?? 'none'} to {event.newStatus ?? 'none'}.
                        </>
                      ) : null}
                    </p>
                    {event.reason ? <p className="mt-1 text-xs text-surface-500">{event.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel payroll run?"
        description="This will mark the payroll run as cancelled. Finalized payroll runs cannot be cancelled."
        confirmLabel="Cancel run"
        isLoading={actionLoading}
        onConfirm={() => {
          void runAction(
            'cancel',
            () => payrollService.cancelPayrollRun(run.id, actor),
            'Payroll cancelled.',
          ).finally(() => setCancelOpen(false))
        }}
        onClose={() => setCancelOpen(false)}
      />

      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false)
          setRejectReason('')
        }}
        title="Reject payroll run"
        description="The run will return to Calculated status and the rejection reason will be recorded."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={actionLoading}
              onClick={() => {
                setRejectOpen(false)
                setRejectReason('')
              }}
            >
              Close
            </Button>
            <Button
              variant="danger"
              isLoading={actionLoading}
              disabled={!rejectReason.trim()}
              onClick={() => {
                void runAction(
                  'reject',
                  () => payrollService.rejectPayrollRun(run.id, rejectReason, actor),
                  'Payroll rejected.',
                ).finally(() => {
                  setRejectOpen(false)
                  setRejectReason('')
                })
              }}
            >
              Reject
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          rows={4}
          required
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>
    </div>
  )
}
