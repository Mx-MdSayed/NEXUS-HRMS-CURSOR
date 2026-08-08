import type { DashboardKpi } from '../types'
import { StatCard } from '@/components/ui'
import { getDashboardIcon } from '../utils/icons'

export function KpiGrid({
  items,
  isLoading = false,
}: {
  items: DashboardKpi[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatCard key={index} title="" value="" isLoading />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <StatCard
          key={item.id}
          title={item.label}
          value={String(item.value)}
          description={item.subtitle}
          trend={item.trend}
          trendDirection={item.trendDirection}
          icon={getDashboardIcon(item.icon)}
        />
      ))}
    </div>
  )
}
