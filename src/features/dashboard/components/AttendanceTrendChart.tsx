import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import type { AttendanceTrendPoint } from '../types'

export function AttendanceTrendChart({
  data,
  isLoading,
}: {
  data: AttendanceTrendPoint[]
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Attendance Trend</CardTitle>
          <CardDescription>Weekly attendance movement for the recent period.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} aria-label="Attendance trend chart">
              <defs>
                <linearGradient id="presentTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2f918a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2f918a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-surface-200 dark:stroke-surface-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="present" stroke="#2f918a" fill="url(#presentTrend)" />
              <Area type="monotone" dataKey="absent" stroke="#dc2626" fill="transparent" />
              <Area type="monotone" dataKey="late" stroke="#d97706" fill="transparent" />
              <Area type="monotone" dataKey="leave" stroke="#0284c7" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
