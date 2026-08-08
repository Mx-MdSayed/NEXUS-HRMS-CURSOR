import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
} from '@/components/ui'
import { formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { getAccessControlErrorMessage } from '../services/errors'
import { securityService } from '../services/securityService'
import type { LoginActivity, SecurityDashboardStats, UserSession } from '../types'

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-surface-500">{title}</p>
        <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export function SecurityDashboardPage() {
  const [data, setData] = useState<SecurityDashboardStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void securityService
      .getDashboard()
      .then(setData)
      .catch((err) => setError(getAccessControlErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader label="Loading security dashboard" />
  if (error || !data) return <ErrorState title="Unable to load security dashboard" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Account health, recent logins, and security events foundation."
        breadcrumbs={[{ label: 'Home' }, { label: 'Security' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/security/login-activity"><Button variant="secondary">Login Activity</Button></Link>
            <Link to="/security/sessions"><Button variant="secondary">Sessions</Button></Link>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Active users" value={data.activeUsers} />
        <Kpi title="Inactive users" value={data.inactiveUsers} />
        <Kpi title="Suspended users" value={data.suspendedUsers} />
        <Kpi title="Pending users" value={data.pendingUsers} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-3 text-card-title">Recent logins</h2>
            {data.recentLogins.length === 0 ? (
              <EmptyState title="No security events found." />
            ) : (
              <ul className="space-y-3 text-sm">
                {data.recentLogins.map((item) => (
                  <li key={item.id} className="rounded-lg border border-surface-200 p-3 dark:border-surface-800">
                    <p className="font-medium">{item.userName}</p>
                    <p className="text-surface-500">{formatDateTime(item.loggedInAt)} · {item.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 text-card-title">Recent security events</h2>
            {data.recentEvents.length === 0 ? (
              <EmptyState title="No security events found." />
            ) : (
              <ul className="space-y-3 text-sm">
                {data.recentEvents.map((event) => (
                  <li key={event.id} className="rounded-lg border border-surface-200 p-3 dark:border-surface-800">
                    <p className="font-medium">{event.eventType}</p>
                    <p>{event.description}</p>
                    <p className="text-surface-500">{formatDateTime(event.timestamp)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function LoginActivityPage() {
  const [rows, setRows] = useState<LoginActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void securityService.getLoginActivity().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader label="Loading login activity" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Login Activity"
        description="Demo login history. IP/device values are placeholders when real telemetry is unavailable."
        breadcrumbs={[{ label: 'Home' }, { label: 'Security', href: '/security' }, { label: 'Login Activity' }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No security events found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-950">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Login Date</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Browser</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.userName}</p>
                    <p className="text-xs text-surface-500">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(row.loggedInAt)}</td>
                  <td className="px-4 py-3">{row.ipPlaceholder}</td>
                  <td className="px-4 py-3">{row.devicePlaceholder}</td>
                  <td className="px-4 py-3">{row.browserPlaceholder}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function SessionsPage() {
  const [rows, setRows] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setRows(await securityService.getSessions())
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) return <PageLoader label="Loading sessions" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Session management foundation. Device details are placeholders in this demo."
        breadcrumbs={[{ label: 'Home' }, { label: 'Security', href: '/security' }, { label: 'Sessions' }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No active sessions found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-950">
              <tr>
                <th className="px-4 py-3 text-left">Session</th>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Login Time</th>
                <th className="px-4 py-3 text-left">Last Active</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="px-4 py-3">
                    {row.userName}
                    {row.isCurrent ? <span className="ml-2 text-xs text-primary-600">(current)</span> : null}
                  </td>
                  <td className="px-4 py-3">{row.devicePlaceholder}</td>
                  <td className="px-4 py-3">{formatDateTime(row.loginAt)}</td>
                  <td className="px-4 py-3">{formatDateTime(row.lastActiveAt)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await securityService.signOutSession(row.id)
                            showSuccess('Session signed out.')
                            await load()
                          } catch (error) {
                            showError(getAccessControlErrorMessage(error))
                          }
                        }}
                      >
                        Sign out
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
