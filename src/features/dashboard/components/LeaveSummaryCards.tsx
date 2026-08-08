import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import type { LeaveSummary } from '../types'

export function LeaveSummaryCards({ data }: { data: LeaveSummary }) {
  const items = [
    { label: 'Pending Requests', value: data.pending, variant: 'warning' as const },
    { label: 'Approved', value: data.approved, variant: 'success' as const },
    { label: 'Rejected', value: data.rejected, variant: 'danger' as const },
    { label: 'On Leave Today', value: data.onLeaveToday, variant: 'info' as const },
  ]

  if (items.every((item) => item.value === 0)) {
    return <EmptyState title="No leave activity" description="Leave summary will appear here." />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-surface-200 px-4 py-3 dark:border-surface-800"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-surface-500 dark:text-surface-400">{item.label}</p>
              <Badge variant={item.variant}>{item.label.split(' ')[0]}</Badge>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
