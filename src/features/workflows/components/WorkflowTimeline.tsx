import { formatDateTime } from '@/utils/date'
import { WORKFLOW_STATUS_LABELS } from '../constants'
import type { WorkflowHistory } from '../types'

export function WorkflowTimeline({ history }: { history: WorkflowHistory[] }) {
  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="border-l-2 border-primary-200 pl-4 dark:border-primary-900">
          <p className="font-medium text-surface-900 dark:text-surface-50">
            {WORKFLOW_STATUS_LABELS[item.toStatus]} by {item.actorName}
          </p>
          <p className="text-xs text-surface-500">{formatDateTime(item.createdAt)}</p>
          {item.comment ? <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">{item.comment}</p> : null}
        </div>
      ))}
    </div>
  )
}
