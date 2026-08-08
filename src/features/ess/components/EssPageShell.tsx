import type { ReactNode } from 'react'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'

interface EssPageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  children: ReactNode
}

export function EssPageShell({
  title,
  description,
  actions,
  isLoading,
  error,
  onRetry,
  children,
}: EssPageShellProps) {
  if (isLoading) return <PageLoader label={`Loading ${title.toLowerCase()}`} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Employee Self-Service' }, { label: title }]}
        actions={actions}
      />
      {error ? <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={error} onRetry={onRetry} /> : children}
    </div>
  )
}
