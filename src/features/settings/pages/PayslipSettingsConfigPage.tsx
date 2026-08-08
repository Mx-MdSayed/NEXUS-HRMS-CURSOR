import { format } from 'date-fns'
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
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { PayslipModuleSettings } from '../types'
import { DATE_FORMAT_OPTIONS } from '../utils/nav'

export function PayslipSettingsConfigPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.PAYSLIP_SETTINGS_MANAGE) ||
    hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PayslipModuleSettings>()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = form

  const { pendingConfirm, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)
  const prefix = watch('numberPrefix')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await settingsService.getPayslipSettings()
        if (active) reset(data)
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load payslip settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function onSubmit(values: PayslipModuleSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updatePayslip(values)
      reset(updated)
      showSuccess('Payslip settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading payslip settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip"
        description="Number format, document sections, and footer configuration."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Payslip' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Numbering and title
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Number prefix" {...register('numberPrefix')} disabled={!canSave} />
              <Input label="Document title" {...register('title')} disabled={!canSave} />
              <Select
                label="Date format"
                options={DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                {...register('dateFormat')}
                disabled={!canSave}
              />
              <Select
                label="Currency display"
                value={watch('currencyDisplay')}
                onChange={(e) =>
                  setValue('currencyDisplay', e.target.value as PayslipModuleSettings['currencyDisplay'], {
                    shouldDirty: true,
                  })
                }
                options={[
                  { value: 'symbol', label: 'Symbol' },
                  { value: 'code', label: 'Currency code' },
                ]}
                disabled={!canSave}
              />
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Preview:{' '}
              <span className="font-mono font-medium">
                {`${prefix?.trim() || 'PS'}-${format(new Date(), 'yyyy')}-${format(new Date(), 'MM')}-0001`}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Document sections
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Switch
                label="Company header"
                checked={watch('showCompanyHeader')}
                onCheckedChange={(v) => setValue('showCompanyHeader', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Employee ID"
                checked={watch('showEmployeeId')}
                onCheckedChange={(v) => setValue('showEmployeeId', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Bank last digits"
                checked={watch('showBankLastDigits')}
                onCheckedChange={(v) => setValue('showBankLastDigits', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Earnings"
                checked={watch('showEarnings')}
                onCheckedChange={(v) => setValue('showEarnings', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Deductions"
                checked={watch('showDeductions')}
                onCheckedChange={(v) => setValue('showDeductions', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Net salary"
                checked={watch('showNetSalary')}
                onCheckedChange={(v) => setValue('showNetSalary', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Employer contribution"
                checked={watch('showEmployerContribution')}
                onCheckedChange={(v) => setValue('showEmployerContribution', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Employer cost to employee"
                checked={watch('showEmployerCostToEmployee')}
                onCheckedChange={(v) => setValue('showEmployerCostToEmployee', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Bank details"
                checked={watch('showBankDetails')}
                onCheckedChange={(v) => setValue('showBankDetails', v, { shouldDirty: true })}
                disabled={!canSave}
              />
              <Switch
                label="Zero amount components"
                checked={watch('showZeroAmountComponents')}
                onCheckedChange={(v) => setValue('showZeroAmountComponents', v, { shouldDirty: true })}
                disabled={!canSave}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Footer and signatory
              </h2>
            </div>
            <Textarea
              label="Footer text"
              rows={3}
              {...register('footerText')}
              disabled={!canSave}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Authorized signatory name"
                {...register('authorizedSignatoryName')}
                disabled={!canSave}
              />
              <Input
                label="Signatory designation"
                {...register('authorizedSignatoryDesignation')}
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
              warning={settingsService.getHistoricalWarning('payslip')}
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
