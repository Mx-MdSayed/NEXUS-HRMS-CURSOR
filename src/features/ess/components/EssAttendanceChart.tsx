import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { EmployeeAttendanceStats } from '@/features/attendance/types'

export function EssAttendanceChart({ stats }: { stats: EmployeeAttendanceStats }) {
  const data = [
    { name: 'Present', days: stats.presentDays },
    { name: 'Late', days: stats.lateDays },
    { name: 'Half Day', days: stats.halfDays },
    { name: 'Leave', days: stats.leaveDays },
    { name: 'Absent', days: stats.absentDays },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="days" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
