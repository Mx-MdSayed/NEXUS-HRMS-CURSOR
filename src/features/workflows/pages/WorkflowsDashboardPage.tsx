import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { WORKFLOW_STATUS_LABELS } from '../constants'
import { workflowService } from '../services/workflowService'
import type { WorkflowRequest } from '../types'

export function WorkflowsDashboardPage() {
  const [rows, setRows] = useState<WorkflowRequest[]>([])

  useEffect(() => {
    void workflowService.list({}, 1, 100).then((page) => setRows(page.data))
  }, [])

  const pending = rows.filter((row) => row.status === 'pending' || row.status === 'under_review').length
  const needsInfo = rows.filter((row) => row.status === 'needs_information').length
  const completed = rows.filter((row) => row.status === 'completed' || row.status === 'approved').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">Workflows</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Centralized approvals for HRMS requests.</p>
        </div>
        <Link to="/workflows/requests"><Button>View requests</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-surface-500">Pending review</p><p className="font-display text-3xl font-semibold">{pending}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-surface-500">Needs information</p><p className="font-display text-3xl font-semibold">{needsInfo}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-surface-500">Completed / approved</p><p className="font-display text-3xl font-semibold">{completed}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent workflows</CardTitle></CardHeader>
        <CardContent>
          <DataTable isEmpty={rows.length === 0} columnCount={5}>
            <TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Assigned</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.slice(0, 8).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.type.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{WORKFLOW_STATUS_LABELS[row.status]}</TableCell>
                  <TableCell>{row.assignedToName ?? 'Unassigned'}</TableCell>
                  <TableCell><Link to={`/workflows/requests/${row.id}`}><Button variant="ghost" size="sm">Open</Button></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
