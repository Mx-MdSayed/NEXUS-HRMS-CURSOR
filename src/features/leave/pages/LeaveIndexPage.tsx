import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardList, Plus, Scale, Tags } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { LeaveStatCards } from '../components/LeaveStatCards'
import { WhosOnLeave } from '../components/WhosOnLeave'
import { LEAVE_REQUEST_STATUS_LABELS } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveOverviewStats, OnLeaveTodayItem, UpcomingLeaveItem } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

export function LeaveIndexPage() {
  const navigate = useNavigate()
  const { user, hasPermission, isLoading: authLoading } = useAuth()
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_APPROVE)
  const canApply =
    hasPermission(PERMISSIONS.LEAVE_APPLY) || hasPermission(PERMISSIONS.LEAVE_CREATE)
  const canManageTypes = hasPermission(PERMISSIONS.LEAVE_TYPE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_MANAGE)
  const canViewBalances =
    hasPermission(PERMISSIONS.LEAVE_BALANCE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_MANAGE)

  const [stats, setStats] = useState<LeaveOverviewStats | null>(null)
  const [upcoming, setUpcoming] = useState<UpcomingLeaveItem[]>([])
  const [onLeave, setOnLeave] = useState<OnLeaveTodayItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setHasError(false)
      try {
        const employeeId = canManage
          ? undefined
          : (await leaveService.resolveLinkedEmployeeId(user ?? undefined)) ?? undefined
        const [overview, upcomingRows, onLeaveRows] = await Promise.all([
          leaveService.getOverviewStats(employeeId),
          leaveService.getUpcomingLeave(6, employeeId),
          canManage ? leaveService.getWhoIsOnLeave() : Promise.resolve([]),
        ])
        if (cancelled) return
        setStats(overview)
        setUpcoming(upcomingRows)
        setOnLeave(onLeaveRows)
      } catch (error) {
        if (cancelled) return
        setHasError(true)
        setErrorMessage(getLeaveErrorMessage(error, 'Failed to load leave overview.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    if (!authLoading) void load()
    return () => {
      cancelled = true
    }
  }, [authLoading, canManage, user])

  if (authLoading || (isLoading && !stats)) {
    return <PageLoader label="Loading leave overview" />
  }

  if (hasError) {
    return <ErrorState title="Unable to load leave" message={errorMessage} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description={
          canManage
            ? 'Organization leave overview, approvals, and balances.'
            : 'Your leave balances, requests, and upcoming time off.'
        }
        breadcrumbs={[{ label: 'Home' }, { label: 'Leave' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canApply ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/leave/apply')}>
                Apply Leave
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => navigate('/leave/my')}>
              My Leave
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              onClick={() => navigate('/leave/calendar')}
            >
              Calendar
            </Button>
          </div>
        }
      />

      {stats ? (
        <LeaveStatCards
          stats={stats}
          variant={canManage ? 'admin' : 'employee'}
          isLoading={isLoading}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/leave/requests"
          className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
        >
          <ClipboardList className="mb-2 h-5 w-5 text-primary-600" />
          <p className="font-medium">Leave Requests</p>
          <p className="text-sm text-surface-500">History and approvals</p>
        </Link>
        <Link
          to="/leave/calendar"
          className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
        >
          <CalendarDays className="mb-2 h-5 w-5 text-primary-600" />
          <p className="font-medium">Leave Calendar</p>
          <p className="text-sm text-surface-500">Monthly leave view</p>
        </Link>
        {canManageTypes ? (
          <Link
            to="/leave/types"
            className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
          >
            <Tags className="mb-2 h-5 w-5 text-primary-600" />
            <p className="font-medium">Leave Types</p>
            <p className="text-sm text-surface-500">Configure policies</p>
          </Link>
        ) : null}
        {canViewBalances ? (
          <Link
            to="/leave/balances"
            className="rounded-xl border border-surface-200 bg-white p-4 hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900"
          >
            <Scale className="mb-2 h-5 w-5 text-primary-600" />
            <p className="font-medium">Leave Balances</p>
            <p className="text-sm text-surface-500">Allocations and usage</p>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-card-title">Upcoming leave</h2>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming leave." description="There are no approved upcoming leaves." />
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {upcoming.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <Link
                        to={`/leave/${item.id}`}
                        className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                      >
                        {canManage ? item.employeeName : item.leaveTypeName}
                      </Link>
                      <p className="text-sm text-surface-500">
                        {canManage ? item.leaveTypeName : null}
                        {canManage ? ' · ' : null}
                        {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.duration}d
                      </p>
                    </div>
                    <StatusBadge
                      status={item.status}
                      label={LEAVE_REQUEST_STATUS_LABELS[item.status]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-card-title">Who&apos;s on leave</h2>
              <WhosOnLeave items={onLeave} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-card-title">Quick actions</h2>
              <div className="flex flex-col gap-2">
                {canApply ? (
                  <Button onClick={() => navigate('/leave/apply')}>Apply for leave</Button>
                ) : null}
                <Button variant="secondary" onClick={() => navigate('/leave/my')}>
                  View my leave history
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
