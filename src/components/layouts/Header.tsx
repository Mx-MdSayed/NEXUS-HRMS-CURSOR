import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, KeyRound, LogOut, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { APP_NAME, NAVIGATION_ITEMS } from '@/constants'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'
import { formatRole } from '@/utils/status'
import { Avatar, Button, Dropdown, Tooltip } from '@/components/ui'

function usePageTitle(): string {
  const { pathname } = useLocation()

  return useMemo(() => {
    if (pathname === '/change-password') return 'Change Password'
    const match = NAVIGATION_ITEMS.find((item) => item.path === pathname)
    return match?.label ?? APP_NAME
  }, [pathname])
}

export function Header() {
  const pageTitle = usePageTitle()
  const navigate = useNavigate()
  const { toggleCollapsed, openMobile, isCollapsed } = useSidebar()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, hasPermission, hasRole } = useAuth()
  const isEmployeeUser = hasRole(ROLES.EMPLOYEE)

  const fullName = user?.name ?? 'User'
  const roleLabel = user ? formatRole(user.role) : ''

  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserRound className="h-4 w-4" />,
      onClick: () => navigate(isEmployeeUser ? '/employee/profile' : '/profile'),
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => navigate(isEmployeeUser ? '/employee/settings' : '/change-password'),
    },
    ...(hasPermission(PERMISSIONS.SETTINGS_VIEW)
      ? [
          {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => navigate(isEmployeeUser ? '/employee/settings' : '/settings'),
          },
        ]
      : []),
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
  ]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-surface-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-surface-800 dark:bg-surface-900/95 dark:supports-[backdrop-filter]:bg-surface-900/80 sm:px-6">
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
          <p className="truncate font-display text-base font-semibold text-surface-900 dark:text-surface-50">
            {pageTitle}
          </p>
          <p className="hidden truncate text-xs text-surface-500 dark:text-surface-400 sm:block">
            {APP_NAME}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
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

        {hasPermission(PERMISSIONS.NOTIFICATION_VIEW) ? (
          <Tooltip content="Notifications">
            <Button
              variant="ghost"
              size="sm"
              className="relative !px-2"
              aria-label="Notifications"
              onClick={() => navigate(isEmployeeUser ? '/employee/notifications' : '/notifications')}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden />
            </Button>
          </Tooltip>
        ) : null}

        <Dropdown
          align="right"
          trigger={
            <span className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800">
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
