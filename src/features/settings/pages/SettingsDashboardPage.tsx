import { Card, CardContent, PageHeader, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  Folders,
  GitBranch,
  Globe2,
  MapPin,
  Network,
  Palette,
  Palmtree,
  ScrollText,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import { canAccessSettingsNav, SETTINGS_NAV } from '../utils/nav'

const ICONS: Record<string, LucideIcon> = {
  Building2,
  Network,
  Folders,
  BadgeCheck,
  MapPin,
  Clock3,
  CalendarDays,
  Palmtree,
  ClipboardCheck,
  Wallet,
  FileText,
  Globe2,
  Bell,
  GitBranch,
  Palette,
  ScrollText,
}

export function SettingsDashboardPage() {
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState(() => settingsService.getSummary())

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await settingsService.getSettings()
        if (active) setSummary(settingsService.getSummary())
      } catch (err) {
        if (active) setError(getSettingsErrorMessage(err, 'Unable to load settings.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const cards = useMemo(
    () =>
      SETTINGS_NAV.filter((item) => item.id !== 'overview' && canAccessSettingsNav(item, hasPermission)),
    [hasPermission],
  )

  function cardSummary(id: string): string {
    switch (id) {
      case 'company':
        return `${summary.companyName} · ${summary.currency}`
      case 'organization':
        return `${summary.locations} locations · ${summary.schedules} schedules`
      case 'locations':
        return `${summary.locations} active locations`
      case 'work-schedules':
        return `${summary.schedules} active schedules`
      case 'holidays':
        return `${summary.holidays} holidays configured`
      case 'leave-policies':
        return `${summary.leavePolicies} policies`
      case 'payroll':
        return `${summary.payrollFrequency} · ${summary.currency}`
      case 'payslip':
        return `Prefix ${summary.payslipPrefix}`
      case 'localization':
        return `${summary.timezone}`
      case 'branding':
        return `Primary ${summary.brandingPrimary}`
      case 'departments':
        return 'Reuse Module 6 department records'
      case 'designations':
        return 'Reuse Module 6 designation records'
      default:
        return 'Centralized configuration'
    }
  }

  if (loading) return <PageLoader label="Loading settings…" />
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company settings"
        description="Centralized organization configuration used across HR, attendance, leave, payroll, and workflows. Changes apply prospectively — historical records are not modified."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings' }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const Icon = ICONS[item.icon] ?? Building2
          return (
            <Card key={item.id} className="border-surface-200 dark:border-surface-700">
              <CardContent className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-surface-100 p-2 text-surface-700 dark:bg-surface-800 dark:text-surface-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                      {item.label}
                    </h2>
                    <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                      {item.description}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-300">{cardSummary(item.id)}</p>
                <div className="mt-auto pt-1">
                  <Link
                    to={item.path}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-surface-300 bg-white px-3 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-100 dark:hover:bg-surface-800"
                  >
                    Manage
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
