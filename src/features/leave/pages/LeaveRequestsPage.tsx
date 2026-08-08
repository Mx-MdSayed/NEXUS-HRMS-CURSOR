import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
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
import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { LEAVE_REQUEST_STATUS_LABELS, LEAVE_REQUEST_STATUS_OPTIONS } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveRequestFilters, LeaveRequestListItem, LeaveType } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

const defaultFilters: LeaveRequestFilters = {
  search: '',
  status: '',
  leaveTypeId: '',
  departmentId: '',
}

export function LeaveRequestsPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canApprove = hasPermission(PERMISSIONS.LEAVE_APPROVE)
  const canReject = hasPermission(PERMISSIONS.LEAVE_REJECT)
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE)
  const canCancel = hasPermission(PERMISSIONS.LEAVE_CANCEL) || canManage

  const [rows, setRows] = useState<LeaveRequestListItem[]>([])
  const [types, setTypes] = useState<LeaveType[]>([])
  const [filters, setFilters] = useState<LeaveRequestFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  const [approveTarget, setApproveTarget] = useState<LeaveRequestListItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<LeaveRequestListItem | null>(null)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestListItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const isSelfService = !canManage && !canApprove

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
      setEmployeeId(linked)
      const effectiveFilters: LeaveRequestFilters = {
        ...filters,
        employeeId: isSelfService ? linked ?? undefined : filters.employeeId,
      }
      const result = await leaveService.getLeaveRequests(effectiveFilters, page, DEFAULT_PAGE_SIZE)
      setRows(result.data)
      setTotalPages(result.totalPages)
    } catch {
      setHasError(true)
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, isSelfService, page, user])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void leaveService.getLeaveTypes(true).then(setTypes)
  }, [])

  const departments = listActiveDepartmentOptions()

  const updateFilter = <K extends keyof LeaveRequestFilters>(
    key: K,
    value: LeaveRequestFilters[K],
  ) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description={
          isSelfService
            ? 'Your leave request history.'
            : 'Review, approve, and manage organization leave requests.'
        }
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Requests' },
        ]}
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder="Search employee, leave type, reason…"
        onReset={() => {
          setFilters(defaultFilters)
          setPage(1)
        }}
        filters={
          <>
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                updateFilter('status', event.target.value as LeaveRequestFilters['status'])
              }
              options={LEAVE_REQUEST_STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
            <Select
              label="Leave type"
              value={filters.leaveTypeId ?? ''}
              onChange={(event) => updateFilter('leaveTypeId', event.target.value)}
              options={[
                { value: '', label: 'All types' },
                ...types.map((type) => ({ value: type.id, label: type.name })),
              ]}
            />
            {!isSelfService ? (
              <Select
                label="Department"
                value={filters.departmentId ?? ''}
                onChange={(event) => updateFilter('departmentId', event.target.value)}
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
                ]}
              />
            ) : null}
          </>
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load leave requests" message="Please try again." />
      ) : (
        <>
          <DataTable
            isLoading={isLoading}
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No leave requests found."
            emptyDescription="Adjust filters or apply for leave."
            columnCount={isSelfService ? 7 : 8}
          >
            <TableHeader>
              <TableRow>
                {!isSelfService ? <TableHead>Employee</TableHead> : null}
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const moreItems = [
                  ...(canApprove && row.status === 'pending'
                    ? [
                        {
                          id: 'approve',
                          label: 'Approve',
                          onClick: () => setApproveTarget(row),
                        },
                      ]
                    : []),
                  ...(canReject && row.status === 'pending'
                    ? [
                        {
                          id: 'reject',
                          label: 'Reject',
                          danger: true,
                          onClick: () => setRejectTarget(row),
                        },
                      ]
                    : []),
                  ...(canCancel && (row.status === 'pending' || row.status === 'approved')
                    ? [
                        {
                          id: 'cancel',
                          label: row.status === 'pending' ? 'Withdraw' : 'Cancel',
                          danger: true,
                          onClick: () => setCancelTarget(row),
                        },
                      ]
                    : []),
                ]
                return (
                  <TableRow key={row.id}>
                    {!isSelfService ? (
                      <TableCell>
                        <div className="font-medium">{row.employeeName}</div>
                        <div className="text-xs text-surface-500">{row.employeeCode}</div>
                      </TableCell>
                    ) : null}
                    <TableCell>{row.leaveTypeName}</TableCell>
                    <TableCell>{formatDate(row.startDate)}</TableCell>
                    <TableCell>{formatDate(row.endDate)}</TableCell>
                    <TableCell>
                      {row.duration}
                      {row.isHalfDay ? ' (½)' : ''}
                    </TableCell>
                    <TableCell>{formatDate(row.appliedAt)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={row.status}
                        label={LEAVE_REQUEST_STATUS_LABELS[row.status]}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <TableActions
                        onView={() => navigate(`/leave/${row.id}`)}
                        onEdit={
                          row.status === 'pending' &&
                          (canManage || row.employeeId === employeeId) &&
                          hasPermission(PERMISSIONS.LEAVE_EDIT)
                            ? () => navigate(`/leave/${row.id}/edit`)
                            : undefined
                        }
                        moreItems={moreItems}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </DataTable>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve leave request?"
        description="This will commit leave balance and mark attendance as On Leave for working days."
        confirmLabel="Approve"
        tone="primary"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (!approveTarget) return
          setActionLoading(true)
          try {
            await leaveService.approveLeaveRequest(approveTarget.id, user?.name ?? 'System')
            showSuccess('Leave request approved.')
            setApproveTarget(null)
            await load()
          } catch (err) {
            showError(getLeaveErrorMessage(err, 'Failed approval.'))
          } finally {
            setActionLoading(false)
          }
        }}
      />

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => {
          setRejectTarget(null)
          setRejectReason('')
        }}
        title="Reject leave request"
        description="Provide a clear rejection reason."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason('')
              }}
              disabled={actionLoading}
            >
              Close
            </Button>
            <Button
              variant="danger"
              isLoading={actionLoading}
              onClick={async () => {
                if (!rejectTarget) return
                setActionLoading(true)
                try {
                  await leaveService.rejectLeaveRequest(
                    rejectTarget.id,
                    rejectReason,
                    user?.name ?? 'System',
                  )
                  showSuccess('Leave request rejected.')
                  setRejectTarget(null)
                  setRejectReason('')
                  await load()
                } catch (err) {
                  showError(getLeaveErrorMessage(err, 'Failed rejection.'))
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              Reject
            </Button>
          </>
        }
      >
        <Textarea
          label="Rejection reason"
          required
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          rows={4}
        />
      </Modal>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => {
          setCancelTarget(null)
          setCancelReason('')
        }}
        title={cancelTarget?.status === 'pending' ? 'Withdraw leave request?' : 'Cancel approved leave?'}
        description={
          cancelTarget?.status === 'pending'
            ? 'Pending requests can be withdrawn. Balance pending days will be released.'
            : 'Approved future leave will restore balance and clear On Leave attendance.'
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCancelTarget(null)
                setCancelReason('')
              }}
              disabled={actionLoading}
            >
              Close
            </Button>
            <Button
              variant="danger"
              isLoading={actionLoading}
              onClick={async () => {
                if (!cancelTarget) return
                setActionLoading(true)
                try {
                  if (cancelTarget.status === 'pending') {
                    await leaveService.withdrawLeaveRequest(
                      cancelTarget.id,
                      user?.name ?? 'System',
                    )
                    showSuccess('Leave request withdrawn.')
                  } else {
                    await leaveService.cancelLeaveRequest(
                      cancelTarget.id,
                      cancelReason || 'Cancelled by user',
                      user?.name ?? 'System',
                    )
                    showSuccess('Leave request cancelled.')
                  }
                  setCancelTarget(null)
                  setCancelReason('')
                  await load()
                } catch (err) {
                  showError(getLeaveErrorMessage(err, 'Failed to cancel leave.'))
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        {cancelTarget?.status === 'approved' ? (
          <Textarea
            label="Cancellation reason"
            required
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={4}
          />
        ) : (
          <p className="text-sm text-surface-600 dark:text-surface-300">
            This will mark the request as withdrawn.
          </p>
        )}
      </Modal>
    </div>
  )
}
