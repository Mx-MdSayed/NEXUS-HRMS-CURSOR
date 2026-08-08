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
import { SALARY_CURRENCIES } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { PayrollModuleSettings } from '../types'

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'semi_monthly', label: 'Semi-monthly' },
]

const ROUNDING_OPTIONS = [
  { value: 'none', label: 'No rounding' },
  { value: 'nearest', label: 'Nearest unit' },
  { value: 'two_decimals', label: 'Two decimals' },
]

const BASIS_OPTIONS = [
  { value: 'calendar', label: 'Calendar days' },
  { value: 'schedule', label: 'Work schedule days' },
]

const LOP_OPTIONS = [
  { value: 'basic', label: 'Basic salary' },
  { value: 'gross', label: 'Gross earnings' },
]

const CURRENCY_OPTIONS = Object.values(SALARY_CURRENCIES).map((c) => ({
  value: c.code,
  label: c.label,
}))

export function PayrollSettingsConfigPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.PAYROLL_SETTINGS_MANAGE_GLOBAL) ||
    hasPermission(PERMISSIONS.PAYROLL_SETTINGS_MANAGE) ||
    hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PayrollModuleSettings>()
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
        const data = await settingsService.getPayrollSettings()
        if (active) reset(data)
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load payroll settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function onSubmit(values: PayrollModuleSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updatePayroll(values)
      reset(updated)
      showSuccess('Payroll settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading payroll settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Pay period, currency, rounding, and statutory calculation flags."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Payroll' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Pay period
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select label="Frequency" options={FREQUENCY_OPTIONS} {...register('frequency')} disabled={!canSave} />
              <Input
                label="Period start day"
                type="number"
                min={1}
                max={28}
                {...register('periodStartDay', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Period end day"
                type="number"
                min={1}
                max={31}
                {...register('periodEndDay', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Select
                label="Currency"
                options={CURRENCY_OPTIONS}
                {...register('currencyCode')}
                disabled={!canSave}
              />
              <Select
                label="Working days basis"
                options={BASIS_OPTIONS}
                {...register('workingDaysBasis')}
                disabled={!canSave}
              />
              <Select
                label="Rounding"
                options={ROUNDING_OPTIONS}
                {...register('rounding')}
                disabled={!canSave}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Feature flags
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Switch
                label="Overtime"
                checked={watch('overtimeEnabled')}
                onCheckedChange={(v) => setValue('overtimeEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Tax calculations"
                checked={watch('taxEnabled')}
                onCheckedChange={(v) => setValue('taxEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Deductions"
                checked={watch('deductionsEnabled')}
                onCheckedChange={(v) => setValue('deductionsEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Employer contributions"
                checked={watch('employerContributionsEnabled')}
                onCheckedChange={(v) => setValue('employerContributionsEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Mixed currencies"
                checked={watch('allowMixedCurrencies')}
                onCheckedChange={(v) => setValue('allowMixedCurrencies', v, { shouldDirty: true })}
                disabled={!canSave}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Calculation engine
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Demo statutory and LOP assumptions mirrored from payroll engine.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select label="LOP basis" options={LOP_OPTIONS} {...register('lopBasis')} disabled={!canSave} />
              <Input
                label="Half day value"
                type="number"
                step="0.01"
                min={0}
                max={1}
                {...register('halfDayValue', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Switch
                label="Late deduction"
                checked={watch('lateDeductionEnabled')}
                onCheckedChange={(v) => setValue('lateDeductionEnabled', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Input
                label="Standard hours per day"
                type="number"
                step="0.25"
                min={1}
                {...register('standardWorkingHoursPerDay', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Overtime multiplier"
                type="number"
                step="0.01"
                min={0}
                {...register('overtimeMultiplier', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="PF employee %"
                type="number"
                step="0.01"
                min={0}
                {...register('pfEmployeePercent', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="PF employer %"
                type="number"
                step="0.01"
                min={0}
                {...register('pfEmployerPercent', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="PF wage cap"
                type="number"
                step="0.01"
                min={0}
                {...register('pfWageCap', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="ESI employee %"
                type="number"
                step="0.01"
                min={0}
                {...register('esiEmployeePercent', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="ESI employer %"
                type="number"
                step="0.01"
                min={0}
                {...register('esiEmployerPercent', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="ESI wage threshold"
                type="number"
                step="0.01"
                min={0}
                {...register('esiWageThreshold', { valueAsNumber: true })}
                disabled={!canSave}
              />
              <Input
                label="Professional tax (fixed)"
                type="number"
                step="0.01"
                min={0}
                {...register('professionalTaxFixed', { valueAsNumber: true })}
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
              warning={settingsService.getHistoricalWarning('payroll')}
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
