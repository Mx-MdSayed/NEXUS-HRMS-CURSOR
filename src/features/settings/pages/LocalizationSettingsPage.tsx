import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Input,
  PageHeader,
  PageLoader,
  Select,
} from '@/components/ui'
import { SALARY_CURRENCIES } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { LocalizationSettings } from '../types'
import { DATE_FORMAT_OPTIONS, TIMEZONE_OPTIONS } from '../utils/nav'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
]

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
]

const FIRST_DAY_OPTIONS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const CURRENCY_OPTIONS = Object.values(SALARY_CURRENCIES).map((c) => ({
  value: c.code,
  label: c.label,
}))

export function LocalizationSettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.LOCALIZATION_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LocalizationSettings>()
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
        const data = await settingsService.getLocalizationSettings()
        if (active) reset(data)
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load localization settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function onSubmit(values: LocalizationSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateLocalization(values)
      reset(updated)
      showSuccess('Localization settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading localization settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Localization"
        description="Language, currency, date/time format, timezone, and calendar defaults."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Localization' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Language" options={LANGUAGE_OPTIONS} {...register('language')} disabled={!canSave} />
              <Select
                label="Currency"
                value={watch('currencyCode')}
                onChange={(e) => {
                  const code = e.target.value
                  setValue('currencyCode', code, { shouldDirty: true })
                  const cfg = SALARY_CURRENCIES[code as keyof typeof SALARY_CURRENCIES]
                  if (cfg) setValue('currencyLocale', cfg.locale, { shouldDirty: true })
                }}
                options={CURRENCY_OPTIONS}
                disabled={!canSave}
              />
              <Input label="Currency locale" {...register('currencyLocale')} disabled={!canSave} />
              <Select
                label="Date format"
                options={DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                {...register('dateFormat')}
                disabled={!canSave}
              />
              <Select
                label="Time format"
                options={TIME_FORMAT_OPTIONS}
                {...register('timeFormat')}
                disabled={!canSave}
              />
              <Select
                label="Timezone"
                options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                {...register('timezone')}
                disabled={!canSave}
              />
              <Select
                label="First day of week"
                value={String(watch('firstDayOfWeek'))}
                onChange={(e) =>
                  setValue('firstDayOfWeek', Number(e.target.value) as LocalizationSettings['firstDayOfWeek'], {
                    shouldDirty: true,
                  })
                }
                options={FIRST_DAY_OPTIONS}
                disabled={!canSave}
              />
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
              warning={settingsService.getHistoricalWarning('localization')}
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
