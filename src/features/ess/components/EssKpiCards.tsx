import { Bell, CalendarCheck, FileText, Wallet } from 'lucide-react'
import { StatCard } from '@/components/ui'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import type { EssDashboardData } from '../types'

const iconMap = {
  attendance: CalendarCheck,
  leave: CalendarCheck,
  salary: Wallet,
  payslips: FileText,
  notifications: Bell,
}

export function EssKpiCards({ kpis }: { kpis: EssDashboardData['kpis'] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const value =
          kpi.id === 'salary' && kpi.hint ? formatSalaryAmount(Number(kpi.value), kpi.hint) : kpi.value
        return (
          <StatCard
            key={kpi.id}
            title={kpi.label}
            value={value}
            description={kpi.hint}
            icon={iconMap[kpi.id as keyof typeof iconMap]}
          />
        )
      })}
    </div>
  )
}
