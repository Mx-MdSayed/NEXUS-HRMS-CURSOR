import type { EmployeeDashboardData } from '../types'

const now = Date.now()

export const mockEmployeeDashboard: EmployeeDashboardData = {
  generatedAt: new Date(now).toISOString(),
  attendanceToday: {
    status: 'present',
    checkIn: '09:42 AM',
  },
  monthlyAttendance: {
    present: 16,
    absent: 1,
    late: 2,
    leave: 1,
  },
  leaveBalances: [
    { type: 'Casual Leave', remaining: 8, total: 12 },
    { type: 'Sick Leave', remaining: 5, total: 8 },
    { type: 'Annual Leave', remaining: 12, total: 18 },
  ],
  pendingLeaveCount: 1,
  latestPayslip: {
    periodLabel: 'July 2026',
    netSalary: 48500,
    status: 'paid',
    issuedAt: '2026-07-31',
  },
  quickActions: [
    {
      id: 'apply-leave',
      label: 'Apply Leave',
      description: 'Submit a new leave request',
      icon: 'CalendarPlus',
      path: '/leave',
    },
    {
      id: 'view-attendance',
      label: 'View Attendance',
      description: 'Check your attendance history',
      icon: 'Clock3',
      path: '/attendance',
    },
    {
      id: 'view-payslip',
      label: 'View Payslip',
      description: 'Open your latest payslip',
      icon: 'FileText',
      path: '/payslips',
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      description: 'Review your personal details',
      icon: 'UserRound',
      path: '/profile',
    },
  ],
  upcomingEvents: [
    {
      id: 'ee-1',
      personName: 'Rahul Sharma',
      type: 'birthday',
      date: '2026-08-12',
      label: 'Birthday',
    },
    {
      id: 'ee-2',
      personName: 'You',
      type: 'anniversary',
      date: '2026-09-01',
      label: 'Work Anniversary',
    },
  ],
  notifications: [
    {
      id: 'en-1',
      title: 'Your payslip is ready',
      message: 'July 2026 payslip is available to download.',
      createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
      isRead: false,
    },
    {
      id: 'en-2',
      title: 'Leave request submitted',
      message: 'Your casual leave request is pending approval.',
      createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
      isRead: true,
    },
    {
      id: 'en-3',
      title: 'Attendance correction approved',
      message: 'Your attendance correction for 02 Aug was approved.',
      createdAt: new Date(now - 1000 * 60 * 400).toISOString(),
      isRead: true,
    },
  ],
  recentActivity: [
    {
      id: 'ea-1',
      description: 'You checked in at 09:42 AM',
      actorName: 'You',
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
      icon: 'Clock3',
    },
    {
      id: 'ea-2',
      description: 'Leave request submitted for review',
      actorName: 'You',
      createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
      icon: 'CalendarDays',
    },
  ],
}
