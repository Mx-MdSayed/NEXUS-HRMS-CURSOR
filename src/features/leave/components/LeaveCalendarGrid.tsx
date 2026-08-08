import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { LeaveCalendarDay } from '../types'
import { LEAVE_REQUEST_STATUS_LABELS } from '../constants'

interface LeaveCalendarGridProps {
  monthKey: string
  days: LeaveCalendarDay[]
  onMonthChange: (monthKey: string) => void
  onSelectDate?: (date: string) => void
  selectedDate?: string
}

const statusDot: Record<string, string> = {
  pending: 'bg-warning-500',
  approved: 'bg-success-500',
  rejected: 'bg-danger-500',
  cancelled: 'bg-surface-400',
  withdrawn: 'bg-surface-400',
}

export function LeaveCalendarGrid({
  monthKey,
  days,
  onMonthChange,
  onSelectDate,
  selectedDate,
}: LeaveCalendarGridProps) {
  const monthDate = parseISO(`${monthKey}-01`)
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
  const cells = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const byDate = new Map(days.map((item) => [item.date, item]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          {format(monthDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous month"
            onClick={() => onMonthChange(format(addMonths(monthDate, -1), 'yyyy-MM'))}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMonthChange(format(new Date('2026-08-07'), 'yyyy-MM'))}
          >
            Current
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next month"
            onClick={() => onMonthChange(format(addMonths(monthDate, 1), 'yyyy-MM'))}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-surface-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const date = format(day, 'yyyy-MM-dd')
          const entry = byDate.get(date)
          const inMonth = isSameMonth(day, monthDate)
          const selected = selectedDate === date
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'min-h-[5.5rem] rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                inMonth
                  ? 'border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900'
                  : 'border-transparent bg-surface-50/60 text-surface-400 dark:bg-surface-950/40',
                selected && 'ring-2 ring-primary-500',
              )}
            >
              <div className="mb-1 text-xs font-semibold">{format(day, 'd')}</div>
              <div className="space-y-0.5">
                {(entry?.entries ?? []).slice(0, 3).map((item) => (
                  <div
                    key={`${item.requestId}-${item.employeeId}`}
                    className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-surface-800 dark:text-surface-100"
                    title={`${item.employeeName} · ${item.leaveTypeCode} · ${LEAVE_REQUEST_STATUS_LABELS[item.status]}`}
                  >
                    <span
                      className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', statusDot[item.status])}
                      aria-hidden
                    />
                    <span className="sr-only">{LEAVE_REQUEST_STATUS_LABELS[item.status]}</span>
                    {item.leaveTypeCode}
                    {item.isHalfDay ? ' ½' : ''} · {item.employeeName.split(' ')[0]}
                  </div>
                ))}
                {(entry?.entries.length ?? 0) > 3 ? (
                  <div className="text-[10px] text-surface-500">
                    +{(entry?.entries.length ?? 0) - 3} more
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
