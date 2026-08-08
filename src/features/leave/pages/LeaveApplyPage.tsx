import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { LeaveApplyForm } from '../components/LeaveApplyForm'
import { leaveService } from '../services/leaveService'
import type { LeaveBalance, LeaveRequestFormValues, LeaveType } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'
import { employeeService } from '@/features/employees'

export function LeaveApplyPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canApply =
    hasPermission(PERMISSIONS.LEAVE_APPLY) || hasPermission(PERMISSIONS.LEAVE_CREATE)
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE)

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<
    { id: string; fullName: string; employeeCode: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        if (!canApply && !canManage) {
          setError('You do not have permission to apply for leave.')
          return
        }
        const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
        const types = await leaveService.getLeaveTypes(false)
        if (cancelled) return
        setLeaveTypes(types)
        setEmployeeId(linked)

        if (linked) {
          const bals = await leaveService.getEmployeeLeaveBalances(linked)
          if (!cancelled) setBalances(bals)
        }

        if (canManage) {
          const result = await employeeService.getEmployees({
            page: 1,
            pageSize: 100,
            sortBy: 'fullName',
          })
          if (!cancelled) {
            setEmployees(
              result.data.map((item) => ({
                id: item.id,
                fullName: item.fullName,
                employeeCode: item.employeeCode,
              })),
            )
          }
        }
      } catch (err) {
        if (!cancelled) setError(getLeaveErrorMessage(err, 'Failed to load leave form.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canApply, canManage, user])

  if (isLoading) return <PageLoader label="Loading leave application" />
  if (error) return <ErrorState title="Cannot apply for leave" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apply Leave"
        description="Submit a new leave request. Weekends and holidays are excluded from duration."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Apply' },
        ]}
      />

      <LeaveApplyForm
        leaveTypes={leaveTypes}
        balances={balances}
        defaultEmployeeId={employeeId ?? undefined}
        showEmployeeSelect={canManage}
        employees={employees}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/leave/my')}
        onSubmit={async (values: LeaveRequestFormValues) => {
          setIsSubmitting(true)
          try {
            const targetEmployeeId = values.employeeId || employeeId || undefined
            if (targetEmployeeId && targetEmployeeId !== employeeId) {
              const bals = await leaveService.getEmployeeLeaveBalances(targetEmployeeId)
              setBalances(bals)
            }
            await leaveService.createLeaveRequest(
              values,
              user?.name ?? 'System',
              targetEmployeeId ?? undefined,
            )
            showSuccess('Leave request submitted successfully.')
            navigate('/leave/my')
          } catch (err) {
            showError(getLeaveErrorMessage(err, 'Failed to submit leave request.'))
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    </div>
  )
}
