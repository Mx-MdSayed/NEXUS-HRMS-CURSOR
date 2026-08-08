import type { EssNotification } from '../types'

export const initialEssNotifications: EssNotification[] = [
  {
    id: 'ess-notif-1003-leave-approved',
    employeeId: 'emp-1003',
    title: 'Leave request approved',
    message: 'Your recent leave request was approved by HR.',
    type: 'leave',
    isRead: false,
    createdAt: '2026-07-25T09:30:00.000Z',
    href: '/employee/leave',
  },
  {
    id: 'ess-notif-1003-payslip-ready',
    employeeId: 'emp-1003',
    title: 'Payslip is ready',
    message: 'Your latest generated payslip is available for viewing.',
    type: 'payslip',
    isRead: false,
    createdAt: '2026-07-29T10:00:00.000Z',
    href: '/employee/payslips',
  },
  {
    id: 'ess-notif-1003-attendance',
    employeeId: 'emp-1003',
    title: 'Attendance reminder',
    message: 'Review this month attendance and submit corrections before payroll cutoff.',
    type: 'attendance',
    isRead: true,
    createdAt: '2026-07-20T08:30:00.000Z',
    href: '/employee/attendance',
  },
  {
    id: 'ess-notif-1003-hr',
    employeeId: 'emp-1003',
    title: 'Profile review',
    message: 'Please keep your emergency contact and address information updated.',
    type: 'hr',
    isRead: true,
    createdAt: '2026-07-10T11:15:00.000Z',
    href: '/employee/profile',
  },
]
