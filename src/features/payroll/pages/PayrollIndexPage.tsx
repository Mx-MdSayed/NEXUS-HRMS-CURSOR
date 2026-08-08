import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, Plus, Settings2, Users } from 'lucide-react'
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
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { payrollService } from '../services/payrollService'
import type { PayrollOverviewStats, PayrollRun } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'
import { StatusBadge } from '@/components/ui'

export function PayrollIndexPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(PERMISSIONS.PAYROLL_CREATE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canSettings =
    hasPermission(PERMISSIONS.PAYROLL_SETTINGS_MANAGE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const canView = hasPermission(PERMISSIONS.PAYROLL_VIEW) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)

  const [stats, setStats] = useState<PayrollOverviewStats | null>(null)
  const [recent, setRecent] = useState<PayrollRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const [overview, runs] = await Promise.all([
          payrollService.getOverviewStats(),
          payrollService.getPayrollRuns({}),
        ])
        if (cancelled) return
        setStats(overview)
        setRecent(runs.slice(0, 5))
      } catch (err) {
        if (!cancelled) setError(getPayrollErrorMessage(err, 'Failed to load payroll overview.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!canView) {
    return <ErrorState title="Access denied" message="You do not have permission to view payroll." />
  }

  if (isLoading) return <PageLoader label="Loading payroll" />
  if (error || !stats) {
    return <ErrorState title="Unable to load payroll" message={error ?? 'Unknown error'} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Process monthly payroll using historical salary snapshots, attendance, and leave."
        breadcrumbs={[{ label: 'Home' }, { label: 'Payroll' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/payroll/runs/new')}>
                New Payroll Run
              </Button>
            ) : null}
            <Button variant="secondary" leftIcon={<Calculator className="h-4 w-4" />} onClick={() => navigate('/payroll/runs')}>
              Payroll Runs
            </Button>
            <Button variant="secondary" leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate('/payroll/employees')}>
              Employees
            </Button>
            {canSettings ? (
              <Button variant="ghost" leftIcon={<Settings2 className="h-4 w-4" />} onClick={() => navigate('/payroll/settings')}>
                Settings
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Current Payroll Month" value={stats.currentMonthLabel} />
        <StatCard title="Total Employees" value={String(stats.totalEmployees)} />
        <StatCard title="Gross Payroll" value={formatSalaryAmount(stats.grossPayroll, stats.currency)} />
        <StatCard title="Total Deductions" value={formatSalaryAmount(stats.totalDeductions, stats.currency)} />
        <StatCard
          title="Employer Contributions"
          value={formatSalaryAmount(stats.employerContributions, stats.currency)}
        />
        <StatCard title="Net Payroll" value={formatSalaryAmount(stats.netPayroll, stats.currency)} />
        <StatCard title="Pending Approval" value={String(stats.pendingApproval)} />
        <StatCard title="Finalized Payroll" value={String(stats.finalized)} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">Recent runs</h2>
            <Button variant="ghost" onClick={() => navigate('/payroll/runs')}>
              View all
            </Button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-surface-500">No payroll runs found.</p>
          ) : (
            <ul className="divide-y divide-surface-200 dark:divide-surface-700">
              {recent.map((run) => (
                <li key={run.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                      onClick={() => navigate(`/payroll/runs/${run.id}`)}
                    >
                      {run.name}
                    </button>
                    <p className="text-xs text-surface-500">
                      {run.employeeCount} employees · {formatSalaryAmount(run.totalNetPayroll, run.currency)} net
                    </p>
                  </div>
                  <StatusBadge status={payrollStatusTone(run.status)} label={payrollStatusLabel(run.status)} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
