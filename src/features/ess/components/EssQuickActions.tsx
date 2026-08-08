import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { EssDashboardData } from '../types'

export function EssQuickActions({ actions }: { actions: EssDashboardData['quickActions'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className="group rounded-lg border border-surface-200 p-4 transition hover:border-primary-300 hover:bg-primary-50 dark:border-surface-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-surface-900 dark:text-surface-50">{action.label}</p>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-surface-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
