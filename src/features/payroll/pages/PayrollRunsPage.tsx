import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Modal,
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
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { PAYROLL_STATUS_OPTIONS } from '../constants'
import { payrollService } from '../services/payrollService'
import type { PayrollRun, PayrollRunFilters } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'

const defaultFilters: PayrollRunFilters = {
  search: '',
  month: '',
  year: '',
  status: '',
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: formatDate(new Date(2026, i, 1), 'MMMM'),
}))

export function PayrollRunsPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canCreate = hasPermission(PERMISSIONS.PAYROLL_CREATE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canCalculate =
    hasPermission(PERMISSIONS.PAYROLL_CALCULATE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canApprove =
    hasPermission(PERMISSIONS.PAYROLL_APPROVE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canReject =
    hasPermission(PERMISSIONS.PAYROLL_REJECT) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canEdit = hasPermission(PERMISSIONS.PAYROLL_EDIT) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canProcess =
    hasPermission(PERMISSIONS.PAYROLL_PROCESS) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canDelete =
    hasPermission(PERMISSIONS.PAYROLL_DELETE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)

  const [rows, setRows] = useState<PayrollRun[]>([])
  const [filters, setFilters] = useState<PayrollRunFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [pendingCancel, setPendingCancel] = useState<PayrollRun | null>(null)
  const [pendingReject, setPendingReject] = useState<PayrollRun | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const actor = user?.name ?? user?.email ?? 'User'

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await payrollService.getPayrollRuns(filters))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  async function runAction(
    label: string,
    fn: () => Promise<unknown>,
    successMessage: string,
  ) {
    setActionLoading(true)
    try {
      await fn()
      showSuccess(successMessage)
      await load()
    } catch (error) {
      showError(getPayrollErrorMessage(error, `Failed to ${label}.`))
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading && rows.length === 0) return <PageLoader label="Loading payroll runs" />
  if (hasError) return <ErrorState title="Unable to load payroll runs" message="Please try again." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Runs"
        description="Create, calculate, approve, and finalize payroll periods."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Runs' },
        ]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/payroll/runs/new')}>
              New Payroll Run
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder="Search by run name, employee name, or ID"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <>
            <Select
              label="Month"
              value={filters.month === '' || filters.month == null ? '' : String(filters.month)}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  month: e.target.value ? Number(e.target.value) : '',
                }))
              }
              options={[{ value: '', label: 'All months' }, ...monthOptions]}
            />
            <Select
              label="Year"
              value={filters.year === '' || filters.year == null ? '' : String(filters.year)}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  year: e.target.value ? Number(e.target.value) : '',
                }))
              }
              options={[
                { value: '', label: 'All years' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
              ]}
            />
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: (e.target.value || '') as PayrollRunFilters['status'],
                }))
              }
              options={[{ value: '', label: 'All statuses' }, ...PAYROLL_STATUS_OPTIONS]}
            />
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No payroll runs found."
          description="Create a payroll run for the current period to get started."
          actionLabel={canCreate ? 'New Payroll Run' : undefined}
          onAction={canCreate ? () => navigate('/payroll/runs/new') : undefined}
        />
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Payroll Month</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((run) => {
              const canRecalc =
                canCalculate && ['draft', 'processing', 'calculated'].includes(run.status)
              const canSubmit = canProcess && run.status === 'calculated'
              const canApproveRun =
                canApprove && (run.status === 'pending_approval' || run.status === 'calculated')
              const canRejectRun =
                canReject && (run.status === 'pending_approval' || run.status === 'approved')
              const canFinalize = canProcess && run.status === 'approved'
              const canCancel = canDelete && run.status !== 'finalized' && run.status !== 'cancelled'
              const canEditRun = canEdit && ['draft', 'calculated'].includes(run.status)

              const moreItems = [
                ...(canRecalc
                  ? [
                      {
                        id: 'calculate',
                        label: 'Calculate',
                        disabled: actionLoading,
                        onClick: () =>
                          void runAction(
                            'calculate',
                            () => payrollService.calculatePayrollRun(run.id, actor),
                            'Payroll calculated successfully.',
                          ),
                      },
                    ]
                  : []),
                ...(canSubmit
                  ? [
                      {
                        id: 'submit',
                        label: 'Submit for approval',
                        disabled: actionLoading,
                        onClick: () =>
                          void runAction(
                            'submit',
                            () => payrollService.submitForApproval(run.id, actor),
                            'Payroll submitted for approval.',
                          ),
                      },
                    ]
                  : []),
                ...(canApproveRun
                  ? [
                      {
                        id: 'approve',
                        label: 'Approve',
                        disabled: actionLoading,
                        onClick: () =>
                          void runAction(
                            'approve',
                            () => payrollService.approvePayrollRun(run.id, actor),
                            'Payroll approved successfully.',
                          ),
                      },
                    ]
                  : []),
                ...(canRejectRun
                  ? [
                      {
                        id: 'reject',
                        label: 'Reject',
                        onClick: () => setPendingReject(run),
                      },
                    ]
                  : []),
                ...(canFinalize
                  ? [
                      {
                        id: 'finalize',
                        label: 'Finalize',
                        disabled: actionLoading,
                        onClick: () =>
                          void runAction(
                            'finalize',
                            () => payrollService.finalizePayrollRun(run.id, actor),
                            'Payroll finalized successfully.',
                          ),
                      },
                    ]
                  : []),
                ...(canCancel
                  ? [
                      {
                        id: 'cancel',
                        label: 'Cancel',
                        onClick: () => setPendingCancel(run),
                      },
                    ]
                  : []),
              ]

              return (
                <TableRow key={run.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                      onClick={() => navigate(`/payroll/runs/${run.id}`)}
                    >
                      {run.name}
                    </button>
                    <div className="text-xs text-surface-500">{run.monthKey}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{run.employeeCount}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatSalaryAmount(run.grossPayroll, run.currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatSalaryAmount(run.totalDeductions, run.currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatSalaryAmount(run.totalEmployerContribution, run.currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatSalaryAmount(run.totalNetPayroll, run.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={payrollStatusTone(run.status)}
                      label={payrollStatusLabel(run.status)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(run.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      onView={() => navigate(`/payroll/runs/${run.id}`)}
                      onEdit={
                        canEditRun ? () => navigate(`/payroll/runs/${run.id}/edit`) : undefined
                      }
                      moreItems={moreItems}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </DataTable>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel payroll run?"
        description="This will mark the payroll as cancelled. Finalized payroll cannot be cancelled."
        confirmLabel="Cancel run"
        onConfirm={() => {
          if (!pendingCancel) return
          void runAction(
            'cancel',
            () => payrollService.cancelPayrollRun(pendingCancel.id, actor),
            'Payroll cancelled.',
          ).finally(() => setPendingCancel(null))
        }}
        onClose={() => setPendingCancel(null)}
      />

      <Modal
        open={Boolean(pendingReject)}
        onClose={() => {
          setPendingReject(null)
          setRejectReason('')
        }}
        title="Reject payroll run?"
        description="The run will return to Calculated status."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPendingReject(null)
                setRejectReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading || !rejectReason.trim()}
              onClick={() => {
                if (!pendingReject) return
                void runAction(
                  'reject',
                  () =>
                    payrollService.rejectPayrollRun(pendingReject.id, rejectReason, actor),
                  'Payroll rejected.',
                ).finally(() => {
                  setPendingReject(null)
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
          label="Rejection reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          required
        />
      </Modal>
    </div>
  )
}
