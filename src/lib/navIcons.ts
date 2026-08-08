import {
  Banknote,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Shield,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  BriefcaseBusiness,
  Clock3,
  CalendarDays,
  Wallet,
  Banknote,
  FileText,
  FolderOpen,
  ClipboardList,
  RefreshCw,
  BarChart3,
  Bell,
  Shield,
  Settings,
  UserRound,
}

export function getNavIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard
}
