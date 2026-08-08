import { formatDistanceToNow, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import type { EssDashboardData } from '../types'

export function EssRecentActivity({ items }: { items: EssDashboardData['recentActivity'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Leave, attendance, payslip, and HR updates will appear here."
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{item.title}</p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{item.description}</p>
                  <p className="mt-1 text-xs text-surface-400">
                    {formatDistanceToNow(parseISO(item.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
