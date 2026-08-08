import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import type { EmployeeListItem } from '@/features/employees/types'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { AssignedEmployeesTable } from '../components/AssignedEmployeesTable'
import { departmentService } from '../services/departmentService'
import type { DepartmentListItem } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-surface-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-surface-900 dark:text-surface-50">{value}</p>
    </div>
  )
}

export function DepartmentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const actorName = user?.name ?? 'System'

  const canEdit = hasPermission(PERMISSIONS.DEPARTMENT_EDIT)
  const canDelete = hasPermission(PERMISSIONS.DEPARTMENT_DELETE)
  const canManage = hasPermission(PERMISSIONS.DEPARTMENT_MANAGE)

  const [department, setDepartment] = useState<DepartmentListItem | null>(null)
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const [record, assigned] = await Promise.all([
        departmentService.getDepartmentById(id),
        departmentService.getDepartmentEmployees(id),
      ])
      setDepartment(record)
      setEmployees(assigned)
    } catch {
      setHasError(true)
      setDepartment(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  if (isLoading) return <PageLoader label="Loading department" />
  if (hasError || !department) {
    return (
      <ErrorState
        title="Unable to load department"
        message="Please try again."
        onRetry={() => void load()}
      />
    )
  }

  const isActive = department.status === 'active'

  return (
    <div className="space-y-6">
      <PageHeader
        title={department.name}
        description={`${department.code} · ${department.location || 'No location'}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Departments', href: '/departments' },
          { label: department.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button variant="outline" onClick={() => navigate(`/departments/${department.id}/edit`)}>
                Edit
              </Button>
            ) : null}
            {canManage ? (
              <Button variant="secondary" onClick={() => setPendingStatus(true)}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="danger" onClick={() => setPendingDelete(true)}>
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Department details</CardTitle>
          <StatusBadge status={department.status} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="Department Name" value={department.name} />
          <Info label="Code" value={department.code} />
          <Info label="Description" value={department.description || '—'} />
          <Info label="Department Head" value={department.headEmployeeName || '—'} />
          <Info label="Location" value={department.location || '—'} />
          <Info label="Email" value={department.email || '—'} />
          <Info label="Phone" value={department.phone || '—'} />
          <Info label="Employees" value={String(department.employeeCount)} />
          <Info label="Created" value={formatDate(department.createdAt)} />
          <Info label="Updated" value={formatDate(department.updatedAt)} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50">
          Employees in this Department
        </h2>
        <AssignedEmployeesTable
          employees={employees}
          mode="department"
          emptyTitle="No employees assigned to this department."
        />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title="Delete department?"
        description="The department will be soft-deleted and archived."
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          void departmentService
            .deleteDepartment(department.id, actorName)
            .then(() => {
              showSuccess('Department deleted successfully.')
              navigate('/departments')
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to delete department.')
              if (message.includes('active employees')) setBlockedMessage(message)
              else showError(message)
            })
            .finally(() => {
              setActionLoading(false)
              setPendingDelete(false)
            })
        }}
      />

      <ConfirmDialog
        open={pendingStatus}
        onClose={() => setPendingStatus(false)}
        title={isActive ? 'Deactivate department?' : 'Activate department?'}
        description={
          isActive
            ? 'Inactive departments cannot be selected for new employees.'
            : 'The department will become available for assignments.'
        }
        confirmLabel={isActive ? 'Deactivate' : 'Activate'}
        tone={isActive ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          const action = isActive
            ? departmentService.deactivateDepartment(department.id, actorName)
            : departmentService.activateDepartment(department.id, actorName)
          void action
            .then(async () => {
              showSuccess(
                isActive
                  ? 'Department deactivated successfully.'
                  : 'Department activated successfully.',
              )
              setPendingStatus(false)
              await load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to update department.')
              if (message.includes('active employees')) setBlockedMessage(message)
              else showError(message)
            })
            .finally(() => setActionLoading(false))
        }}
      />

      <ConfirmDialog
        open={Boolean(blockedMessage)}
        onClose={() => setBlockedMessage(null)}
        title="Action blocked"
        description={blockedMessage ?? undefined}
        confirmLabel="View Employees"
        tone="primary"
        onConfirm={() => setBlockedMessage(null)}
      />
    </div>
  )
}
