import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  Modal,
  PageHeader,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { LeaveTypeForm } from '../components/LeaveTypeForm'
import { LEAVE_CATEGORY_LABELS } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveType, LeaveTypeFormValues } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

export function LeaveTypesPage() {
  const { user, hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.LEAVE_TYPE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_MANAGE)

  const [rows, setRows] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LeaveType | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await leaveService.getLeaveTypes(true))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!canManage) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to manage leave types."
      />
    )
  }

  const save = async (values: LeaveTypeFormValues) => {
    setActionLoading(true)
    try {
      if (editing) {
        await leaveService.updateLeaveType(editing.id, values, user?.name ?? 'System')
        showSuccess('Leave type updated successfully.')
      } else {
        await leaveService.createLeaveType(values, user?.name ?? 'System')
        showSuccess('Leave type created successfully.')
      }
      setEditing(null)
      setCreating(false)
      await load()
    } catch (err) {
      showError(getLeaveErrorMessage(err, 'Failed to save leave type.'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Types"
        description="Configure leave categories, allocations, and policy rules."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Types' },
        ]}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Add Leave Type
          </Button>
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load leave types" message="Please try again." />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No leave types found."
          emptyDescription="Create leave types to start accepting requests."
          columnCount={8}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Annual Allocation</TableHead>
              <TableHead>Carry Forward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.code}</TableCell>
                <TableCell>{LEAVE_CATEGORY_LABELS[row.category]}</TableCell>
                <TableCell>{row.paid ? 'Yes' : 'No'}</TableCell>
                <TableCell>{row.annualAllocation}</TableCell>
                <TableCell>
                  {row.carryForwardAllowed ? `Yes (max ${row.maxCarryForwardDays})` : 'No'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions
                    onEdit={() => setEditing(row)}
                    moreItems={[
                      {
                        id: 'toggle',
                        label: row.status === 'active' ? 'Deactivate' : 'Activate',
                        onClick: async () => {
                          try {
                            if (row.status === 'active') {
                              await leaveService.deactivateLeaveType(
                                row.id,
                                user?.name ?? 'System',
                              )
                              showSuccess('Leave type deactivated.')
                            } else {
                              await leaveService.activateLeaveType(row.id, user?.name ?? 'System')
                              showSuccess('Leave type activated.')
                            }
                            await load()
                          } catch (err) {
                            showError(getLeaveErrorMessage(err, 'Failed to update status.'))
                          }
                        },
                      },
                      {
                        id: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: () => setPendingDelete(row),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        title={editing ? 'Edit leave type' : 'Add leave type'}
        size="lg"
      >
        <LeaveTypeForm
          initial={editing ?? undefined}
          isSubmitting={actionLoading}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmit={save}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Soft delete leave type?"
        description="The leave type will be deactivated and hidden from new applications."
        confirmLabel="Delete"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (!pendingDelete) return
          setActionLoading(true)
          try {
            await leaveService.deleteLeaveType(pendingDelete.id, user?.name ?? 'System')
            showSuccess('Leave type deleted.')
            setPendingDelete(null)
            await load()
          } catch (err) {
            showError(getLeaveErrorMessage(err, 'Failed to delete leave type.'))
          } finally {
            setActionLoading(false)
          }
        }}
      />
    </div>
  )
}
