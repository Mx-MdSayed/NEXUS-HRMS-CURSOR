import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { APP_NAME, APP_SHORT_NAME, NAVIGATION_ITEMS } from '@/constants'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { getNavIcon } from '@/lib/navIcons'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 font-display text-sm font-bold text-white">
        N
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-surface-900 dark:text-surface-50">
            {APP_NAME}
          </p>
          <p className="truncate text-xs text-surface-500 dark:text-surface-400">{APP_SHORT_NAME} Platform</p>
        </div>
      ) : null}
    </div>
  )
}

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { hasPermission, hasRole } = useAuth()
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const visibleItems = useMemo(
    () =>
      NAVIGATION_ITEMS.filter((item) => {
        if (!item.requiredPermission) return true
        return hasPermission(item.requiredPermission)
      }),
    [hasPermission],
  )

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Main">
      {visibleItems.map((item) => {
        const Icon = getNavIcon(item.icon)
        const label =
          isEmployeeUser && item.selfServiceLabel ? item.selfServiceLabel : item.label

        const link = (
          <NavLink
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed ? <span>{label}</span> : <span className="sr-only">{label}</span>}
          </NavLink>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.id} content={label} side="bottom">
              {link}
            </Tooltip>
          )
        }

        return <div key={item.id}>{link}</div>
      })}
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
          className="fixed inset-0 z-40 bg-surface-950/40 lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-surface-200 bg-white transition-transform duration-200 lg:hidden',
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
