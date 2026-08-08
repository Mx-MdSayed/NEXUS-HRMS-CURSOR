import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent } from '@/components/ui'
import type { ChartDatum } from '../types'

interface ReportLineChartProps {
  title: string
  data: ChartDatum[]
  dataKey?: string
}

export function ReportLineChart({ title, data, dataKey = 'value' }: ReportLineChartProps) {
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
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey={dataKey} stroke="#247470" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
