import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import {
  APP_NAME,
  APP_SHORT_NAME,
  ESS_NAVIGATION_ITEMS,
  NAVIGATION_GROUP_LABELS,
  NAVIGATION_GROUP_ORDER,
  NAVIGATION_ITEMS,
} from '@/constants'
import type { NavigationGroupId } from '@/constants/navigationGroups'
import { ROLES } from '@/constants/roles'
import type { NavigationItem } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { getNavIcon } from '@/lib/navIcons'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 font-display text-sm font-bold text-white shadow-sm">
        NX
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-surface-900 dark:text-surface-50">
            {APP_NAME}
          </p>
          <p className="truncate text-xs text-surface-500 dark:text-surface-400">{APP_SHORT_NAME} HRMS</p>
        </div>
      ) : null}
    </div>
  )
}

function groupNavItems(items: NavigationItem[]): Array<{ group: NavigationGroupId; items: NavigationItem[] }> {
  const buckets = new Map<NavigationGroupId, NavigationItem[]>()

  for (const item of items) {
    const group = item.group ?? 'main'
    const list = buckets.get(group) ?? []
    list.push(item)
    buckets.set(group, list)
  }

  return NAVIGATION_GROUP_ORDER
    .filter((group) => buckets.has(group))
    .map((group) => ({ group, items: buckets.get(group)! }))
}

function NavLinkItem({
  item,
  collapsed,
  label,
  path,
  onNavigate,
}: {
  item: NavigationItem
  collapsed: boolean
  label: string
  path: string
  onNavigate?: () => void
}) {
  const Icon = getNavIcon(item.icon)

  const link = (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : <span className="sr-only">{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip key={item.id} content={label} side="right">
        {link}
      </Tooltip>
    )
  }

  return <div key={item.id}>{link}</div>
}

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { hasPermission, hasRole } = useAuth()
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const visibleItems = useMemo(() => {
    const items = isEmployeeUser ? ESS_NAVIGATION_ITEMS : NAVIGATION_ITEMS
    return items.filter((item) => {
      if (!item.requiredPermission) return true
      return hasPermission(item.requiredPermission)
    })
  }, [hasPermission, isEmployeeUser])

  const grouped = useMemo(() => groupNavItems(visibleItems), [visibleItems])

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Main">
      {grouped.map(({ group, items }) => (
        <div key={group} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              {NAVIGATION_GROUP_LABELS[group]}
            </p>
          ) : (
            <div className="mx-auto h-px w-8 bg-surface-200 dark:bg-surface-700" aria-hidden />
          )}
          {items.map((item) => {
            const label = isEmployeeUser && item.selfServiceLabel ? item.selfServiceLabel : item.label
            const path = isEmployeeUser && item.selfServicePath ? item.selfServicePath : item.path
            return (
              <NavLinkItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                label={label}
                path={path}
                onNavigate={onNavigate}
              />
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapsed } = useSidebar()

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-[1px] motion-safe:transition-opacity lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-surface-200 bg-white shadow-lg transition-transform duration-200 motion-safe:lg:shadow-none lg:hidden',
          'dark:border-surface-800 dark:bg-surface-900',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-800">
          <BrandMark collapsed={false} />
          <Button variant="ghost" size="sm" className="!px-2" aria-label="Close menu" onClick={closeMobile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <NavItems collapsed={false} onNavigate={closeMobile} />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-surface-200 bg-white transition-[width] duration-200 lg:flex',
          'dark:border-surface-800 dark:bg-surface-900',
          isCollapsed ? 'w-[4.5rem]' : 'w-64',
        )}
        aria-label="Desktop sidebar"
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-surface-200 dark:border-surface-800',
            isCollapsed ? 'justify-center px-2' : 'px-4',
          )}
        >
          <BrandMark collapsed={isCollapsed} />
        </div>
        <NavItems collapsed={isCollapsed} />
        <div className="border-t border-surface-200 p-3 dark:border-surface-800">
          <Button
            variant="ghost"
            className={cn('w-full', isCollapsed ? 'justify-center !px-2' : 'justify-start')}
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!isCollapsed ? <span>Collapse</span> : null}
          </Button>
        </div>
      </aside>
    </>
  )
}
