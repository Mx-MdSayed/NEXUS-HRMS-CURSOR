import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plane,
  XCircle,
} from 'lucide-react'
import { StatCard } from '@/components/ui'
import type { LeaveOverviewStats } from '../types'

interface LeaveStatCardsProps {
  stats: LeaveOverviewStats
  variant: 'admin' | 'employee'
  isLoading?: boolean
}

export function LeaveStatCards({ stats, variant, isLoading }: LeaveStatCardsProps) {
  if (variant === 'employee') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Leave"
          value={String(stats.availableLeave ?? 0)}
          icon={Plane}
          description="Across leave types"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Requests"
          value={String(stats.pending)}
          icon={Clock3}
          description="Awaiting decision"
          isLoading={isLoading}
        />
        <StatCard
          title="Approved This Month"
          value={String(stats.approvedThisMonth ?? 0)}
          icon={CheckCircle2}
          description="Current month"
          isLoading={isLoading}
        />
        <StatCard
          title="Upcoming Leave"
          value={String(stats.upcomingCount ?? 0)}
          icon={CalendarDays}
          description="Future approved"
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Total Requests"
        value={String(stats.totalRequests)}
        icon={Plane}
        description="All statuses"
        isLoading={isLoading}
      />
      <StatCard
        title="Pending"
        value={String(stats.pending)}
        icon={Clock3}
        description="Needs review"
        isLoading={isLoading}
      />
      <StatCard
        title="Approved"
        value={String(stats.approved)}
        icon={CheckCircle2}
        description="Committed"
        isLoading={isLoading}
      />
      <StatCard
        title="Rejected"
        value={String(stats.rejected)}
        icon={XCircle}
        description="Declined"
        isLoading={isLoading}
      />
      <StatCard
        title="On Leave Today"
        value={String(stats.onLeaveToday)}
        icon={CalendarDays}
        description="Currently away"
        isLoading={isLoading}
      />
    </div>
  )
}
