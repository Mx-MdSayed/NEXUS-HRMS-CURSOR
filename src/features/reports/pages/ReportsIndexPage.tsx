import { useCallback } from 'react'
import { BarChart3, Building2, FileText, Users } from 'lucide-react'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { ReportBarChart, ReportKpiCard, ReportNav, ReportPieChart } from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { ReportFilters } from '../types'

const defaultFilters: ReportFilters = { preset: 'this_month' }

export function ReportsIndexPage() {
  const loader = useCallback(
    (filters: ReportFilters, auth: Parameters<typeof reportService.getOverviewReport>[1]) =>
      reportService.getOverviewReport(filters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(defaultFilters, loader)

  if (isLoading) return <PageLoader label="Loading reports" />
  if (error || !report) return <ErrorState title="Unable to load reports" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Read-only management reporting across Nexus HRMS modules."
        breadcrumbs={[{ label: 'Home' }, { label: 'Reports' }]}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Headcount" value={report.headcount} icon={Users} />
        <ReportKpiCard title="Departments" value={report.departments} icon={Building2} />
        <ReportKpiCard title="Attendance" value={`${report.attendancePercentage}%`} icon={BarChart3} />
        <ReportKpiCard title="Payslips" value={report.payslipsGenerated} icon={FileText} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBarChart title="Workforce by department" data={report.workforceByDepartment} />
        <ReportPieChart title="Leave status" data={report.leaveSummary} />
      </div>
      <ReportNav />
    </div>
  )
}
