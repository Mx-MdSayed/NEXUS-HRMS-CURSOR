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
import type { AttendanceModuleSettings } from '../types'

const METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual entry' },
  { value: 'web', label: 'Web check-in' },
  { value: 'both', label: 'Manual and web' },
]

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AttendanceSettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.ATTENDANCE_SETTINGS_MANAGE) ||
    hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schedules, setSchedules] = useState<{ id: string; name: string }[]>([])

  const form = useForm<AttendanceModuleSettings>()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = form

  const { pendingConfirm, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)
  const weeklyOffDays = watch('weeklyOffDays') ?? []

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [attendance, scheduleList] = await Promise.all([
          settingsService.getAttendanceSettings(),
          settingsService.getWorkSchedules(),
        ])
        if (!active) return
        reset(attendance)
        setSchedules(scheduleList.map((s) => ({ id: s.id, name: s.name })))
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load attendance settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  function toggleOffDay(day: number) {
    const next = weeklyOffDays.includes(day)
      ? weeklyOffDays.filter((d) => d !== day)
      : [...weeklyOffDays, day]
    setValue('weeklyOffDays', next.sort(), { shouldDirty: true })
  }

  async function onSubmit(values: AttendanceModuleSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateAttendance(values)
      reset(updated)
      showSuccess('Attendance settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading attendance settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Methods, thresholds, and overtime defaults for attendance processing."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Attendance' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Method and schedule
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Attendance method" options={METHOD_OPTIONS} {...register('method')} disabled={!canSave} />
              <Select
                label="Default work schedule"
                value={watch('defaultScheduleId') ?? ''}
                onChange={(e) =>
                  setValue('defaultScheduleId', e.target.value || undefined, { shouldDirty: true })
                }
                options={[
                  { value: '', label: 'None' },
                  ...schedules.map((s) => ({ value: s.id, label: s.name })),
                ]}
                disabled={!canSave}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Standard hours
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input label="Start time" type="time" {...register('standardStartTime')} disabled={!canSave} />
              <Input label="End time" type="time" {...register('standardEndTime')} disabled={!canSave} />
              <Input
                label="Grace period (minutes)"
                type="number"
                min={0}
                {...register('gracePeriodMinutes', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Late threshold (minutes)"
                type="number"
                min={0}
                {...register('lateThresholdMinutes', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Half day threshold (hours)"
                type="number"
                step="0.5"
                min={0}
                {...register('halfDayThresholdHours', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Full day hours"
                type="number"
                step="0.5"
                min={0}
                {...register('fullDayHours', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Half day value"
                type="number"
                step="0.1"
                min={0}
                max={1}
                {...register('halfDayAttendanceValue', { valueAsNumber: true })}
                disabled={!canSave}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-surface-800 dark:text-surface-100">
                Weekly off days
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    disabled={!canSave}
                    onClick={() => toggleOffDay(index)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      weeklyOffDays.includes(index)
                        ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-600 dark:bg-brand-950/50 dark:text-brand-100'
                        : 'border-surface-200 text-surface-600 dark:border-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Automation
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Switch
                label="Auto absent"
                description="Mark absent when no check-in by cutoff"
                checked={watch('autoAbsentEnabled')}
                onCheckedChange={(v) => setValue('autoAbsentEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Overtime enabled"
                checked={watch('overtimeEnabled')}
                onCheckedChange={(v) => setValue('overtimeEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              {watch('overtimeEnabled') ? (
                <Input
                  label="Minimum overtime (minutes)"
                  type="number"
                  min={0}
                  {...register('minimumOvertimeMinutes', { valueAsNumber: true })}
                  disabled={!canSave}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SettingsFormActions
              canSave={canSave}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
              onCancel={() => reset()}
              warning={settingsService.getHistoricalWarning('attendance')}
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
