import type { LoginActivity, SecurityDashboardStats, UserSession } from '../types'
import { auditService } from './auditService'
import { userManagementService } from './userManagementService'

function delay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const loginActivity: LoginActivity[] = [
  {
    id: 'login_1',
    userId: 'usr_super_admin',
    userName: 'Ava Admin',
    email: 'admin@example.com',
    loggedInAt: '2026-08-08T08:10:00.000Z',
    ipPlaceholder: 'Not captured (demo)',
    devicePlaceholder: 'Desktop',
    browserPlaceholder: 'Chrome',
    status: 'success',
  },
  {
    id: 'login_2',
    userId: 'usr_hr_admin',
    userName: 'Harper HR',
    email: 'hr@example.com',
    loggedInAt: '2026-08-08T07:45:00.000Z',
    ipPlaceholder: 'Not captured (demo)',
    devicePlaceholder: 'Desktop',
    browserPlaceholder: 'Firefox',
    status: 'success',
  },
  {
    id: 'login_3',
    userId: 'usr_employee',
    userName: 'Eden Employee',
    email: 'employee@example.com',
    loggedInAt: '2026-08-07T18:20:00.000Z',
    ipPlaceholder: 'Not captured (demo)',
    devicePlaceholder: 'Mobile',
    browserPlaceholder: 'Safari',
    status: 'success',
  },
  {
    id: 'login_4',
    userId: 'unknown',
    userName: 'Unknown',
    email: 'unknown@example.com',
    loggedInAt: '2026-08-07T12:00:00.000Z',
    ipPlaceholder: 'Not captured (demo)',
    devicePlaceholder: 'Unknown',
    browserPlaceholder: 'Unknown',
    status: 'failed',
  },
]

let sessions: UserSession[] = [
  {
    id: 'sess_current',
    userId: 'usr_super_admin',
    userName: 'Ava Admin',
    devicePlaceholder: 'This browser',
    loginAt: '2026-08-08T08:10:00.000Z',
    lastActiveAt: new Date().toISOString(),
    status: 'active',
    isCurrent: true,
  },
  {
    id: 'sess_hr',
    userId: 'usr_hr_admin',
    userName: 'Harper HR',
    devicePlaceholder: 'Office workstation',
    loginAt: '2026-08-08T07:45:00.000Z',
    lastActiveAt: '2026-08-08T12:00:00.000Z',
    status: 'active',
  },
]

auditService.seed([
  {
    id: 'sec_1',
    userId: 'usr_super_admin',
    userName: 'Ava Admin',
    eventType: 'LOGIN_SUCCESS',
    description: 'Successful login',
    timestamp: '2026-08-08T08:10:00.000Z',
  },
  {
    id: 'sec_2',
    userId: 'usr_hr_admin',
    userName: 'Harper HR',
    eventType: 'LOGIN_SUCCESS',
    description: 'Successful login',
    timestamp: '2026-08-08T07:45:00.000Z',
  },
  {
    id: 'sec_3',
    userId: 'usr_super_admin',
    userName: 'Ava Admin',
    eventType: 'ROLE_CHANGED',
    description: 'Changed role for Noah Patel to HR Operations',
    timestamp: '2026-08-01T10:05:00.000Z',
  },
  {
    id: 'sec_4',
    userId: 'usr_hr_admin',
    userName: 'Harper HR',
    eventType: 'ACCOUNT_SUSPENDED',
    description: 'Suspended Aisha Khan: Security review in progress',
    timestamp: '2026-07-21T09:00:00.000Z',
  },
])

export const securityService = {
  async getDashboard(): Promise<SecurityDashboardStats> {
    await delay()
    const stats = userManagementService.getStats()
    const recentEvents = await auditService.list(8)
    return {
      activeUsers: stats.active,
      inactiveUsers: stats.inactive,
      suspendedUsers: stats.suspended,
      pendingUsers: stats.pending,
      recentLogins: loginActivity.slice(0, 6),
      recentEvents,
    }
  },

  async getLoginActivity(): Promise<LoginActivity[]> {
    await delay()
    return [...loginActivity]
  },

  async getSessions(): Promise<UserSession[]> {
    await delay()
    return [...sessions]
  },

  async signOutSession(sessionId: string): Promise<void> {
    await delay()
    sessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, status: 'signed_out', isCurrent: false } : session,
    )
    await auditService.log({
      eventType: 'SESSION_SIGNED_OUT',
      description: `Signed out session ${sessionId}`,
      metadata: { sessionId },
    })
  },

  async recordLogin(userId: string, userName: string, email: string, success: boolean): Promise<void> {
    loginActivity.unshift({
      id: `login_${Date.now()}`,
      userId,
      userName,
      email,
      loggedInAt: new Date().toISOString(),
      ipPlaceholder: 'Not captured (demo)',
      devicePlaceholder: 'Browser',
      browserPlaceholder: 'Current',
      status: success ? 'success' : 'failed',
    })
    await auditService.log({
      userId,
      userName,
      eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      description: success ? 'Successful login' : 'Failed login attempt',
    })
  },
}
