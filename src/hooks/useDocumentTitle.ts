import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMeta } from '@/constants/routeMeta'
import { formatPageTitle } from '@/utils/pageTitle'

/** Syncs `document.title` with the current route. */
export function useDocumentTitle(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    const { title } = getRouteMeta(pathname)
    document.title = formatPageTitle(title)
  }, [pathname])
}
