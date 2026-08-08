import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@/components/ui'
import { PriorityBadge } from '../components/PriorityBadge'
import { notificationTemplateService } from '../services/notificationTemplateService'
import type { NotificationTemplate } from '../types'

export function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])

  useEffect(() => {
    void notificationTemplateService.list().then(setTemplates)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">Notification Templates</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">Manage centralized event message templates.</p>
        </div>
        <Link to="/notifications/templates/new"><Button>New template</Button></Link>
      </div>
      <DataTable isEmpty={templates.length === 0} columnCount={6}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template.code}</TableCell>
              <TableCell>{template.category}</TableCell>
              <TableCell><PriorityBadge priority={template.priority} /></TableCell>
              <TableCell><Badge variant={template.isActive ? 'success' : 'neutral'}>{template.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
              <TableCell><Link to={`/notifications/templates/${template.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}
