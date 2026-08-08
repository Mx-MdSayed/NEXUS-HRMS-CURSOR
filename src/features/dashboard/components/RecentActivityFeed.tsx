import { Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from '@/components/ui'
import { formatRelativeDate } from '@/utils/date'
import { getDashboardIcon } from '../utils/icons'
import type { ActivityItem } from '../types'

export function RecentActivityFeed({
  items,
  isLoading,
}: {
  items: ActivityItem[]
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No recent activity" description="HR activity updates will appear here." />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const Icon = getDashboardIcon(item.icon)
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-surface-100 p-2 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-800 dark:text-surface-100">{item.description}</p>
                    <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                      {item.actorName} · {formatRelativeDate(item.createdAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
