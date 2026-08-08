import type { NavigationItem } from '@/types'

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'employees', label: 'Employees', path: '/employees', icon: 'Users', module: 'Module 5' },
  { id: 'departments', label: 'Departments', path: '/departments', icon: 'Building2', module: 'Module 5' },
  { id: 'designations', label: 'Designations', path: '/designations', icon: 'BriefcaseBusiness', module: 'Module 5' },
  { id: 'attendance', label: 'Attendance', path: '/attendance', icon: 'Clock3', module: 'Module 6' },
  { id: 'leave', label: 'Leave', path: '/leave', icon: 'CalendarDays', module: 'Module 7' },
  { id: 'payroll', label: 'Payroll', path: '/payroll', icon: 'Wallet', module: 'Module 8' },
  { id: 'payslips', label: 'Payslips', path: '/payslips', icon: 'FileText', module: 'Module 8' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: 'BarChart3', module: 'Module 9' },
  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: 'Bell', module: 'Module 4' },
  { id: 'users', label: 'Users', path: '/users', icon: 'Shield', module: 'Module 3' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings', module: 'Module 2' },
]
