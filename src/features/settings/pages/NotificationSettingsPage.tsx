import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  PageHeader,
  PageLoader,
  Switch,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { NotificationModuleSettings } from '../types'

export function NotificationSettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.NOTIFICATION_SETTINGS_MANAGE_GLOBAL) ||
    hasPermission(PERMISSIONS.NOTIFICATION_SETTINGS_MANAGE) ||
    hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NotificationModuleSettings>()
  const {
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
        const data = await settingsService.getNotificationSettings()
        if (active) reset(data)
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load notification settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function onSubmit(values: NotificationModuleSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateNotifications(values)
      reset(updated)
      showSuccess('Notification settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading notification settings…" />

  const toggles: Array<{ key: keyof NotificationModuleSettings; label: string; description?: string; locked?: boolean }> = [
    { key: 'inAppEnabled', label: 'In-app notifications', description: 'Master toggle for in-app alerts' },
    { key: 'leaveNotifications', label: 'Leave notifications' },
    { key: 'attendanceNotifications', label: 'Attendance notifications' },
    { key: 'payrollNotifications', label: 'Payroll notifications' },
    { key: 'payslipNotifications', label: 'Payslip notifications' },
    { key: 'workflowNotifications', label: 'Workflow notifications' },
    {
      key: 'mandatorySystemNotifications',
      label: 'Mandatory system notifications',
      description: 'Critical alerts that cannot be disabled',
      locked: true,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Default in-app notification toggles for the organization."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Notifications' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            {toggles.map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-surface-200 p-4 dark:border-surface-700"
              >
                <Switch
                  label={item.label}
                  description={item.description}
                  checked={watch(item.key)}
                  onCheckedChange={(v) => setValue(item.key, v, { shouldDirty: true })}
                  disabled={!canSave || item.locked}
                />
              </div>
            ))}
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
