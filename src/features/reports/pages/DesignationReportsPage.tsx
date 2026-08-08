import { useCallback, useState } from 'react'
import { BriefcaseBusiness, Layers } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { ReportBarChart, ReportFilters, ReportKpiCard, ReportPageShell, ReportTable } from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { DesignationReport, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

type DesignationReportRow = DesignationReport['rows'][number]

export function DesignationReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getDesignationReport>[1]) =>
      reportService.getDesignationReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading designation report" />
  if (error || !report) return <ErrorState title="Unable to load designation report" message={error} />

  return (
    <ReportPageShell
      title="Designation Reports"
      description="Designation distribution by level, department, and assigned employee count."
      exportFilename="designation-report"
      exportColumns={[
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Designation' },
        { key: 'departmentName', header: 'Department' },
        { key: 'level', header: 'Level' },
        { key: 'status', header: 'Status' },
        { key: 'employeeCount', header: 'Employee Count' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters value={filters} onApply={setFilters} onReset={() => setFilters(defaultFilters)} showStatus />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportKpiCard title="Designations" value={report.rows.length} icon={BriefcaseBusiness} />
        <ReportKpiCard title="Levels" value={report.distribution.length} icon={Layers} />
      </div>
      <ReportBarChart title="Designations by level" data={report.distribution} />
      <ReportTable<DesignationReportRow>
        title="Designation rows"
        rows={report.rows}
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Designation' },
          { key: 'departmentName', header: 'Department' },
          { key: 'level', header: 'Level' },
          { key: 'status', header: 'Status' },
          { key: 'employeeCount', header: 'Employee Count' },
        ]}
      />
    </ReportPageShell>
  )
}
