import type { CompanySettings } from '@/types'
import { APP_NAME } from '@/constants/app'

export const companyDefaults: CompanySettings = {
  companyName: APP_NAME,
  legalName: 'Nexus Technologies Pvt. Ltd.',
  timezone: 'Asia/Kolkata',
  dateFormat: 'dd MMM yyyy',
  currencyCode: 'INR',
  currencyLocale: 'en-IN',
  fiscalYearStartMonth: 4,
  workWeekStart: 1,
}

export const routes = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  changePassword: '/change-password',
  dashboard: '/dashboard',
  employees: '/employees',
  departments: '/departments',
  designations: '/designations',
  attendance: '/attendance',
  leave: '/leave',
  payroll: '/payroll',
  payslips: '/payslips',
  reports: '/reports',
  notifications: '/notifications',
  users: '/users',
  settings: '/settings',
  profile: '/profile',
  accessDenied: '/403',
} as const
