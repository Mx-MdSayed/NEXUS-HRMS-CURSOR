import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { ReportAuthContext, ReportFilters } from '../types'
import { getReportErrorMessage } from '../utils/errors'

interface UseReportQueryResult<T> {
  data: T | null
  error: string
  isLoading: boolean
}

export function useReportQuery<T>(
  filters: ReportFilters,
  loader: (filters: ReportFilters, auth: ReportAuthContext) => Promise<T>,
): UseReportQueryResult<T> {
  const { hasPermission } = useAuth()
  const hasPermissionRef = useRef(hasPermission)
  hasPermissionRef.current = hasPermission

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const result = await loader(filters, {
          permissions: [],
          hasPermission: (permission) => hasPermissionRef.current(permission),
        })
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(getReportErrorMessage(err))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [filters, loader])

  return { data, error, isLoading }
}
