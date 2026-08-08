import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, StatusBadge } from '@/components/ui'
import { ATTENDANCE_STATUS_LABELS } from '../constants'
import type { CalendarDayAttendance } from '../types'
import { cn } from '@/utils/cn'

const statusDot: Record<string, string> = {
  present: 'bg-success-500',
  late: 'bg-warning-500',
  half_day: 'bg-info-500',
  absent: 'bg-danger-500',
  on_leave: 'bg-info-400',
  holiday: 'bg-surface-400',
  week_off: 'bg-surface-300',
  not_marked: 'bg-surface-200',
}

export function AttendanceCalendarGrid({
  monthKey,
  days,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  monthKey: string
  days: CalendarDayAttendance[]
  selectedDate?: string
  onSelectDate: (date: string) => void
  onMonthChange: (monthKey: string) => void
}) {
  const monthDate = parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date())
  const byDate = new Map(days.map((item) => [item.date, item]))
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
  const cells = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous month"
          onClick={() => onMonthChange(format(addMonths(monthDate, -1), 'yyyy-MM'))}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Prev
        </Button>
        <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50">
          {format(monthDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onMonthChange(format(new Date(), 'yyyy-MM'))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next month"
            onClick={() => onMonthChange(format(addMonths(monthDate, 1), 'yyyy-MM'))}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-surface-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const entry = byDate.get(dateKey)
          const inMonth = isSameMonth(day, monthDate)
          const status = entry?.status ?? 'not_marked'
          const selected = selectedDate === dateKey
          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                'min-h-20 rounded-xl border p-2 text-left transition-colors',
                'border-surface-200 bg-white hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900',
                !inMonth && 'invisible',
                selected && 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900',
              )}
              aria-label={`${dateKey} ${ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] ?? status}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-800 dark:text-surface-100">
                  {format(day, 'd')}
                </span>
                <span
                  className={cn('h-2.5 w-2.5 rounded-full', statusDot[status] ?? statusDot.not_marked)}
                  aria-hidden
                />
              </div>
              <div className="mt-2">
                {status !== 'not_marked' ? (
                  <StatusBadge status={status as never} />
                ) : (
                  <span className="text-xs text-surface-400">—</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
