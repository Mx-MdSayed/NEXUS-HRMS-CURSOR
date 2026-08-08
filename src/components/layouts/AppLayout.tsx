import { Outlet } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/utils/cn'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function AppLayoutShell() {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          isCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutShell />
    </SidebarProvider>
  )
}
