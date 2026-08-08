import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Select,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees/services/employeeService'
import { formatDate, formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { CorrectionFormModal } from '../components/CorrectionFormModal'
import { ATTENDANCE_STATUS_LABELS, CORRECTION_STATUS_OPTIONS } from '../constants'
import { attendanceService } from '../services/attendanceService'
import type { AttendanceCorrection, CorrectionFilters } from '../types'
import { getAttendanceErrorMessage } from '../utils/errors'

export function AttendanceCorrectionsPage() {
  const { user, hasPermission, hasRole } = useAuth()
  const isEmployee = hasRole(ROLES.EMPLOYEE)
  const canApprove = hasPermission(PERMISSIONS.ATTENDANCE_APPROVE) || hasPermission(PERMISSIONS.ATTENDANCE_MANAGE)

  const [filters, setFilters] = useState<CorrectionFilters>({ search: '', status: '' })
  const [rows, setRows] = useState<AttendanceCorrection[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    id: string
    type: 'approve' | 'reject'
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isEmployee && user) {
      void attendanceService.resolveLinkedEmployeeId(user).then(setSelfId)
    }
  }, [isEmployee, user])

  useEffect(() => {
    void employeeService.getEmployees({ page: 1, pageSize: 200 }).then((result) => {
      const map: Record<string, string> = {}
      result.data.forEach((item) => {
        map[item.id] = `${item.fullName} (${item.employeeCode})`
      })
      setNames(map)
    })
  }, [])

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await attendanceService.getCorrectionRequests({
        ...filters,
        employeeId: isEmployee ? selfId ?? undefined : filters.employeeId,
      })
      setRows(result)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters, isEmployee, selfId])

  useEffect(() => {
    if (isEmployee && !selfId) return
    void load()
  }, [isEmployee, load, selfId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Corrections"
        description="Review and manage attendance correction requests."
        breadcrumbs={[{ label: 'Home' }, { label: 'Attendance' }, { label: 'Corrections' }]}
        actions={
          isEmployee ? (
            <Button onClick={() => setModalOpen(true)}>Request Correction</Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search reason, employee, date…"
        onReset={() => setFilters({ search: '', status: '' })}
        filters={
          <Select
            label="Status"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as CorrectionFilters['status'],
              }))
            }
            options={[{ value: '', label: 'All statuses' }, ...CORRECTION_STATUS_OPTIONS]}
          />
        }
      />

      {hasError ? (
        <ErrorState
          title="Unable to load corrections"
          message="Please try again."
          onRetry={() => void load()}
        />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No correction requests found"
          emptyDescription="Correction requests will appear here."
          columnCount={8}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Reviewed</TableHead>
              {!isEmployee ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{names[row.employeeId] ?? row.employeeId}</TableCell>
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell>
                  {row.currentStatus ? ATTENDANCE_STATUS_LABELS[row.currentStatus] : '—'}
                </TableCell>
                <TableCell>{ATTENDANCE_STATUS_LABELS[row.requestedStatus]}</TableCell>
                <TableCell className="max-w-xs truncate">{row.reason}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p>{row.requestedBy}</p>
                    <p className="text-surface-500">{formatDateTime(row.requestedAt)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {row.reviewedBy ? (
                    <div className="text-xs">
                      <p>{row.reviewedBy}</p>
                      <p className="text-surface-500">
                        {row.reviewedAt ? formatDateTime(row.reviewedAt) : '—'}
                      </p>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                {!isEmployee ? (
                  <TableCell>
                    {row.status === 'pending' && canApprove ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => setPendingAction({ id: row.id, type: 'approve' })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setPendingAction({ id: row.id, type: 'reject' })}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-surface-400">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <CorrectionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isSubmitting={saving}
        onSubmit={async (values) => {
          if (!selfId) {
            showError('Unable to resolve your employee profile.')
            return
          }
          setSaving(true)
          try {
            await attendanceService.createCorrectionRequest(
              {
                employeeId: selfId,
                date: values.date,
                requestedStatus: values.requestedStatus,
                requestedCheckIn: values.requestedCheckIn,
                requestedCheckOut: values.requestedCheckOut,
                reason: values.reason,
              },
              user?.name ?? 'System',
            )
            showSuccess('Correction request submitted.')
            setModalOpen(false)
            await load()
          } catch (error) {
            showError(getAttendanceErrorMessage(error, 'Unable to submit correction request.'))
          } finally {
            setSaving(false)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.type === 'approve' ? 'Approve correction?' : 'Reject correction?'}
        description={
          pendingAction?.type === 'approve'
            ? 'Approving will update the attendance record.'
            : 'Rejecting keeps the original attendance values.'
        }
        confirmLabel={pendingAction?.type === 'approve' ? 'Approve' : 'Reject'}
        tone={pendingAction?.type === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingAction) return
          setActionLoading(true)
          const action =
            pendingAction.type === 'approve'
              ? attendanceService.approveCorrection(pendingAction.id, user?.name ?? 'System')
              : attendanceService.rejectCorrection(pendingAction.id, user?.name ?? 'System')
          void action
            .then(() => {
              showSuccess(
                pendingAction.type === 'approve'
                  ? 'Correction approved successfully.'
                  : 'Correction rejected.',
              )
              setPendingAction(null)
              void load()
            })
            .catch((error) =>
              showError(getAttendanceErrorMessage(error, 'Unable to update correction.')),
            )
            .finally(() => setActionLoading(false))
        }}
      />
    </div>
  )
}
