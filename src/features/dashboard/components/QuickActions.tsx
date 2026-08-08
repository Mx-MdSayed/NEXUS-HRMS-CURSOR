import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { getDashboardIcon } from '../utils/icons'
import type { QuickAction } from '../types'

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = getDashboardIcon(action.icon)
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(action.path)}
              className="flex items-start gap-3 rounded-lg border border-surface-200 p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:border-surface-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
            >
              <span className="rounded-lg bg-primary-50 p-2 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-surface-900 dark:text-surface-50">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-xs text-surface-500 dark:text-surface-400">
                  {action.description}
                </span>
              </span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
