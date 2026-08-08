import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent } from '@/components/ui'
import type { ChartDatum } from '../types'

interface ReportBarChartProps {
  title: string
  data: ChartDatum[]
  dataKey?: string
}

export function ReportBarChart({ title, data, dataKey = 'value' }: ReportBarChartProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-card-title">{title}</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#247470" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
