import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import { CalendarDays, Clock3, Users, Wallet } from 'lucide-react'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
  TableContainer,
} from '@/components/ui'
import { PLACEHOLDER_USER } from '@/lib/placeholderUser'
import { formatRelativeDate } from '@/utils/date'

const kpiData = [
  { title: 'Total Employees', value: '—', hint: 'Live data in Module 5', icon: Users, trend: 'Placeholder' },
  { title: 'Present Today', value: '—', hint: 'Live data in Module 6', icon: Clock3, trend: 'Placeholder' },
  { title: 'Pending Leaves', value: '—', hint: 'Live data in Module 7', icon: CalendarDays, trend: 'Placeholder' },
  { title: 'Payroll Cycle', value: '—', hint: 'Live data in Module 8', icon: Wallet, trend: 'Placeholder' },
]

const attendanceTrend = [
  { day: 'Mon', present: 42 },
  { day: 'Tue', present: 48 },
  { day: 'Wed', present: 45 },
  { day: 'Thu', present: 50 },
  { day: 'Fri', present: 47 },
  { day: 'Sat', present: 20 },
]

const departmentDistribution = [
  { name: 'Engineering', count: 28 },
  { name: 'HR', count: 8 },
  { name: 'Finance', count: 10 },
  { name: 'Sales', count: 16 },
]

const recentActivity = [
  { id: '1', title: 'Foundation layout initialized', time: new Date().toISOString() },
  { id: '2', title: 'Design system components registered', time: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '3', title: 'Theme preference persistence enabled', time: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
]

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${PLACEHOLDER_USER.firstName}. Here is your HRMS overview shell.`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
        actions={<Badge variant="neutral">Module 1 Foundation</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            hint={item.hint}
            icon={item.icon}
            trend={item.trend}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Placeholder chart — real metrics arrive with Attendance module.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f918a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2f918a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="present" stroke="#2f918a" fill="url(#presentFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Placeholder chart — real headcount arrives with Employees module.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#247470" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <TableContainer
          className="xl:col-span-2"
          title="Recent Activity"
          description="Placeholder feed for upcoming notification and audit events."
        >
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm text-surface-800 dark:text-surface-100">{item.title}</span>
                <span className="shrink-0 text-xs text-surface-500">{formatRelativeDate(item.time)}</span>
              </li>
            ))}
          </ul>
        </TableContainer>

        <EmptyState
          title="No action items"
          description="Approvals, reminders, and HR tasks will appear here in later modules."
          className="h-full"
        />
      </div>
    </div>
  )
}
