import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'
import { formatDate } from '@/utils/date'
import { LeaveCalendarGrid } from '../components/LeaveCalendarGrid'
import { LEAVE_REQUEST_STATUS_LABELS } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveCalendarDay } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

export function LeaveCalendarPage() {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.LEAVE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_APPROVE)

  const [monthKey, setMonthKey] = useState('2026-08')
  const [days, setDays] = useState<LeaveCalendarDay[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const linked = await leaveService.resolveLinkedEmployeeId(user ?? undefined)
        if (cancelled) return
        setEmployeeId(linked)
        const calendar = await leaveService.getLeaveCalendar({
          month: monthKey,
          departmentId: canManage ? departmentId || undefined : undefined,
          employeeId: canManage ? undefined : linked ?? undefined,
          selfOnly: !canManage,
        })
        if (!cancelled) setDays(calendar)
      } catch (err) {
        if (!cancelled) setError(getLeaveErrorMessage(err, 'Failed to load leave calendar.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canManage, departmentId, monthKey, user])

  const selectedEntries = useMemo(() => {
    if (!selectedDate) return []
    return days.find((item) => item.date === selectedDate)?.entries ?? []
  }, [days, selectedDate])

  const departments = listActiveDepartmentOptions()

  if (error) return <ErrorState title="Unable to load calendar" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Calendar"
        description={
          canManage
            ? 'Team and organization leave for the selected month.'
            : 'Your leave on the monthly calendar.'
        }
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Calendar' },
        ]}
        actions={
          canManage ? (
            <div className="w-56">
              <Select
                label="Department"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
                ]}
              />
            </div>
          ) : null
        }
      />

      <Card>
        <CardContent>
          {isLoading ? (
            <PageLoader label="Loading calendar" />
          ) : (
            <LeaveCalendarGrid
              monthKey={monthKey}
              days={days}
              onMonthChange={setMonthKey}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-card-title">
            {selectedDate ? `Leave on ${formatDate(selectedDate)}` : 'Select a day'}
          </h2>
          {!selectedDate ? (
            <p className="text-sm text-surface-500">Choose a date on the calendar to see details.</p>
          ) : selectedEntries.length === 0 ? (
            <EmptyState title="No leave on this day." description="No pending or approved leave entries." />
          ) : (
            <ul className="divide-y divide-surface-100 dark:divide-surface-800">
              {selectedEntries.map((entry) => (
                <li key={`${entry.requestId}-${entry.employeeId}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link
                      to={`/leave/${entry.requestId}`}
                      className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                    >
                      {canManage || entry.employeeId === employeeId
                        ? entry.employeeName
                        : 'Team member'}
                    </Link>
                    <p className="text-sm text-surface-500">
                      {entry.leaveTypeName} ({entry.leaveTypeCode})
                      {entry.isHalfDay ? ' · Half day' : ''}
                    </p>
                  </div>
                  <StatusBadge
                    status={entry.status}
                    label={LEAVE_REQUEST_STATUS_LABELS[entry.status]}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
