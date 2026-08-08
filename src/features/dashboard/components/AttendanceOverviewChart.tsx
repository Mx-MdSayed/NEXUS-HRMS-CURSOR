import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import type { AttendanceOverviewItem } from '../types'

const COLORS: Record<string, string> = {
  present: '#247470',
  absent: '#dc2626',
  late: '#d97706',
  on_leave: '#0284c7',
}

export function AttendanceOverviewChart({
  data,
  isLoading,
}: {
  data: AttendanceOverviewItem[]
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Today&apos;s attendance breakdown across the organization.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} aria-label="Attendance overview chart">
              <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200 dark:stroke-surface-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Employees" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status] ?? '#247470'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
