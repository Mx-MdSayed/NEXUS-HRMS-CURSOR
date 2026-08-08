import { useCallback, useState } from 'react'
import { BarChart3, FileText, Users, Wallet } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { formatSalaryAmount } from '@/features/salary/utils/money'
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

export function ReportsOverviewPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getOverviewReport>[1]) =>
      reportService.getOverviewReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading report overview" />
  if (error || !report) return <ErrorState title="Unable to load overview" message={error} />

  return (
    <ReportPageShell
      title="Reports Overview"
      description="Executive read-only KPIs composed from workforce, attendance, leave, payroll, and payslip data."
      exportFilename="reports-overview"
      exportColumns={[
        { key: 'currency', header: 'Currency' },
        { key: 'netPayroll', header: 'Net Payroll' },
        { key: 'count', header: 'Run Count' },
      ]}
      exportRows={report.currencyTotals}
    >
      <ReportFilters
        value={filters}
        onApply={setFilters}
        onReset={() => setFilters(defaultFilters)}
        showStatus
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Headcount" value={report.headcount} icon={Users} />
        <ReportKpiCard title="Attendance %" value={`${report.attendancePercentage}%`} icon={BarChart3} />
        <ReportKpiCard title="Pending leave" value={report.pendingLeaveRequests} icon={FileText} />
        <ReportKpiCard
          title="Payroll currencies"
          value={report.currencyTotals.length}
          description={report.currencyTotals.map((item) => `${item.currency} ${formatSalaryAmount(item.netPayroll ?? 0, item.currency)}`).join(' · ') || 'No payroll totals'}
          icon={Wallet}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportBarChart title="Workforce by department" data={report.workforceByDepartment} />
        <ReportPieChart title="Attendance status" data={report.attendanceSummary} />
        <ReportPieChart title="Leave status" data={report.leaveSummary} />
        <ReportBarChart title="Payroll by currency" data={report.payrollByCurrency} />
      </div>
    </ReportPageShell>
  )
}
