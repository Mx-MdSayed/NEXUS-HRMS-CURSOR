import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { REPORT_DEFINITIONS } from '../definitions'
import type { ReportCategory } from '../types'

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  workforce: 'Workforce',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
}

export function ReportNav() {
  const { hasPermission } = useAuth()
  const visible = REPORT_DEFINITIONS.filter((definition) => hasPermission(definition.permission))
  const grouped = visible.reduce<Record<ReportCategory, typeof visible>>(
    (map, definition) => {
      map[definition.category] = [...map[definition.category], definition]
      return map
    },
    { workforce: [], attendance: [], leave: [], payroll: [] },
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(Object.keys(grouped) as ReportCategory[]).map((category) =>
        grouped[category].length > 0 ? (
          <Card key={category}>
            <CardContent className="space-y-3">
              <h2 className="text-card-title">{CATEGORY_LABELS[category]}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped[category].map((definition) => (
                  <Link
                    key={definition.id}
                    to={definition.route}
                    className="rounded-lg border border-surface-200 p-4 transition hover:border-primary-300 hover:bg-primary-50 dark:border-surface-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
                  >
                    <BarChart3 className="mb-2 h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <p className="font-medium text-surface-900 dark:text-surface-50">{definition.name}</p>
                    <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                      {definition.description}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null,
      )}
    </div>
  )
}
