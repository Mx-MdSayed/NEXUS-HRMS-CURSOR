import { useEffect, useState } from 'react'
import { Building2, Users } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { ReportBarChart, ReportFilters, ReportKpiCard, ReportPageShell, ReportTable } from '../components'
import { reportService } from '../services/reportService'
import type { DepartmentReport, ReportFilters as ReportFilterValues } from '../types'
import { getReportErrorMessage } from '../utils/errors'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

type DepartmentReportRow = DepartmentReport['rows'][number]

export function DepartmentReportsPage() {
  const { hasPermission } = useAuth()
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const [report, setReport] = useState<DepartmentReport | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await reportService.getDepartmentReport(filters, { permissions: [], hasPermission })
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

  if (isLoading && !report) return <PageLoader label="Loading department report" />
  if (error || !report) return <ErrorState title="Unable to load department report" message={error} />

  const employeeCount = report.rows.reduce((sum, row) => sum + row.employeeCount, 0)

  return (
    <ReportPageShell
      title="Department Reports"
      description="Department-level workforce distribution, ownership, location, and status."
      exportFilename="department-report"
      exportColumns={[
        { key: 'code', header: 'Code' },
        { key: 'name', header: 'Department' },
        { key: 'headEmployeeName', header: 'Head' },
        { key: 'location', header: 'Location' },
        { key: 'status', header: 'Status' },
        { key: 'employeeCount', header: 'Employee Count' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters value={filters} onApply={setFilters} onReset={() => setFilters(defaultFilters)} showStatus />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportKpiCard title="Departments" value={report.rows.length} icon={Building2} />
        <ReportKpiCard title="Assigned employees" value={employeeCount} icon={Users} />
      </div>
      <ReportBarChart title="Employees by department" data={report.distribution} />
      <ReportTable<DepartmentReportRow>
        title="Department rows"
        rows={report.rows}
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'name', header: 'Department' },
          { key: 'headEmployeeName', header: 'Head' },
          { key: 'location', header: 'Location' },
          { key: 'status', header: 'Status' },
          { key: 'employeeCount', header: 'Employee Count' },
        ]}
      />
    </ReportPageShell>
  )
}
