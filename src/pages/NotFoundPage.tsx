import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-surface-100 p-3 text-surface-500 dark:bg-surface-800 dark:text-surface-300">
            <SearchX className="h-8 w-8" aria-hidden />
          </div>
          <p className="font-display text-4xl font-semibold text-surface-900 dark:text-surface-50">404</p>
          <h1 className="mt-2 text-section-title">Page Not Found</h1>
          <p className="mt-2 max-w-sm text-sm text-surface-500 dark:text-surface-400">
            The page you are looking for doesn&apos;t exist or may have been moved.
          </p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
