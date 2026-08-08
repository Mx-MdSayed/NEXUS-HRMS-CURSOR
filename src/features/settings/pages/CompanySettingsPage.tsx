import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  FileUpload,
  Input,
  PageHeader,
  PageLoader,
  Select,
} from '@/components/ui'
import { SALARY_CURRENCIES } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import type { CompanySettings } from '@/types'
import { showError, showSuccess } from '@/utils/toast'
import { AddressFormFields } from '../components/AddressFormFields'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import { DATE_FORMAT_OPTIONS, TIMEZONE_OPTIONS } from '../utils/nav'
import { formatEmployeeIdPreview } from '../utils/formatters'
import { localAssetStorage } from '../utils/storage'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const FISCAL_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
}))

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

export function CompanySettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.COMPANY_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoMeta, setLogoMeta] = useState<{ name: string; size: number } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const form = useForm<CompanySettings>()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form

  const { pendingConfirm, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const prefix = watch('employeeIdPrefix')
  const nextNumber = watch('employeeIdNextNumber')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await settingsService.getCompanySettings()
        if (!active) return
        reset(data)
        if (data.logoUrl) {
          setLogoMeta({ name: 'Company logo', size: 0 })
        }
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load company settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reset])

  async function handleLogoSelect(file: File | null) {
    if (!file) {
      setLogoMeta(null)
      setValue('logoUrl', undefined, { shouldDirty: true })
      return
    }
    setUploadProgress(30)
    try {
      const stored = await localAssetStorage.put(`company-logo-${Date.now()}`, file)
      setUploadProgress(100)
      setValue('logoUrl', stored.dataUrl, { shouldDirty: true })
      setLogoMeta({ name: file.name, size: file.size })
    } catch {
      showError('Failed to upload logo.')
    } finally {
      setUploadProgress(null)
    }
  }

  async function onSubmit(values: CompanySettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateCompany(values)
      reset(updated)
      showSuccess('Company settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    reset()
    setLogoMeta(null)
  }

  if (loading) return <PageLoader label="Loading company settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Legal identity, contacts, address, and employee ID configuration."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Company' }]}
      />

      <FormProvider {...form}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Identity
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Company name and legal registration details.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Company name"
                  error={errors.companyName?.message}
                  {...register('companyName', { required: 'Company name is required.' })}
                />
                <Input label="Legal name" {...register('legalName')} />
                <Input label="Registration number" {...register('registrationNumber')} />
                <Input label="Tax ID" {...register('taxId')} />
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  disabled={!canSave}
                  {...register('status')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Contact
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Primary email" type="email" {...register('email')} />
                <Input label="HR email" type="email" {...register('hrEmail')} />
                <Input label="Support email" type="email" {...register('supportEmail')} />
                <Input label="Phone" {...register('phone')} />
                <Input label="Website" {...register('website')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Address
                </h2>
              </div>
              <AddressFormFields />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Logo
                </h2>
              </div>
              {watch('logoUrl') ? (
                <img
                  src={watch('logoUrl')}
                  alt="Company logo preview"
                  className="h-16 w-auto rounded border border-surface-200 dark:border-surface-700"
                />
              ) : null}
              <FileUpload
                label="Company logo"
                accept="image/*"
                disabled={!canSave}
                value={logoMeta}
                progress={uploadProgress}
                onFileSelect={handleLogoSelect}
                onRemove={() => {
                  setLogoMeta(null)
                  setValue('logoUrl', undefined, { shouldDirty: true })
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Regional defaults
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Select
                  label="Timezone"
                  options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  disabled={!canSave}
                  {...register('timezone')}
                />
                <Select
                  label="Date format"
                  options={DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  disabled={!canSave}
                  {...register('dateFormat')}
                />
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
                <Select
                  label="Fiscal year start"
                  value={String(watch('fiscalYearStartMonth'))}
                  onChange={(e) =>
                    setValue('fiscalYearStartMonth', Number(e.target.value), { shouldDirty: true })
                  }
                  options={FISCAL_MONTH_OPTIONS}
                  disabled={!canSave}
                />
                <Select
                  label="First day of week"
                  value={String(watch('workWeekStart'))}
                  onChange={(e) =>
                    setValue('workWeekStart', Number(e.target.value) as CompanySettings['workWeekStart'], {
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
            <CardContent className="space-y-5 pt-6">
              <div>
                <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Employee ID
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="ID prefix"
                  {...register('employeeIdPrefix')}
                  disabled={!canSave}
                />
                <Input
                  label="Next number"
                  type="number"
                  min={1}
                  {...register('employeeIdNextNumber', { valueAsNumber: true })}
                  disabled={!canSave}
                />
                <Input label="Payslip prefix" {...register('payslipPrefix')} disabled={!canSave} />
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-300">
                Preview:{' '}
                <span className="font-mono font-medium">
                  {formatEmployeeIdPreview(prefix ?? '', nextNumber ?? 1)}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <SettingsFormActions
                canSave={canSave}
                isSubmitting={isSubmitting}
                isDirty={isDirty}
                onCancel={handleCancel}
                onReset={handleCancel}
                resetLabel="Discard changes"
                warning={settingsService.getHistoricalWarning('company')}
                pendingLeave={pendingConfirm}
                onConfirmLeave={confirmLeave}
                onCancelLeave={cancelLeave}
              />
            </CardContent>
          </Card>
        </form>
      </FormProvider>
    </div>
  )
}
