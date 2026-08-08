import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Input,
  PageHeader,
  PageLoader,
  Select,
  Switch,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { ApproverMode, WorkflowModuleSettings } from '../types'

const APPROVER_OPTIONS = [
  { value: 'reporting_manager', label: 'Reporting manager' },
  { value: 'hr', label: 'HR / Admin' },
  { value: 'specific_user', label: 'Specific user' },
]

export function WorkflowSettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.WORKFLOW_SETTINGS_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WorkflowModuleSettings>()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = form

  const { pendingConfirm, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await settingsService.getWorkflowSettings()
        if (active) reset(data)
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load workflow settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function onSubmit(values: WorkflowModuleSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateWorkflows({ ...values, fallbackToHr: true })
      reset(updated)
      showSuccess('Workflow settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading workflow settings…" />

  const leaveMode = watch('leaveApproverMode')
  const attendanceMode = watch('attendanceApproverMode')
  const profileMode = watch('profileApproverMode')
  const payrollMode = watch('payrollApproverMode')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Default approvers for leave, attendance, profile, and payroll requests."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Workflows' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <p className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">Leave approvals</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Approver mode"
                  value={leaveMode}
                  onChange={(e) =>
                    setValue('leaveApproverMode', e.target.value as ApproverMode, { shouldDirty: true })
                  }
                  options={APPROVER_OPTIONS}
                  disabled={!canSave}
                />
                {leaveMode === 'specific_user' ? (
                  <Input label="Approver user ID" {...register('leaveApproverUserId')} disabled={!canSave} />
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <p className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">
                Attendance approvals
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Approver mode"
                  value={attendanceMode}
                  onChange={(e) =>
                    setValue('attendanceApproverMode', e.target.value as ApproverMode, { shouldDirty: true })
                  }
                  options={APPROVER_OPTIONS}
                  disabled={!canSave}
                />
                {attendanceMode === 'specific_user' ? (
                  <Input label="Approver user ID" {...register('attendanceApproverUserId')} disabled={!canSave} />
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <p className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">
                Profile change approvals
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Approver mode"
                  value={profileMode}
                  onChange={(e) =>
                    setValue('profileApproverMode', e.target.value as ApproverMode, { shouldDirty: true })
                  }
                  options={APPROVER_OPTIONS}
                  disabled={!canSave}
                />
                {profileMode === 'specific_user' ? (
                  <Input label="Approver user ID" {...register('profileApproverUserId')} disabled={!canSave} />
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <p className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">Payroll approvals</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Approver mode"
                  value={payrollMode}
                  onChange={(e) =>
                    setValue('payrollApproverMode', e.target.value as ApproverMode, { shouldDirty: true })
                  }
                  options={APPROVER_OPTIONS}
                  disabled={!canSave}
                />
                {payrollMode === 'specific_user' ? (
                  <Input label="Approver user ID" {...register('payrollApproverUserId')} disabled={!canSave} />
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <Switch
              label="Fallback to HR / Admin"
              description="Required — ensures approvals are not stuck when the primary approver is unavailable."
              checked={true}
              onCheckedChange={() => setValue('fallbackToHr', true, { shouldDirty: false })}
              disabled
            />
            <p className="text-xs text-surface-500 dark:text-surface-400">
              This setting must remain enabled for workflow safety.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SettingsFormActions
              canSave={canSave}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
              onCancel={() => reset()}
              pendingLeave={pendingConfirm}
              onConfirmLeave={confirmLeave}
              onCancelLeave={cancelLeave}
            />
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
