import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  Folders,
  GitBranch,
  Globe2,
  LayoutGrid,
  MapPin,
  Menu,
  Network,
  Palette,
  Palmtree,
  ScrollText,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessSettingsNav, SETTINGS_NAV } from '../utils/nav'

const ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  Building2,
  Network,
  Folders,
  BadgeCheck,
  MapPin,
  Clock3,
  CalendarDays,
  Palmtree,
  ClipboardCheck,
  Wallet,
  FileText,
  Globe2,
  Bell,
  GitBranch,
  Palette,
  ScrollText,
}

export function SettingsLayout() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = useMemo(
    () => SETTINGS_NAV.filter((item) => canAccessSettingsNav(item, hasPermission)),
    [hasPermission],
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="lg:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-800 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="settings-sidebar"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Settings menu
        </button>
      </div>

      <aside
        id="settings-sidebar"
        className={cn(
          'w-full shrink-0 rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900 lg:w-60',
          mobileOpen ? 'block' : 'hidden lg:block',
        )}
      >
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Settings
        </p>
        <nav className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto" aria-label="Settings">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutGrid
            const active =
              item.path === '/settings'
                ? location.pathname === '/settings'
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/settings'}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  active
                    ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950/50 dark:text-brand-100'
                    : 'text-surface-700 hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
