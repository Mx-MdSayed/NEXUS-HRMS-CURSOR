import { Cake, CalendarPlus, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { formatDate } from '@/utils/date'
import type { UpcomingEvent } from '../types'

function eventIcon(type: UpcomingEvent['type']) {
  if (type === 'birthday') return Cake
  if (type === 'anniversary') return Gift
  return CalendarPlus
}

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No upcoming events" description="Birthdays and anniversaries will appear here." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const Icon = eventIcon(event.type)
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2.5 dark:border-surface-800"
            >
              <span className="rounded-lg bg-primary-50 p-2 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                  {event.personName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">{event.label}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-surface-600 dark:text-surface-300">
                {formatDate(event.date, 'dd MMM')}
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
