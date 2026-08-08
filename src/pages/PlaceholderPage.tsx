import { Construction } from 'lucide-react'
import { Badge, Card, CardContent, PageHeader } from '@/components/ui'

export interface PlaceholderPageProps {
  title: string
  moduleLabel: string
  description?: string
}

export function PlaceholderPage({
  title,
  moduleLabel,
  description = 'This module will be implemented in a later release. The navigation and layout foundations are ready.',
}: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader
        title={title}
        description={`${title} — Coming in ${moduleLabel}`}
        breadcrumbs={[{ label: 'Home' }, { label: title }]}
      />

      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 rounded-full bg-surface-100 p-3 text-surface-500 dark:bg-surface-800 dark:text-surface-300">
            <Construction className="h-7 w-7" aria-hidden />
          </div>
          <Badge variant="info" className="mb-3">
            {moduleLabel}
          </Badge>
          <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50">
            {title} — Coming Soon
          </h2>
          <p className="mt-2 max-w-lg text-sm text-surface-500 dark:text-surface-400">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
