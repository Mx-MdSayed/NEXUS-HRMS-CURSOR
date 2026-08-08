import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Badge,
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
import { DESIGNATION_LEVEL_LABELS } from '../constants'
import { designationService } from '../services/designationService'
import type { DesignationListItem } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-surface-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-surface-900 dark:text-surface-50">{value}</div>
    </div>
  )
}

export function DesignationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const actorName = user?.name ?? 'System'

  const canEdit = hasPermission(PERMISSIONS.DESIGNATION_EDIT)
  const canDelete = hasPermission(PERMISSIONS.DESIGNATION_DELETE)
  const canManage = hasPermission(PERMISSIONS.DESIGNATION_MANAGE)

  const [designation, setDesignation] = useState<DesignationListItem | null>(null)
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
        designationService.getDesignationById(id),
        designationService.getDesignationEmployees(id),
      ])
      setDesignation(record)
      setEmployees(assigned)
    } catch {
      setHasError(true)
      setDesignation(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  if (isLoading) return <PageLoader label="Loading designation" />
  if (hasError || !designation) {
    return (
      <ErrorState
        title="Unable to load designation"
        message="Please try again."
        onRetry={() => void load()}
      />
    )
  }

  const isActive = designation.status === 'active'

  return (
    <div className="space-y-6">
      <PageHeader
        title={designation.name}
        description={`${designation.code} · ${designation.departmentName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Designations', href: '/designations' },
          { label: designation.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/designations/${designation.id}/edit`)}
              >
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
          <CardTitle>Designation details</CardTitle>
          <StatusBadge status={designation.status} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="Designation" value={designation.name} />
          <Info label="Code" value={designation.code} />
          <Info label="Department" value={designation.departmentName} />
          <Info
            label="Level"
            value={
              <Badge variant="neutral">{DESIGNATION_LEVEL_LABELS[designation.level]}</Badge>
            }
          />
          <Info label="Description" value={designation.description || '—'} />
          <Info label="Employee count" value={String(designation.employeeCount)} />
          <Info label="Created" value={formatDate(designation.createdAt)} />
          <Info label="Updated" value={formatDate(designation.updatedAt)} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-50">
          Employees with this Designation
        </h2>
        <AssignedEmployeesTable
          employees={employees}
          mode="designation"
          emptyTitle="No employees assigned to this designation."
        />
      </div>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title="Delete designation?"
        description="The designation will be soft-deleted and archived."
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          void designationService
            .deleteDesignation(designation.id, actorName)
            .then(() => {
              showSuccess('Designation deleted successfully.')
              navigate('/designations')
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to delete designation.')
              if (message.includes('assigned to employees')) setBlockedMessage(message)
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
        title={isActive ? 'Deactivate designation?' : 'Activate designation?'}
        description={
          isActive
            ? 'Inactive designations cannot be selected for new assignments.'
            : 'The designation will become available for assignments.'
        }
        confirmLabel={isActive ? 'Deactivate' : 'Activate'}
        tone={isActive ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          const action = isActive
            ? designationService.deactivateDesignation(designation.id, actorName)
            : designationService.activateDesignation(designation.id, actorName)
          void action
            .then(async () => {
              showSuccess(
                isActive
                  ? 'Designation deactivated successfully.'
                  : 'Designation activated successfully.',
              )
              setPendingStatus(false)
              await load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to update designation.')
              if (message.includes('assigned to employees')) setBlockedMessage(message)
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
