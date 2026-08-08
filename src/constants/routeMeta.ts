import { APP_NAME } from './app'

export interface RouteMeta {
  title: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

/** Static route metadata for browser titles and header breadcrumbs. */
const EXACT_META: Record<string, RouteMeta> = {
  '/dashboard': { title: 'Dashboard', breadcrumbs: [{ label: APP_NAME }, { label: 'Dashboard' }] },
  '/employees': {
    title: 'Employees',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Employees' }],
  },
  '/departments': {
    title: 'Departments',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Departments' }],
  },
  '/designations': {
    title: 'Designations',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Designations' }],
  },
  '/attendance': {
    title: 'Attendance',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Attendance' }],
  },
  '/leave': { title: 'Leave', breadcrumbs: [{ label: APP_NAME }, { label: 'Leave' }] },
  '/salary': { title: 'Salary', breadcrumbs: [{ label: APP_NAME }, { label: 'Salary' }] },
  '/payroll': { title: 'Payroll', breadcrumbs: [{ label: APP_NAME }, { label: 'Payroll' }] },
  '/payslips': { title: 'Payslips', breadcrumbs: [{ label: APP_NAME }, { label: 'Payslips' }] },
  '/reports': { title: 'Reports', breadcrumbs: [{ label: APP_NAME }, { label: 'Reports' }] },
  '/workflows': {
    title: 'Workflows',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Workflows' }],
  },
  '/notifications': {
    title: 'Notifications',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Notifications' }],
  },
  '/users': { title: 'Users', breadcrumbs: [{ label: APP_NAME }, { label: 'Users' }] },
  '/roles': { title: 'Roles', breadcrumbs: [{ label: APP_NAME }, { label: 'Roles' }] },
  '/permissions': {
    title: 'Permissions',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Permissions' }],
  },
  '/security': { title: 'Security', breadcrumbs: [{ label: APP_NAME }, { label: 'Security' }] },
  '/settings': { title: 'Settings', breadcrumbs: [{ label: APP_NAME }, { label: 'Settings' }] },
  '/profile': { title: 'My Profile', breadcrumbs: [{ label: APP_NAME }, { label: 'My Profile' }] },
  '/change-password': {
    title: 'Change Password',
    breadcrumbs: [{ label: APP_NAME }, { label: 'Change Password' }],
  },
  '/employee/dashboard': {
    title: 'Dashboard',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Dashboard' }],
  },
  '/employee/profile': {
    title: 'My Profile',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Profile' }],
  },
  '/employee/attendance': {
    title: 'My Attendance',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Attendance' }],
  },
  '/employee/leave': {
    title: 'My Leave',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Leave' }],
  },
  '/employee/salary': {
    title: 'My Compensation',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Salary' }],
  },
  '/employee/payslips': {
    title: 'My Payslips',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Payslips' }],
  },
  '/employee/documents': {
    title: 'Documents',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Documents' }],
  },
  '/employee/requests': {
    title: 'Requests',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Requests' }],
  },
  '/employee/notifications': {
    title: 'Notifications',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Notifications' }],
  },
  '/employee/settings': {
    title: 'Settings',
    breadcrumbs: [{ label: APP_NAME }, { label: 'My Portal' }, { label: 'Settings' }],
  },
}

const PREFIX_META: Array<{ prefix: string; meta: RouteMeta }> = [
  {
    prefix: '/employees/',
    meta: {
      title: 'Employee Details',
      breadcrumbs: [
        { label: APP_NAME },
        { label: 'Employees', href: '/employees' },
        { label: 'Details' },
      ],
    },
  },
  {
    prefix: '/settings/',
    meta: {
      title: 'Settings',
      breadcrumbs: [{ label: APP_NAME }, { label: 'Settings', href: '/settings' }, { label: 'Section' }],
    },
  },
  {
    prefix: '/reports/',
    meta: {
      title: 'Reports',
      breadcrumbs: [{ label: APP_NAME }, { label: 'Reports', href: '/reports' }, { label: 'Report' }],
    },
  },
  {
    prefix: '/payroll/',
    meta: {
      title: 'Payroll',
      breadcrumbs: [{ label: APP_NAME }, { label: 'Payroll', href: '/payroll' }, { label: 'Details' }],
    },
  },
]

export function getRouteMeta(pathname: string): RouteMeta {
  if (EXACT_META[pathname]) return EXACT_META[pathname]

  for (const { prefix, meta } of PREFIX_META) {
    if (pathname.startsWith(prefix)) return meta
  }

  const segment = pathname.split('/').filter(Boolean).pop()
  const title = segment ? segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : APP_NAME

  return { title, breadcrumbs: [{ label: APP_NAME }, { label: title }] }
}
