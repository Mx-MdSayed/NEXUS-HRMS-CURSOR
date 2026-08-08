import { PageHeader } from '@/components/ui'
import { formatDashboardDate, getGreeting } from '../utils/greeting'

export function DashboardHeader({
  userName,
  isEmployee,
}: {
  userName: string
  isEmployee: boolean
}) {
  const greeting = getGreeting()
  const today = formatDashboardDate()

  return (
    <PageHeader
      title="Dashboard"
      description={
        isEmployee
          ? `${greeting}, ${userName}. Here's your personal HR overview.`
          : `${greeting}, ${userName}. Here's what's happening across your organization today.`
      }
      breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      actions={<p className="text-sm text-surface-500 dark:text-surface-400">{today}</p>}
    />
  )
}
