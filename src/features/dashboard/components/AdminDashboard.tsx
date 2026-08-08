import type { AdminDashboardData } from '../types'
import { AttendanceOverviewChart } from './AttendanceOverviewChart'
import { AttendanceTrendChart } from './AttendanceTrendChart'
import { DepartmentDistributionChart } from './DepartmentDistributionChart'
import { KpiGrid } from './KpiGrid'
import { LeaveSummaryCards } from './LeaveSummaryCards'
import { NotificationPreview } from './NotificationPreview'
import { PayrollSummaryCard } from './PayrollSummaryCard'
import { QuickActions } from './QuickActions'
import { RecentActivityFeed } from './RecentActivityFeed'
import { RecentEmployees } from './RecentEmployees'
import { RecentLeaveRequests } from './RecentLeaveRequests'
import { TodayAttendance } from './TodayAttendance'
import { UpcomingEvents } from './UpcomingEvents'

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-6">
      <KpiGrid items={data.kpis} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendanceOverviewChart data={data.attendanceOverview} />
        <AttendanceTrendChart data={data.attendanceTrend} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LeaveSummaryCards data={data.leaveSummary} />
        </div>
        <DepartmentDistributionChart data={data.departmentDistribution} />
      </div>

      <RecentLeaveRequests data={data.recentLeaveRequests} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentEmployees data={data.recentEmployees} />
        <TodayAttendance data={data.todayAttendance} />
      </div>

      <QuickActions actions={data.quickActions} />

      <div className="grid gap-4 xl:grid-cols-3">
        <PayrollSummaryCard data={data.payrollSummary} />
        <UpcomingEvents events={data.upcomingEvents} />
        <NotificationPreview items={data.notifications} />
      </div>

      <RecentActivityFeed items={data.recentActivity} />
    </div>
  )
}
