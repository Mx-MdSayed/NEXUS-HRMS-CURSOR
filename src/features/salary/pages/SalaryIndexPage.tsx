import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers3, Plus, Scale, Users } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  PageHeader,
  PageLoader,
  StatCard,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatSalaryAmount } from '../utils/money'
import { employeeSalaryService } from '../services/employeeSalaryService'
import type { SalaryOverviewStats } from '../types'
import { getSalaryErrorMessage } from '../utils/errors'

export function SalaryIndexPage() {
  const navigate = useNavigate()
  const { hasPermission, user } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SALARY_MANAGE) || hasPermission(PERMISSIONS.SALARY_CREATE)
  const canAssign = hasPermission(PERMISSIONS.SALARY_ASSIGN) || hasPermission(PERMISSIONS.SALARY_MANAGE)
  const canComponents =
    hasPermission(PERMISSIONS.SALARY_COMPONENT_MANAGE) || hasPermission(PERMISSIONS.SALARY_MANAGE)

  const [stats, setStats] = useState<SalaryOverviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownEmployeeId, setOwnEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        if (canManage || canAssign) {
          const overview = await employeeSalaryService.getOverviewStats()
          if (!cancelled) setStats(overview)
        } else {
          const { attendanceService } = await import(
            '@/features/attendance/services/attendanceService'
          )
          const linked = await attendanceService.resolveLinkedEmployeeId(user ?? undefined)
          if (!cancelled) setOwnEmployeeId(linked)
        }
      } catch (err) {
        if (!cancelled) setError(getSalaryErrorMessage(err, 'Failed to load salary overview.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canAssign, canManage, user])

  if (isLoading) return <PageLoader label="Loading compensation" />
  if (error) return <ErrorState title="Unable to load salary" message={error} />

  if (!canManage && !canAssign) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Compensation"
          description="View your current salary package."
          breadcrumbs={[{ label: 'Home' }, { label: 'Salary' }]}
          actions={
            ownEmployeeId ? (
              <Button onClick={() => navigate(`/salary/${ownEmployeeId}`)}>View details</Button>
            ) : null
          }
        />
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-surface-600 dark:text-surface-300">
              You can view your own compensation details when a salary has been assigned.
            </p>
            {ownEmployeeId ? (
              <Button variant="secondary" onClick={() => navigate(`/salary/${ownEmployeeId}`)}>
                Open my salary
              </Button>
            ) : (
              <p className="text-sm text-surface-500">No employee profile is linked to your account.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary & Compensation"
        description="Manage salary components, structures, assignments, and revisions."
        breadcrumbs={[{ label: 'Home' }, { label: 'Salary' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => navigate('/salary/structures/new')}
              >
                New structure
              </Button>
            ) : null}
            {canAssign ? (
              <Button variant="secondary" onClick={() => navigate('/salary/assignments/new')}>
                Assign salary
              </Button>
            ) : null}
          </div>
        }
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active structures"
            value={String(stats.structures)}
            icon={Layers3}
            description="Salary templates"
          />
          <StatCard
            title="Components"
            value={String(stats.components)}
            icon={Scale}
            description="Earnings & deductions"
          />
          <StatCard
            title="Employees with salary"
            value={String(stats.employeesWithSalary)}
            icon={Users}
            description="Active assignments"
          />
          <StatCard
            title="Pending revisions"
            value={String(stats.pendingRevisions)}
            icon={Scale}
            description="Awaiting apply"
          />
        </div>
      ) : null}

      {stats ? (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-surface-500">Total monthly gross (approx.)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatSalaryAmount(stats.totalMonthlyGross, stats.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Total annual CTC (approx.)</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatSalaryAmount(stats.totalAnnualCTC, stats.currency)}
              </p>
            </div>
            <p className="sm:col-span-2 text-xs text-surface-500">
              Aggregates prepare Dashboard/Payroll modules. Not a payroll run.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {canComponents ? (
          <Link
            to="/salary/components"
            className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
          >
            <p className="font-medium">Salary components</p>
            <p className="text-sm text-surface-500">Earnings, deductions, employer costs</p>
          </Link>
        ) : null}
        <Link
          to="/salary/structures"
          className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
        >
          <p className="font-medium">Salary structures</p>
          <p className="text-sm text-surface-500">Templates and CTC preview</p>
        </Link>
        <Link
          to="/salary/assignments"
          className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
        >
          <p className="font-medium">Assignments</p>
          <p className="text-sm text-surface-500">Employee salary packages</p>
        </Link>
        <Link
          to="/salary/revisions"
          className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
        >
          <p className="font-medium">Revisions</p>
          <p className="text-sm text-surface-500">History-preserving changes</p>
        </Link>
      </div>
    </div>
  )
}
