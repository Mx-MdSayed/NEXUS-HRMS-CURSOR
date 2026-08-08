import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Layers } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { ReportBarChart, ReportFilters, ReportKpiCard, ReportPageShell, ReportTable } from '../components'
import { reportService } from '../services/reportService'
import type { DesignationReport, ReportFilters as ReportFilterValues } from '../types'
import { getReportErrorMessage } from '../utils/errors'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

type DesignationReportRow = DesignationReport['rows'][number]

export function DesignationReportsPage() {
  const { hasPermission } = useAuth()
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const [report, setReport] = useState<DesignationReport | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await reportService.getDesignationReport(filters, { permissions: [], hasPermission })
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
