import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Avatar } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { formatEmploymentStatus, formatRole } from '@/utils/status'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your authenticated account profile."
        breadcrumbs={[{ label: 'Home' }, { label: 'My Profile' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/change-password')}>
            Change Password
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Role</p>
            <p className="mt-1 text-sm font-medium">{formatRole(user.role)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Status</p>
            <div className="mt-1">
              <Badge variant="success">{formatEmploymentStatus(user.employmentStatus)}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Employee ID</p>
            <p className="mt-1 text-sm font-medium">{user.employeeId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Last login</p>
            <p className="mt-1 text-sm font-medium">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Member since</p>
            <p className="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">User ID</p>
            <p className="mt-1 text-sm font-medium">{user.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
