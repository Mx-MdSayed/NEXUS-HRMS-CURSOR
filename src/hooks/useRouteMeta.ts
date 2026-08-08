import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMeta } from '@/constants/routeMeta'

export function useRouteMeta() {
  const { pathname } = useLocation()

  return useMemo(() => getRouteMeta(pathname), [pathname])
}
