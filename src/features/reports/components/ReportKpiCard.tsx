import type { LucideIcon } from 'lucide-react'
import { StatCard } from '@/components/ui'
import type { TrendDirection } from '@/components/ui'

interface ReportKpiCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: string
  trendDirection?: TrendDirection
}

export function ReportKpiCard({
  title,
  value,
  description,
  icon,
  trend,
  trendDirection,
}: ReportKpiCardProps) {
  return (
    <StatCard
      title={title}
      value={String(value)}
      description={description}
      icon={icon}
      trend={trend}
      trendDirection={trendDirection}
    />
  )
}
