import {
  BarChart3,
  Building2,
  Cake,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Gift,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UserX,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const dashboardIconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Clock3,
  Building2,
  UserPlus,
  ClipboardCheck,
  Wallet,
  BarChart3,
  CheckCircle2,
  FileText,
  CalendarPlus,
  UserRound,
  Cake,
  Gift,
}

export function getDashboardIcon(name: string): LucideIcon {
  return dashboardIconMap[name] ?? Users
}
