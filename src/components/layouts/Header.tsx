import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouteMeta } from '@/hooks/useRouteMeta'
import { cn } from '@/utils/cn'
import { formatRole } from '@/utils/status'
import { Avatar, Button, Dropdown, Tooltip } from '@/components/ui'
import { NotificationBell } from '@/features/notifications'

function HeaderBreadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs?: Array<{ label: string; href?: string }>
}) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span className="text-surface-300 dark:text-surface-600" aria-hidden>/</span> : null}
              {crumb.href && !isLast ? (
                <Link
                  to={crumb.href}
                  className="truncate transition-colors hover:text-surface-700 dark:hover:text-surface-200"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate',
                    isLast && 'font-medium text-surface-700 dark:text-surface-200',
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function Header() {
  const { title, breadcrumbs } = useRouteMeta()
  const navigate = useNavigate()
  const { toggleCollapsed, openMobile, isCollapsed } = useSidebar()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, hasPermission, hasRole } = useAuth()
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const fullName = user?.name ?? 'User'
  const roleLabel = user ? formatRole(user.role) : ''

  const menuItems: Array<{
    id: string
    label: string
    icon: ReactNode
    onClick: () => void
    danger?: boolean
  }> = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserRound className="h-4 w-4" />,
      onClick: () => navigate(isEmployeeUser ? '/employee/profile' : '/profile'),
    },
  ]

  if (hasPermission(PERMISSIONS.SETTINGS_VIEW)) {
    menuItems.push({
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate(isEmployeeUser ? '/employee/settings' : '/settings'),
    })
  }

  menuItems.push(
    {
      id: 'change-password',
      label: 'Change Password',
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => navigate(isEmployeeUser ? '/employee/settings' : '/change-password'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        void logout().then(() => {
          navigate('/login', { replace: true })
        })
      },
    },
  )

  return (
    <header
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-surface-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-surface-800 dark:bg-surface-900/95 dark:supports-[backdrop-filter]:bg-surface-900/80 sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="!px-2 lg:hidden"
          aria-label="Open navigation menu"
          onClick={openMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="hidden !px-2 lg:inline-flex"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapsed}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-surface-900 dark:text-surface-50 sm:text-base">
            {title}
          </p>
          <HeaderBreadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
          <Button
            variant="ghost"
            size="sm"
            className="!px-2"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </Tooltip>

        {hasPermission(PERMISSIONS.NOTIFICATION_VIEW) ? <NotificationBell /> : null}

        <Dropdown
          align="right"
          trigger={
            <span className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-surface-100 dark:hover:bg-surface-800">
              <Avatar name={fullName} src={user?.avatarUrl} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-surface-900 dark:text-surface-50">
                  {fullName}
                </span>
                <span className="block text-xs text-surface-500 dark:text-surface-400">{roleLabel}</span>
              </span>
            </span>
          }
          items={menuItems}
        />
      </div>
    </header>
  )
}
