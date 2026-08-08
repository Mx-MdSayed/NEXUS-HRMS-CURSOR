import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from '@/components/ui'
import { PLACEHOLDER_USER } from '@/lib/placeholderUser'
import { formatDate } from '@/utils/date'
import { formatEmploymentStatus, formatRole } from '@/utils/status'

export function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Profile details are placeholder until authentication is implemented."
        breadcrumbs={[{ label: 'Home' }, { label: 'My Profile' }]}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-800 dark:bg-primary-950 dark:text-primary-200">
              {PLACEHOLDER_USER.firstName[0]}
              {PLACEHOLDER_USER.lastName[0]}
            </div>
            <div>
              <CardTitle>
                {PLACEHOLDER_USER.firstName} {PLACEHOLDER_USER.lastName}
              </CardTitle>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{PLACEHOLDER_USER.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Role</p>
            <p className="mt-1 text-sm font-medium">{formatRole(PLACEHOLDER_USER.role)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Status</p>
            <div className="mt-1">
              <Badge variant="success">{formatEmploymentStatus(PLACEHOLDER_USER.employmentStatus)}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Member since</p>
            <p className="mt-1 text-sm font-medium">{formatDate(PLACEHOLDER_USER.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">User ID</p>
            <p className="mt-1 text-sm font-medium">{PLACEHOLDER_USER.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
