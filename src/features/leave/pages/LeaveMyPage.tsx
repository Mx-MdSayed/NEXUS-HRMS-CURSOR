import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { LeaveStatCards } from '../components/LeaveStatCards'
import { LEAVE_REQUEST_STATUS_LABELS, LEAVE_REQUEST_STATUSES } from '../constants'
import { leaveService } from '../services/leaveService'
import type {
  LeaveBalance,
  LeaveOverviewStats,
  LeaveRequestListItem,
  LeaveType,
} from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

type TabKey = 'all' | 'pending' | 'approved' | 'rejected'

export function LeaveMyPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canApply =
    hasPermission(PERMISSIONS.LEAVE_APPLY) || hasPermission(PERMISSIONS.LEAVE_CREATE)

  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [stats, setStats] = useState<LeaveOverviewStats | null>(null)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [types, setTypes] = useState<LeaveType[]>([])
  const [requests, setRequests] = useState<LeaveRequestListItem[]>([])
  const [tab, setTab] = useState<TabKey>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
      if (!linked) {
        setError('No employee profile is linked to your account.')
        return
      }
      setEmployeeId(linked)
      const [overview, bals, leaveTypes, history] = await Promise.all([
        leaveService.getOverviewStats(linked),
        leaveService.getEmployeeLeaveBalances(linked),
        leaveService.getLeaveTypes(true),
        leaveService.getLeaveRequests({ employeeId: linked }, 1, 100),
      ])
      setStats(overview)
      setBalances(bals)
      setTypes(leaveTypes)
      setRequests(history.data)
    } catch (err) {
      setError(getLeaveErrorMessage(err, 'Failed to load your leave data.'))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  if (isLoading) return <PageLoader label="Loading my leave" />
  if (error) return <ErrorState title="Unable to load my leave" message={error} />

  const filtered = requests.filter((item) => {
    if (tab === 'all') return true
    if (tab === 'pending') return item.status === LEAVE_REQUEST_STATUSES.PENDING
    if (tab === 'approved') return item.status === LEAVE_REQUEST_STATUSES.APPROVED
    if (tab === 'rejected') return item.status === LEAVE_REQUEST_STATUSES.REJECTED
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        description="Your balances, pending requests, and leave history."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'My Leave' },
        ]}
        actions={
          canApply ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/leave/apply')}>
              Apply Leave
            </Button>
          ) : null
        }
      />

      {stats ? <LeaveStatCards stats={stats} variant="employee" /> : null}

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-card-title">Leave balance</h2>
          {balances.length === 0 ? (
            <EmptyState
              title="No leave balance available."
              description="Balances will appear once leave types are allocated."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-surface-200 text-xs uppercase text-surface-500 dark:border-surface-700">
                  <tr>
                    <th className="px-3 py-2">Leave Type</th>
                    <th className="px-3 py-2">Allocated</th>
                    <th className="px-3 py-2">Carry Forward</th>
                    <th className="px-3 py-2">Used</th>
                    <th className="px-3 py-2">Pending</th>
                    <th className="px-3 py-2">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((item) => {
                    const type = types.find((t) => t.id === item.leaveTypeId)
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-surface-100 dark:border-surface-800"
                      >
                        <td className="px-3 py-2.5 font-medium">
                          {type?.name ?? item.leaveTypeId}
                        </td>
                        <td className="px-3 py-2.5">{item.allocated}</td>
                        <td className="px-3 py-2.5">{item.carryForward}</td>
                        <td className="px-3 py-2.5">{item.used}</td>
                        <td className="px-3 py-2.5">{item.pending}</td>
                        <td className="px-3 py-2.5 font-semibold">{item.available}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-card-title">Leave history</h2>
            <Tabs defaultValue="all" onValueChange={(value) => setTab(value as TabKey)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No leave requests found." description="Try another filter or apply for leave." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-surface-200 text-xs uppercase text-surface-500 dark:border-surface-700">
                  <tr>
                    <th className="px-3 py-2">Leave Type</th>
                    <th className="px-3 py-2">Dates</th>
                    <th className="px-3 py-2">Days</th>
                    <th className="px-3 py-2">Applied</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-surface-100 dark:border-surface-800"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/leave/${item.id}`}
                          className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                        >
                          {item.leaveTypeName}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                        {item.isHalfDay ? ' (½)' : ''}
                      </td>
                      <td className="px-3 py-2.5">{item.duration}</td>
                      <td className="px-3 py-2.5">{formatDate(item.appliedAt)}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          status={item.status}
                          label={LEAVE_REQUEST_STATUS_LABELS[item.status]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {employeeId ? null : null}
        </CardContent>
      </Card>
    </div>
  )
}
