import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  Input,
  PageHeader,
  Select,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { getPayrollSettings, updatePayrollSettings } from '../settings'
import type { PayrollSettings } from '../types'

const booleanOptions = [
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
]

const lopBasisOptions = [
  { value: 'basic', label: 'Basic salary' },
  { value: 'gross', label: 'Gross earnings' },
  { value: 'ctc', label: 'CTC' },
]

export function PayrollSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.PAYROLL_SETTINGS_MANAGE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayrollSettings>({ defaultValues: getPayrollSettings() })

  useEffect(() => {
    reset(getPayrollSettings())
  }, [reset])

  async function onSubmit(values: PayrollSettings) {
    setIsSubmitting(true)
    try {
      updatePayrollSettings(values)
      reset(getPayrollSettings())
      showSuccess('Payroll settings updated successfully.')
    } catch {
      showError('Failed to update payroll settings.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canManage) {
    return <ErrorState title="Access denied" message="You do not have permission to manage payroll settings." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Settings"
        description="Configure demo payroll calculation assumptions."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Settings' },
        ]}
      />

      <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Demo configuration only. These PF, ESI, professional tax, LOP, and overtime settings are simplified
            examples for the HRMS demo and are not legal statutory compliance guidance.
          </p>
        </CardContent>
      </Card>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Attendance and LOP
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Configure how unpaid days, half days, late arrival, and overtime are represented in demo
                payroll calculations.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select label="LOP basis" options={lopBasisOptions} {...register('lopBasis')} />
              <Input
                label="Half day value"
                type="number"
                step="0.01"
                min={0}
                max={1}
                error={errors.halfDayValue?.message}
                {...register('halfDayValue', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Half day value cannot be negative.' },
                  max: { value: 1, message: 'Half day value cannot exceed 1.' },
                })}
              />
              <Select
                label="Late deduction"
                value={String(watch('lateDeductionEnabled'))}
                onChange={(event) => setValue('lateDeductionEnabled', event.target.value === 'true')}
                options={booleanOptions}
              />
              <Select
                label="Overtime"
                value={String(watch('overtimeEnabled'))}
                onChange={(event) => setValue('overtimeEnabled', event.target.value === 'true')}
                options={booleanOptions}
              />
              <Input
                label="Standard hours per day"
                type="number"
                step="0.25"
                min={1}
                error={errors.standardWorkingHoursPerDay?.message}
                {...register('standardWorkingHoursPerDay', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Standard working hours must be at least 1.' },
                })}
              />
              <Input
                label="Overtime multiplier"
                type="number"
                step="0.01"
                min={0}
                error={errors.overtimeMultiplier?.message}
                {...register('overtimeMultiplier', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Overtime multiplier cannot be negative.' },
                })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Demo statutory assumptions
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                These percentages and caps are demo inputs only and should not be treated as jurisdictional
                compliance rules.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input
                label="PF employee percent"
                type="number"
                step="0.01"
                min={0}
                {...register('pfEmployeePercent', { valueAsNumber: true })}
              />
              <Input
                label="PF employer percent"
                type="number"
                step="0.01"
                min={0}
                {...register('pfEmployerPercent', { valueAsNumber: true })}
              />
              <Input
                label="PF wage cap"
                type="number"
                step="0.01"
                min={0}
                {...register('pfWageCap', { valueAsNumber: true })}
              />
              <Input
                label="ESI employee percent"
                type="number"
                step="0.01"
                min={0}
                {...register('esiEmployeePercent', { valueAsNumber: true })}
              />
              <Input
                label="ESI employer percent"
                type="number"
                step="0.01"
                min={0}
                {...register('esiEmployerPercent', { valueAsNumber: true })}
              />
              <Input
                label="ESI wage threshold"
                type="number"
                step="0.01"
                min={0}
                {...register('esiWageThreshold', { valueAsNumber: true })}
              />
              <Input
                label="Professional tax fixed"
                type="number"
                step="0.01"
                min={0}
                {...register('professionalTaxFixed', { valueAsNumber: true })}
              />
              <Select
                label="Mixed currencies"
                value={String(watch('allowMixedCurrencies'))}
                onChange={(event) => setValue('allowMixedCurrencies', event.target.value === 'true')}
                options={[
                  { value: 'false', label: 'Disallow mixed currencies' },
                  { value: 'true', label: 'Allow mixed currencies' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  )
}
