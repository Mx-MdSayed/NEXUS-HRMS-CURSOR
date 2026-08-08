import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import type { DepartmentDistributionItem } from '../types'

const PIE_COLORS = ['#247470', '#2f918a', '#48ada5', '#0284c7', '#d97706', '#516274', '#059669', '#b45309']

export function DepartmentDistributionChart({
  data,
  isLoading,
}: {
  data: DepartmentDistributionItem[]
  isLoading?: boolean
}) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.employeeCount,
    percentage: item.percentage,
  }))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Employees by Department</CardTitle>
          <CardDescription>Headcount distribution across departments.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart aria-label="Employees by department chart">
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const percentage = (item?.payload as { percentage?: number } | undefined)?.percentage
                  return [`${String(value)} (${percentage ?? 0}%)`, 'Employees']
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
