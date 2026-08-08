import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Users } from 'lucide-react'
import { Card, CardContent, PageHeader, PageLoader } from '@/components/ui'
import { departmentService } from '@/features/organization/services/departmentService'
import { designationService } from '@/features/organization/services/designationService'
import { employeeService } from '@/features/employees/services/employeeService'
import { showError } from '@/utils/toast'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'

interface OrgSummary {
  companyName: string
  departmentCount: number
  designationCount: number
  employeeCount: number
  locationCount: number
  scheduleCount: number
  holidayCount: number
  leavePolicyCount: number
}

export function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<OrgSummary | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [org, deptResult, desigResult, empResult] = await Promise.all([
          settingsService.getOrganizationSettings(),
          departmentService.getDepartments({}, 1, 1),
          designationService.getDesignations({}, 1, 1),
          employeeService.getEmployees({ page: 1, pageSize: 1 }),
        ])
        if (!active) return
        setSummary({
          companyName: org.companyName,
          departmentCount: deptResult.total,
          designationCount: desigResult.total,
          employeeCount: empResult.total,
          locationCount: org.locationCount,
          scheduleCount: org.scheduleCount,
          holidayCount: org.holidayCount,
          leavePolicyCount: org.leavePolicyCount,
        })
      } catch (err) {
        showError(getSettingsErrorMessage(err, 'Unable to load organization overview.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <PageLoader label="Loading organization…" />
  if (!summary) return null

  const levels = [
    {
      label: 'Company',
      count: summary.companyName,
      icon: Building2,
      href: '/settings/company',
      countLabel: '1 entity',
    },
    {
      label: 'Departments',
      count: summary.departmentCount,
      icon: Building2,
      href: '/settings/departments',
      countLabel: `${summary.departmentCount} departments`,
    },
    {
      label: 'Designations',
      count: summary.designationCount,
      icon: Users,
      href: '/settings/designations',
      countLabel: `${summary.designationCount} designations`,
    },
    {
      label: 'Employees',
      count: summary.employeeCount,
      icon: Users,
      href: '/employees',
      countLabel: `${summary.employeeCount} employees`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Company structure overview — departments, designations, and workforce counts."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Organization' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Hierarchy: Company → Departments → Designations → Employees
          </p>
          <div className="space-y-2">
            {levels.map((level, index) => {
              const Icon = level.icon
              return (
                <div key={level.label} className="flex items-center gap-2">
                  {index > 0 ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-surface-400" aria-hidden />
                  ) : null}
                  <Link
                    to={level.href}
                    className="flex flex-1 items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
                  >
                    <span className="rounded-lg bg-white p-2 text-surface-600 dark:bg-surface-900 dark:text-surface-300">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {level.label}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {typeof level.count === 'string' ? level.count : level.countLabel}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-surface-400" aria-hidden />
                  </Link>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Locations</p>
            <p className="mt-1 text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {summary.locationCount}
            </p>
            <Link
              to="/settings/locations"
              className="mt-2 text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              Manage locations
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Schedules</p>
            <p className="mt-1 text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {summary.scheduleCount}
            </p>
            <Link
              to="/settings/work-schedules"
              className="mt-2 text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              Manage schedules
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Holidays</p>
            <p className="mt-1 text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {summary.holidayCount}
            </p>
            <Link
              to="/settings/holidays"
              className="mt-2 text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              Manage holidays
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Leave policies</p>
            <p className="mt-1 text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {summary.leavePolicyCount}
            </p>
            <Link
              to="/settings/leave-policies"
              className="mt-2 text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              Manage policies
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
