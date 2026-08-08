import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  ErrorState,
  Modal,
  PageHeader,
  PageLoader,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { LEAVE_REQUEST_STATUS_LABELS, LEAVE_REQUEST_STATUSES } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveRequestDetail } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

export function LeaveDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()

  const canApprove = hasPermission(PERMISSIONS.LEAVE_APPROVE)
  const canReject = hasPermission(PERMISSIONS.LEAVE_REJECT)
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE)
  const canEdit = hasPermission(PERMISSIONS.LEAVE_EDIT)
  const canCancel = hasPermission(PERMISSIONS.LEAVE_CANCEL) || canManage

  const [detail, setDetail] = useState<LeaveRequestDetail | null>(null)
  const [linkedEmployeeId, setLinkedEmployeeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
      setLinkedEmployeeId(linked)
      const data = await leaveService.getLeaveRequestById(id, {
        employeeId: linked,
        canManageOrApprove: canManage || canApprove,
      })
      setDetail(data)
    } catch (err) {
      setError(getLeaveErrorMessage(err, 'Leave request not found.'))
    } finally {
      setIsLoading(false)
    }
  }, [canApprove, canManage, id, user])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) return <PageLoader label="Loading leave details" />
  if (error || !detail) {
    return <ErrorState title="Unable to load leave" message={error ?? 'Not found'} />
  }

  const isOwner = detail.employeeId === linkedEmployeeId
  const isPending = detail.status === LEAVE_REQUEST_STATUSES.PENDING
  const isApproved = detail.status === LEAVE_REQUEST_STATUSES.APPROVED

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave request"
        description={`${detail.leaveTypeName} · ${detail.employeeName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Requests', href: '/leave/requests' },
          { label: detail.id },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {isPending && canEdit && (isOwner || canManage) ? (
              <Button variant="secondary" onClick={() => navigate(`/leave/${detail.id}/edit`)}>
                Edit
              </Button>
            ) : null}
            {isPending && canApprove && !isOwner ? (
              <Button onClick={() => setApproveOpen(true)}>Approve</Button>
            ) : null}
            {isPending && canReject && !isOwner ? (
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
            ) : null}
            {(isPending || isApproved) && canCancel && (isOwner || canManage) ? (
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                {isPending ? 'Withdraw' : 'Cancel'}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                status={detail.status}
                label={LEAVE_REQUEST_STATUS_LABELS[detail.status]}
              />
              <span className="text-sm text-surface-500">
                Applied {formatDateTime(detail.appliedAt)}
              </span>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-surface-500">Employee</dt>
                <dd className="mt-1 font-medium">
                  {detail.employeeName} ({detail.employeeCode})
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-surface-500">Department</dt>
                <dd className="mt-1 font-medium">{detail.departmentName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-surface-500">Leave type</dt>
                <dd className="mt-1 font-medium">
                  {detail.leaveTypeName} ({detail.leaveTypeCode})
                  {detail.paid ? '' : ' · Unpaid'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-surface-500">Duration</dt>
                <dd className="mt-1 font-medium">
                  {detail.duration} day(s)
                  {detail.isHalfDay
                    ? ` · Half day (${detail.halfDayType === 'second_half' ? 'Second' : 'First'} half)`
                    : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-surface-500">Start date</dt>
                <dd className="mt-1 font-medium">{formatDate(detail.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-surface-500">End date</dt>
                <dd className="mt-1 font-medium">{formatDate(detail.endDate)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-sm font-semibold">Reason</h3>
              <p className="mt-1 text-sm text-surface-700 dark:text-surface-200">{detail.reason}</p>
            </div>

            {detail.attachment ? (
              <div>
                <h3 className="text-sm font-semibold">Attachment</h3>
                <p className="mt-1 text-sm">
                  {detail.attachment.name} ({Math.round(detail.attachment.size / 1024)} KB)
                </p>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold">Working days covered</h3>
              <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">
                {detail.workingDates.map((d) => formatDate(d)).join(', ') || '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-card-title">Decision & audit</h2>
            {detail.approvedAt ? (
              <p className="text-sm">
                Approved by <strong>{detail.approvedBy}</strong> on{' '}
                {formatDateTime(detail.approvedAt)}
              </p>
            ) : null}
            {detail.rejectedAt ? (
              <div className="text-sm">
                <p>
                  Rejected by <strong>{detail.rejectedBy}</strong> on{' '}
                  {formatDateTime(detail.rejectedAt)}
                </p>
                <p className="mt-2 text-surface-600 dark:text-surface-300">
                  {detail.rejectionReason}
                </p>
              </div>
            ) : null}
            {detail.cancelledAt ? (
              <div className="text-sm">
                <p>
                  Cancelled by <strong>{detail.cancelledBy}</strong> on{' '}
                  {formatDateTime(detail.cancelledAt)}
                </p>
                <p className="mt-2">{detail.cancellationReason}</p>
              </div>
            ) : null}
            {detail.withdrawnAt ? (
              <p className="text-sm">Withdrawn on {formatDateTime(detail.withdrawnAt)}</p>
            ) : null}
            {detail.balance ? (
              <div className="rounded-lg border border-surface-200 p-3 text-sm dark:border-surface-700">
                <p className="font-medium">Balance snapshot</p>
                <p className="mt-1 text-surface-500">
                  Available {detail.balance.available} · Used {detail.balance.used} · Pending{' '}
                  {detail.balance.pending}
                </p>
              </div>
            ) : null}
            <p className="text-xs text-surface-500">
              Updated {formatDateTime(detail.updatedAt)} by {detail.updatedBy}
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve leave request?"
        description="Balance will be committed and attendance marked On Leave for working days."
        confirmLabel="Approve"
        tone="primary"
        isLoading={actionLoading}
        onConfirm={async () => {
          setActionLoading(true)
          try {
            await leaveService.approveLeaveRequest(detail.id, user?.name ?? 'System', {
              actorEmployeeId: linkedEmployeeId ?? undefined,
            })
            showSuccess('Leave request approved.')
            setApproveOpen(false)
            await load()
          } catch (err) {
            showError(getLeaveErrorMessage(err, 'Failed approval.'))
          } finally {
            setActionLoading(false)
          }
        }}
      />

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject leave request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={actionLoading}>
              Close
            </Button>
            <Button
              variant="danger"
              isLoading={actionLoading}
              onClick={async () => {
                setActionLoading(true)
                try {
                  await leaveService.rejectLeaveRequest(
                    detail.id,
                    rejectReason,
                    user?.name ?? 'System',
                    { actorEmployeeId: linkedEmployeeId ?? undefined },
                  )
                  showSuccess('Leave request rejected.')
                  setRejectOpen(false)
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
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={isPending ? 'Withdraw leave request?' : 'Cancel approved leave?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={actionLoading}>
              Close
            </Button>
            <Button
              variant="danger"
              isLoading={actionLoading}
              onClick={async () => {
                setActionLoading(true)
                try {
                  if (isPending) {
                    await leaveService.withdrawLeaveRequest(detail.id, user?.name ?? 'System')
                    showSuccess('Leave request withdrawn.')
                  } else {
                    await leaveService.cancelLeaveRequest(
                      detail.id,
                      cancelReason || 'Cancelled',
                      user?.name ?? 'System',
                    )
                    showSuccess('Leave request cancelled.')
                  }
                  setCancelOpen(false)
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
        {isApproved ? (
          <Textarea
            label="Cancellation reason"
            required
            rows={4}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
        ) : (
          <p className="text-sm text-surface-600">Pending leave will be marked as withdrawn.</p>
        )}
      </Modal>
    </div>
  )
}
