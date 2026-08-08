import { CardSkeleton, Skeleton, TableSkeleton } from '@/components/ui'
import { KpiGrid } from './KpiGrid'

export function DashboardSkeleton({ variant }: { variant: 'admin' | 'employee' }) {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      <KpiGrid items={[]} isLoading />
      {variant === 'admin' ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <CardSkeleton className="h-80" />
            <CardSkeleton className="h-80" />
          </div>
          <TableSkeleton rows={4} columns={6} />
          <div className="grid gap-4 xl:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
