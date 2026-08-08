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
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import {
  getPayslipSettings,
  resetPayslipSettings,
  updatePayslipSettings,
} from '../settings'
import type { PayslipSettings } from '../types'

const booleanOptions = [
  { value: 'true', label: 'Show' },
  { value: 'false', label: 'Hide' },
]

export function PayslipSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.PAYSLIP_MANAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayslipSettings>({ defaultValues: getPayslipSettings() })

  useEffect(() => {
    reset(getPayslipSettings())
  }, [reset])

  async function onSubmit(values: PayslipSettings) {
    setIsSubmitting(true)
    try {
      updatePayslipSettings(values)
      reset(getPayslipSettings())
      showSuccess('Payslip settings updated successfully.')
    } catch {
      showError('Failed to update payslip settings.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleResetDefaults() {
    reset(resetPayslipSettings())
    showSuccess('Payslip settings reset to defaults.')
  }

  if (!canManage) {
    return <ErrorState title="Access denied" message="You do not have permission to manage payslips." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip Settings"
        description="Configure payslip numbering and document display preferences."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payslips', href: '/payslips' },
          { label: 'Settings' },
        ]}
      />

      <Card className="border-info-100 bg-info-50/70 dark:border-info-950 dark:bg-info-950/30">
        <CardContent>
          <p className="text-sm font-medium text-info-700 dark:text-info-100">
            Payslips are generated from finalized payroll snapshots. These settings control document
            presentation only and do not recalculate salary values.
          </p>
        </CardContent>
      </Card>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Numbering and format
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Configure the generated payslip number and date display.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input
                label="Number prefix"
                error={errors.numberPrefix?.message}
                {...register('numberPrefix', {
                  required: 'Number prefix is required.',
                  maxLength: { value: 8, message: 'Prefix must be 8 characters or fewer.' },
                })}
              />
              <Input
                label="Date format"
                error={errors.dateFormat?.message}
                {...register('dateFormat', { required: 'Date format is required.' })}
              />
              <Select
                label="Currency display"
                value={watch('currencyDisplay')}
                onChange={(event) =>
                  setValue('currencyDisplay', event.target.value as PayslipSettings['currencyDisplay'])
                }
                options={[
                  { value: 'symbol', label: 'Symbol' },
                  { value: 'code', label: 'Currency code' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Document visibility
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Choose which optional sections appear in generated payslip previews.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Select
                label="Company header"
                value={String(watch('showCompanyHeader'))}
                onChange={(event) => setValue('showCompanyHeader', event.target.value === 'true')}
                options={booleanOptions}
              />
              <Select
                label="Employer contribution"
                value={String(watch('showEmployerContribution'))}
                onChange={(event) =>
                  setValue('showEmployerContribution', event.target.value === 'true')
                }
                options={booleanOptions}
              />
              <Select
                label="Employer cost"
                value={String(watch('showEmployerCostToEmployee'))}
                onChange={(event) =>
                  setValue('showEmployerCostToEmployee', event.target.value === 'true')
                }
                options={booleanOptions}
              />
              <Select
                label="Bank details"
                value={String(watch('showBankDetails'))}
                onChange={(event) => setValue('showBankDetails', event.target.value === 'true')}
                options={booleanOptions}
              />
              <Select
                label="Zero amount components"
                value={String(watch('showZeroAmountComponents'))}
                onChange={(event) =>
                  setValue('showZeroAmountComponents', event.target.value === 'true')
                }
                options={booleanOptions}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Footer
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Add a note shown at the bottom of every payslip document.
              </p>
            </div>
            <Textarea
              label="Footer text"
              rows={4}
              error={errors.footerText?.message}
              {...register('footerText', { required: 'Footer text is required.' })}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleResetDefaults}>
            Reset defaults
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  )
}
