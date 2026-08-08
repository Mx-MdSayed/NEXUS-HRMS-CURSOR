import { useCallback, useState } from 'react'
import { AlertTriangle, Clock3, Percent, Users } from 'lucide-react'
import { ErrorState, PageLoader } from '@/components/ui'
import {
  ReportBarChart,
  ReportFilters,
  ReportKpiCard,
  ReportLineChart,
  ReportPageShell,
  ReportTable,
} from '../components'
import { useReportQuery } from '../hooks/useReportQuery'
import { reportService } from '../services/reportService'
import type { AttendanceEmployeeRow, ReportFilters as ReportFilterValues } from '../types'

const defaultFilters: ReportFilterValues = { preset: 'this_month' }

export function AttendanceReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValues>(defaultFilters)
  const loader = useCallback(
    (nextFilters: ReportFilterValues, auth: Parameters<typeof reportService.getAttendanceReport>[1]) =>
      reportService.getAttendanceReport(nextFilters, auth),
    [],
  )
  const { data: report, error, isLoading } = useReportQuery(filters, loader)

  if (isLoading && !report) return <PageLoader label="Loading attendance report" />
  if (error || !report) return <ErrorState title="Unable to load attendance report" message={error} />

  return (
    <ReportPageShell
      title="Attendance Reports"
      description="Monthly attendance KPIs, trend, late arrivals, absences, and employee-level summaries."
      exportFilename="attendance-report"
      exportColumns={[
        { key: 'employeeCode', header: 'Employee ID' },
        { key: 'fullName', header: 'Name' },
        { key: 'departmentName', header: 'Department' },
        { key: 'workingDays', header: 'Working Days' },
        { key: 'present', header: 'Present' },
        { key: 'absent', header: 'Absent' },
        { key: 'late', header: 'Late' },
        { key: 'attendancePercentage', header: 'Attendance %' },
      ]}
      exportRows={report.rows}
    >
      <ReportFilters value={filters} onApply={setFilters} onReset={() => setFilters(defaultFilters)} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportKpiCard title="Employees" value={report.totalEmployees} icon={Users} />
        <ReportKpiCard title="Attendance %" value={`${report.averageAttendancePercentage}%`} icon={Percent} />
        <ReportKpiCard title="Late days" value={report.late} icon={Clock3} />
        <ReportKpiCard title="Absent days" value={report.absent} icon={AlertTriangle} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReportLineChart title="Attendance trend" data={report.trend} />
        <ReportBarChart
          title="Attendance summary"
          data={[
            { name: 'Present', value: report.present },
            { name: 'Absent', value: report.absent },
            { name: 'Late', value: report.late },
            { name: 'On Leave', value: report.onLeave },
          ]}
        />
      </div>
      {report.lateEmployees.length > 0 ? (
        <ReportTable<AttendanceEmployeeRow>
          title="Attendance exceptions — late arrivals"
          rows={report.lateEmployees}
          pageSize={5}
          columns={[
            { key: 'employeeCode', header: 'Employee ID' },
            { key: 'fullName', header: 'Name' },
            { key: 'departmentName', header: 'Department' },
            { key: 'late', header: 'Late Days' },
          ]}
        />
      ) : null}
      {report.absentEmployees.length > 0 ? (
        <ReportTable<AttendanceEmployeeRow>
          title="Attendance exceptions — absences"
          rows={report.absentEmployees}
          pageSize={5}
          columns={[
            { key: 'employeeCode', header: 'Employee ID' },
            { key: 'fullName', header: 'Name' },
            { key: 'departmentName', header: 'Department' },
            { key: 'absent', header: 'Absent Days' },
          ]}
        />
      ) : null}
      <ReportTable<AttendanceEmployeeRow>
        title="Employee attendance"
        rows={report.rows}
        columns={[
          { key: 'employeeCode', header: 'Employee ID' },
          { key: 'fullName', header: 'Name' },
          { key: 'departmentName', header: 'Department' },
          { key: 'workingDays', header: 'Working Days' },
          { key: 'present', header: 'Present' },
          { key: 'absent', header: 'Absent' },
          { key: 'late', header: 'Late' },
          { key: 'totalWorkHours', header: 'Work Hours' },
          { key: 'attendancePercentage', header: 'Attendance %' },
        ]}
      />
    </ReportPageShell>
  )
}
