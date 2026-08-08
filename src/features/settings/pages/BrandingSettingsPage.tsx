import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Checkbox,
  FileUpload,
  Input,
  PageHeader,
  PageLoader,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SettingsFormActions } from '../components/SettingsFormActions'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { BrandingSettings } from '../types'
import { localAssetStorage } from '../utils/storage'

export function BrandingSettingsPage() {
  const { hasPermission } = useAuth()
  const canSave =
    hasPermission(PERMISSIONS.BRANDING_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applyLogoToCompany, setApplyLogoToCompany] = useState(false)
  const [logoMeta, setLogoMeta] = useState<{ name: string; size: number } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const form = useForm<BrandingSettings>()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = form

  const { pendingConfirm, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty)

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const logoUrl = watch('logoUrl')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await settingsService.getBrandingSettings()
        if (!active) return
        reset(data)
        if (data.logoUrl) setLogoMeta({ name: 'Brand logo', size: 0 })
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load branding settings.'))
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
    setUploadProgress(40)
    try {
      const stored = await localAssetStorage.put(`brand-logo-${Date.now()}`, file)
      setUploadProgress(100)
      setValue('logoUrl', stored.dataUrl, { shouldDirty: true })
      setLogoMeta({ name: file.name, size: file.size })
    } catch {
      showError('Failed to upload logo.')
    } finally {
      setUploadProgress(null)
    }
  }

  async function onSubmit(values: BrandingSettings) {
    if (!canSave) return
    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateBranding(values, applyLogoToCompany)
      reset(updated)
      setApplyLogoToCompany(false)
      showSuccess('Branding settings updated.')
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading branding settings…" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding"
        description="Logo assets and brand colors for documents and UI accents."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Branding' }]}
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Logo assets</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Upload logos for login, dashboard, and email contexts. Theme is not auto-applied.
              </p>
            </div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-16 w-auto rounded border border-surface-200 dark:border-surface-700"
              />
            ) : null}
            <FileUpload
              label="Primary logo"
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
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Favicon URL" {...register('faviconUrl')} disabled={!canSave} />
              <Input label="Login logo URL" {...register('loginLogoUrl')} disabled={!canSave} />
              <Input label="Dashboard logo URL" {...register('dashboardLogoUrl')} disabled={!canSave} />
              <Input label="Email logo URL" {...register('emailLogoUrl')} disabled={!canSave} />
            </div>
            <Checkbox
              label="Apply logo to company profile"
              checked={applyLogoToCompany}
              onChange={(e) => setApplyLogoToCompany(e.target.checked)}
              disabled={!canSave || !logoUrl}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Brand colors</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Primary color" type="color" {...register('primaryColor')} disabled={!canSave} />
              <Input label="Secondary color" type="color" {...register('secondaryColor')} disabled={!canSave} />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 rounded-lg border border-surface-200 shadow-sm dark:border-surface-700"
                  style={{ backgroundColor: primaryColor }}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Primary</p>
                  <p className="font-mono text-xs text-surface-500">{primaryColor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 rounded-lg border border-surface-200 shadow-sm dark:border-surface-700"
                  style={{ backgroundColor: secondaryColor }}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Secondary</p>
                  <p className="font-mono text-xs text-surface-500">{secondaryColor}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SettingsFormActions
              canSave={canSave}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
              onCancel={() => {
                reset()
                setApplyLogoToCompany(false)
              }}
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
