import { Link } from 'react-router-dom'
import { EmptyState, StatusBadge } from '@/components/ui'
import { formatDate } from '@/utils/date'
import type { OnLeaveTodayItem } from '../types'
import { LEAVE_REQUEST_STATUS_LABELS } from '../constants'

interface WhosOnLeaveProps {
  items: OnLeaveTodayItem[]
  isLoading?: boolean
}

export function WhosOnLeave({ items, isLoading }: WhosOnLeaveProps) {
  if (isLoading) {
    return <p className="text-sm text-surface-500">Loading who&apos;s on leave…</p>
  }
  if (items.length === 0) {
    return <EmptyState title="No employees are on leave." description="Nobody is on approved leave today." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-surface-200 text-xs uppercase tracking-wide text-surface-500 dark:border-surface-700">
          <tr>
            <th className="px-3 py-2 font-medium">Employee</th>
            <th className="px-3 py-2 font-medium">Department</th>
            <th className="px-3 py-2 font-medium">Leave Type</th>
            <th className="px-3 py-2 font-medium">Date Range</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-surface-100 dark:border-surface-800"
            >
              <td className="px-3 py-2.5">
                <Link
                  to={`/leave/${item.id}`}
                  className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                >
                  {item.employeeName}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-surface-600 dark:text-surface-300">
                {item.departmentName}
              </td>
              <td className="px-3 py-2.5">{item.leaveTypeName}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge
                  status={item.status}
                  label={LEAVE_REQUEST_STATUS_LABELS[item.status]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
