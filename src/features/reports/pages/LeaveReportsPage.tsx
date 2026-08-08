import { useCallback, useState } from 'react'
import { CalendarCheck, Clock, FileText, Umbrella } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import { formatDate } from '@/utils/date'
import {
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportPieChart,
  ReportTable,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { LeaveReport, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

type LeaveRequestRow = LeaveReport['requests'][number]
type LeaveBalanceRow = LeaveReport['balances'][number]

export function LeaveReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getLeaveReport>[1]) =>
      reportService.getLeaveReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading leave report" />
  if (error || !report) return <ErrorState title="Unable to load leave report" message={error} />

  return (
    <ReportPageShell
      title="Leave Reports"
      description="Leave request status, leave type distribution, employee usage, and balances."
      exportFilename="leave-report"
      exportColumns={[
        { key: 'employeeCode', header: 'Employee ID' },
        { key: 'employeeName', header: 'Name' },
        { key: 'departmentName', header: 'Department' },
        { key: 'leaveTypeName', header: 'Leave Type' },
        { key: 'startDate', header: 'Start' },
        { key: 'endDate', header: 'End' },
        { key: 'duration', header: 'Duration' },
        { key: 'status', header: 'Status' },
      ]}
      exportRows={report.requests}
    >
      <ReportFilters value={filters} onApply={setFilters} onReset={() => setFilters(defaultFilters)} showStatus />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Requests" value={report.totalRequests} icon={FileText} />
        <ReportKpiCard title="Pending" value={report.pending} icon={Clock} />
        <ReportKpiCard title="Approved" value={report.approved} icon={CalendarCheck} />
        <ReportKpiCard title="On leave today" value={report.onLeaveToday} icon={Umbrella} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportPieChart title="Leave type mix" data={report.typeDistribution} />
        <ReportPieChart title="Request status" data={report.statusDistribution} />
      </div>
      <ReportTable<LeaveRequestRow>
        title="Leave requests"
        rows={report.requests}
        columns={[
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'employeeName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'leaveTypeName', header: 'Leave Type' },
          { key: 'startDate', header: 'Start', render: (row) => formatDate(row.startDate) },
          { key: 'endDate', header: 'End', render: (row) => formatDate(row.endDate) },
          { key: 'duration', header: 'Duration' },
          { key: 'status', header: 'Status' },
        ]}
      />
      <ReportTable<LeaveBalanceRow>
        title="Leave balances"
        rows={report.balances}
        columns={[
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'employeeName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'leaveTypeName', header: 'Leave Type' },
          { key: 'allocated', header: 'Allocated' },
          { key: 'used', header: 'Used' },
          { key: 'pending', header: 'Pending' },
          { key: 'available', header: 'Available' },
        ]}
      />
    </ReportPageShell>
  )
}
