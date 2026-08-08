import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { LeaveApplyForm } from '../components/LeaveApplyForm'
import { leaveService } from '../services/leaveService'
import type { LeaveBalance, LeaveRequestDetail, LeaveType } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

export function LeaveEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canEdit = hasPermission(PERMISSIONS.LEAVE_EDIT)
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE)

  const [detail, setDetail] = useState<LeaveRequestDetail | null>(null)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        if (!canEdit && !canManage) {
          setError('You do not have permission to edit leave requests.')
          return
        }
        const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
        const data = await leaveService.getLeaveRequestById(id)
        if (!canManage && data.employeeId !== linked) {
          setError('You can only edit your own leave requests.')
          return
        }
        if (data.status !== 'pending') {
          setError('Only pending leave requests can be edited.')
          return
        }
        const [types, bals] = await Promise.all([
          leaveService.getLeaveTypes(false),
          leaveService.getEmployeeLeaveBalances(data.employeeId),
        ])
        if (cancelled) return
        setDetail(data)
        setLeaveTypes(types)
        setBalances(bals)
      } catch (err) {
        if (!cancelled) setError(getLeaveErrorMessage(err, 'Failed to load leave request.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canEdit, canManage, id, user])

  if (isLoading) return <PageLoader label="Loading leave editor" />
  if (error || !detail) {
    return <ErrorState title="Cannot edit leave" message={error ?? 'Not found'} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit leave request"
        description={`${detail.leaveTypeName} · ${detail.employeeName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: detail.id, href: `/leave/${detail.id}` },
          { label: 'Edit' },
        ]}
      />

      <LeaveApplyForm
        leaveTypes={leaveTypes}
        balances={balances}
        defaultEmployeeId={detail.employeeId}
        isSubmitting={isSubmitting}
        initial={{
          employeeId: detail.employeeId,
          leaveTypeId: detail.leaveTypeId,
          startDate: detail.startDate,
          endDate: detail.endDate,
          dayPortion: detail.isHalfDay ? 'half_day' : 'full_day',
          halfDayType: detail.halfDayType,
          reason: detail.reason,
          attachment: detail.attachment ?? null,
        }}
        onCancel={() => navigate(`/leave/${detail.id}`)}
        onSubmit={async (values) => {
          setIsSubmitting(true)
          try {
            await leaveService.updateLeaveRequest(detail.id, values, user?.name ?? 'System')
            showSuccess('Leave request updated successfully.')
            navigate(`/leave/${detail.id}`)
          } catch (err) {
            showError(getLeaveErrorMessage(err, 'Failed to update leave request.'))
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    </div>
  )
}
