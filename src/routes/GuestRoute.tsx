import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageLoader label="Loading" />
  }

  if (isAuthenticated) {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect') || '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}
