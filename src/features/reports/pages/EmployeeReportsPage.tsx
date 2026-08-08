import { useCallback, useState } from 'react'
import { UserCheck, UserPlus, Users } from 'lucide-react'
import { Card, CardContent, ErrorState, PageLoader } from '@/components/ui'
import { formatDate } from '@/utils/date'
import {
  ReportBarChart,
  ReportFilters,
  ReportKpiCard,
  ReportPageShell,
  ReportPieChart,
  ReportTable,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { EmployeeReportRow, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

export function EmployeeReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getEmployeeReport>[1]) =>
      reportService.getEmployeeReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading employee report" />
  if (error || !report) return <ErrorState title="Unable to load employee report" message={error} />

  return (
    <ReportPageShell
      title="Employee Reports"
      description="Employee directory analytics, status summaries, and new joiner visibility."
      exportFilename="employee-report"
      exportColumns={[
        { key: 'employeeCode', header: 'Employee ID' },
        { key: 'fullName', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'departmentName', header: 'Department' },
        { key: 'designationName', header: 'Designation' },
        { key: 'employmentType', header: 'Employment Type' },
        { key: 'employmentStatus', header: 'Status' },
        { key: 'joiningDate', header: 'Joining Date' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters
        value={filters}
        onApply={setFilters}
        onReset={() => setFilters(defaultFilters)}
        showStatus
        statusOptions={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Probation', value: 'probation' },
          { label: 'Terminated', value: 'terminated' },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <ReportKpiCard title="Total employees" value={report.total} icon={Users} />
        <ReportKpiCard title="Active" value={report.active} icon={UserCheck} />
        <ReportKpiCard title="New joiners" value={report.newJoiners.length} icon={UserPlus} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportPieChart title="Status summary" data={report.statusDistribution} />
        <ReportBarChart title="Department distribution" data={report.departmentDistribution} />
      </div>
      <Card>
        <CardContent>
          <h2 className="mb-3 text-card-title">New joiners</h2>
          {report.newJoiners.length === 0 ? (
            <p className="text-sm text-surface-500">No employees found for the selected joining period.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.newJoiners.map((employee) => (
                <div
                  key={employee.employeeId}
                  className="rounded-lg border border-surface-200 p-3 dark:border-surface-800"
                >
                  <p className="font-medium text-surface-900 dark:text-surface-50">{employee.fullName}</p>
                  <p className="text-sm text-surface-500">{employee.departmentName}</p>
                  <p className="mt-1 text-xs text-surface-500">Joined {formatDate(employee.joiningDate)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ReportTable<EmployeeReportRow>
        title="Employee rows"
        rows={report.rows}
        columns={[
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'fullName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'designationName', header: 'Designation' },
          { key: 'employmentType', header: 'Employment Type' },
          { key: 'employmentStatus', header: 'Status' },
          { key: 'joiningDate', header: 'Joining Date', render: (row) => formatDate(row.joiningDate) },
          { key: 'tenureMonths', header: 'Tenure (months)' },
        ]}
      />
    </ReportPageShell>
  )
}
