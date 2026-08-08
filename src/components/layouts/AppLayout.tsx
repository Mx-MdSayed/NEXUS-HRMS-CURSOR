import { Outlet } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/utils/cn'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function AppLayoutShell() {
  const { isCollapsed } = useSidebar()
  useDocumentTitle()

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 motion-reduce:transition-none',
          isCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        <Header />
        <main className="page-content flex-1 overflow-y-auto">
          <div className="page-container">
            <Outlet />
          </div>
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
