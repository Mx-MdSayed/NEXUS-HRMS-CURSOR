import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, DataTable, Input, Select, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { WORKFLOW_STATUS_LABELS } from '../constants'
import { workflowService } from '../services/workflowService'
import { notificationTriggerService } from '@/features/notifications'
import type { WorkflowRequest, WorkflowStatus } from '../types'

export function WorkflowRequestsPage() {
  const { user, hasPermission } = useAuth()
  const [rows, setRows] = useState<WorkflowRequest[]>([])
  const [status, setStatus] = useState<WorkflowStatus | ''>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    void (async () => {
      const employeeId = await notificationTriggerService.resolveLinkedEmployeeId(user)
      const page = await workflowService.list({
        status,
        search,
        ownOrAssignedTo: hasPermission('workflow.manage') ? undefined : employeeId,
      }, 1, 100)
      setRows(page.data)
    })()
  }, [hasPermission, search, status, user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">Workflow Requests</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">Review requests assigned to you and track your own submissions.</p>
      </div>
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input placeholder="Search workflows" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as WorkflowStatus | '')}
            options={[
              { label: 'All statuses', value: '' },
              ...Object.entries(WORKFLOW_STATUS_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </CardContent>
      </Card>
      <DataTable isEmpty={rows.length === 0} columnCount={6}>
        <TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Requester</TableHead><TableHead>Assigned</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.title}<p className="text-xs text-surface-500">{row.description}</p></TableCell>
              <TableCell>{row.type.replaceAll('_', ' ')}</TableCell>
              <TableCell>{WORKFLOW_STATUS_LABELS[row.status]}</TableCell>
              <TableCell>{row.requesterName}</TableCell>
              <TableCell>{row.assignedToName ?? 'Unassigned'}</TableCell>
              <TableCell><Link to={`/workflows/requests/${row.id}`}><Button variant="ghost" size="sm">Open</Button></Link></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
