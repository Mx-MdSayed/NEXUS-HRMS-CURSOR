import {
  Users,
  UserCheck,
  UserX,
  Clock3,
  CalendarDays,
  CircleHelp,
  CloudSun,
} from 'lucide-react'
import { StatCard } from '@/components/ui'
import type { TodayAttendanceStats } from '../types'

export function AttendanceStatCards({
  stats,
  isLoading,
}: {
  stats: TodayAttendanceStats
  isLoading?: boolean
}) {
  const items = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: Users },
    { title: 'Present', value: stats.present, icon: UserCheck },
    { title: 'Absent', value: stats.absent, icon: UserX },
    { title: 'Late', value: stats.late, icon: Clock3 },
    { title: 'Half Day', value: stats.halfDay, icon: CloudSun },
    { title: 'On Leave', value: stats.onLeave, icon: CalendarDays },
    { title: 'Not Marked', value: stats.notMarked, icon: CircleHelp },
    { title: 'Week Off / Holiday', value: stats.weekOff + stats.holiday, icon: CalendarDays },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.title}
          title={item.title}
          value={String(item.value)}
          icon={item.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
