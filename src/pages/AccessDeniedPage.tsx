import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-danger-50 p-3 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400">
            <ShieldAlert className="h-8 w-8" aria-hidden />
          </div>
          <p className="font-display text-4xl font-semibold text-surface-900 dark:text-surface-50">403</p>
          <h1 className="mt-2 text-section-title">Access Denied</h1>
          <p className="mt-2 max-w-sm text-sm text-surface-500 dark:text-surface-400">
            You don&apos;t have permission to access this page.
          </p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
