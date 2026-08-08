import {
  Bell,
  CalendarDays,
  Clock3,
  FileText,
  Megaphone,
  RefreshCw,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { NotificationCategory } from '../types'

export function NotificationIcon({ category, className = 'h-4 w-4' }: { category: NotificationCategory; className?: string }) {
  const props = { className }
  if (category === 'leave') return <CalendarDays {...props} />
  if (category === 'attendance') return <Clock3 {...props} />
  if (category === 'profile') return <UserRound {...props} />
  if (category === 'payroll') return <Wallet {...props} />
  if (category === 'payslip') return <FileText {...props} />
  if (category === 'workflow') return <RefreshCw {...props} />
  if (category === 'announcement') return <Megaphone {...props} />
  return <Bell {...props} />
}
