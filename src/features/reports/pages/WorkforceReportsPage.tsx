import { useEffect, useState } from 'react'
import { ShieldCheck, UserCheck, Users } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  ReportBarChart,
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportPieChart,
} from '../components'
import { reportService } from '../services/reportService'
import type { ReportFilters as ReportFilterValues, WorkforceReport } from '../types'
import { getReportErrorMessage } from '../utils/errors'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

export function WorkforceReportsPage() {
  const { hasPermission } = useAuth()
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const [report, setReport] = useState<WorkforceReport | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await reportService.getWorkforceReport(filters, { permissions: [], hasPermission })
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled) setError(getReportErrorMessage(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [filters, hasPermission])

  if (isLoading && !report) return <PageLoader label="Loading workforce report" />
  if (error || !report) return <ErrorState title="Unable to load workforce report" message={error} />

  return (
    <ReportPageShell
      title="Workforce Analytics"
      description="Headcount, employment type, tenure, department, and salary range analytics."
      exportFilename="workforce-report"
      exportColumns={[
        { key: 'name', header: 'Segment' },
        { key: 'value', header: 'Employees' },
      ]}
      exportRows={report.byDepartment}
    >
      <ReportFilters value={filters} onApply={setFilters} onReset={() => setFilters(defaultFilters)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <ReportKpiCard title="Headcount" value={report.headcount} icon={Users} />
        <ReportKpiCard title="Active employees" value={report.active} icon={UserCheck} />
        <ReportKpiCard title="Probation" value={report.probation} icon={ShieldCheck} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportPieChart title="Employment type" data={report.byEmploymentType} />
        <ReportBarChart title="Tenure buckets" data={report.byTenure} />
        <ReportBarChart title="Department headcount" data={report.byDepartment} />
        {report.salaryRangeByCurrency.map((item) => (
          <ReportBarChart
            key={item.currency}
            title={`Salary ranges (${item.currency})`}
            data={item.buckets}
          />
        ))}
      </div>
    </ReportPageShell>
  )
}
