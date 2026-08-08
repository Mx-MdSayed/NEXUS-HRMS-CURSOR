import { useCallback, useState } from 'react'
import { ShieldCheck, UserCheck, Users } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import {
  ReportBarChart,
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportPieChart,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

export function WorkforceReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getWorkforceReport>[1]) =>
      reportService.getWorkforceReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

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
