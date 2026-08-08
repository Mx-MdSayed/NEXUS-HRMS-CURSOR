import { Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export function AttendanceIndexPage() {
  const { isLoading } = useAuth()
  if (isLoading) return <PageLoader label="Opening attendance" />
  return <Navigate to="/attendance/today" replace />
}
