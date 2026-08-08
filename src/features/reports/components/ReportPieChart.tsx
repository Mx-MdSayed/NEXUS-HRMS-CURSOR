import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui'
import type { ChartDatum } from '../types'

const COLORS = ['#247470', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6b7c8f']

interface ReportPieChartProps {
  title: string
  data: ChartDatum[]
}

export function ReportPieChart({ title, data }: ReportPieChartProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-card-title">{title}</h2>
        <div className="h-72 w-full" role="img" aria-label={`${title} chart`}>
          {data.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-surface-500">
              No data available for the selected filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={96}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
