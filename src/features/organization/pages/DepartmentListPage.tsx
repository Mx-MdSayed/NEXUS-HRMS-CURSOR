import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { ORG_STATUS_OPTIONS } from '../constants'
import { departmentService } from '../services/departmentService'
import type { DepartmentFilters, DepartmentListItem } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

const defaultFilters: DepartmentFilters = {
  search: '',
  status: '',
  location: '',
}

export function DepartmentListPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const actorName = user?.name ?? 'System'

  const canCreate = hasPermission(PERMISSIONS.DEPARTMENT_CREATE)
  const canEdit = hasPermission(PERMISSIONS.DEPARTMENT_EDIT)
  const canDelete = hasPermission(PERMISSIONS.DEPARTMENT_DELETE)
  const canManage = hasPermission(PERMISSIONS.DEPARTMENT_MANAGE)

  const [rows, setRows] = useState<DepartmentListItem[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [filters, setFilters] = useState<DepartmentFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DepartmentListItem | null>(null)
  const [pendingStatus, setPendingStatus] = useState<DepartmentListItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [blockedDepartment, setBlockedDepartment] = useState<DepartmentListItem | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await departmentService.getDepartments(filters, page, DEFAULT_PAGE_SIZE)
      setRows(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
      if (result.page !== page) setPage(result.page)
    } catch {
      setHasError(true)
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void departmentService.getLocations().then(setLocations)
  }, [])

  const updateFilter = <K extends keyof DepartmentFilters>(key: K, value: DepartmentFilters[K]) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organizational departments and department structure."
        breadcrumbs={[{ label: 'Home' }, { label: 'Departments' }]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/departments/new')}>
              Add Department
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder="Search name, code, head, location…"
        onReset={() => {
          setFilters(defaultFilters)
          setPage(1)
        }}
        filters={
          <>
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                updateFilter('status', event.target.value as DepartmentFilters['status'])
              }
              options={[{ value: '', label: 'All statuses' }, ...ORG_STATUS_OPTIONS]}
            />
            <Select
              label="Location"
              value={filters.location ?? ''}
              onChange={(event) => updateFilter('location', event.target.value)}
              options={[
                { value: '', label: 'All locations' },
                ...locations.map((location) => ({ value: location, label: location })),
              ]}
            />
          </>
        }
      />

      {hasError ? (
        <ErrorState
          title="Unable to load departments"
          message="Please try again."
          onRetry={() => void load()}
        />
      ) : (
        <>
          <DataTable
            isLoading={isLoading}
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No departments found"
            emptyDescription="Try adjusting search or filters, or add a new department."
            emptyActionLabel={canCreate ? 'Add Department' : undefined}
            onEmptyAction={canCreate ? () => navigate('/departments/new') : undefined}
            columnCount={7}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((department) => {
                const isActive = department.status === 'active'
                return (
                  <TableRow key={department.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-surface-900 hover:text-primary-700 dark:text-surface-50"
                        onClick={() => navigate(`/departments/${department.id}`)}
                      >
                        {department.name}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{department.code}</TableCell>
                    <TableCell>{department.headEmployeeName ?? '—'}</TableCell>
                    <TableCell>{department.location ?? '—'}</TableCell>
                    <TableCell>{department.employeeCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={department.status} />
                    </TableCell>
                    <TableCell>
                      <TableActions
                        onView={() => navigate(`/departments/${department.id}`)}
                        onEdit={
                          canEdit ? () => navigate(`/departments/${department.id}/edit`) : undefined
                        }
                        moreItems={[
                          ...(canManage
                            ? [
                                {
                                  id: 'toggle',
                                  label: isActive ? 'Deactivate' : 'Activate',
                                  onClick: () => setPendingStatus(department),
                                },
                              ]
                            : []),
                          ...(canDelete
                            ? [
                                {
                                  id: 'delete',
                                  label: 'Delete',
                                  danger: true,
                                  onClick: () => setPendingDelete(department),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </DataTable>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-surface-500">Showing {rows.length} of {total} departments</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete department?"
        description="The department will be soft-deleted and hidden from the default list."
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingDelete) return
          setActionLoading(true)
          void departmentService
            .deleteDepartment(pendingDelete.id, actorName)
            .then(() => {
              showSuccess('Department deleted successfully.')
              setPendingDelete(null)
              void load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to delete department.')
              if (message.includes('active employees')) {
                setBlockedDepartment(pendingDelete)
                setBlockedMessage(message)
                setPendingDelete(null)
              } else {
                showError(message)
              }
            })
            .finally(() => setActionLoading(false))
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        title={pendingStatus?.status === 'active' ? 'Deactivate department?' : 'Activate department?'}
        description={
          pendingStatus?.status === 'active'
            ? 'Inactive departments cannot be selected for new employees.'
            : 'The department will become available for new employee assignments.'
        }
        confirmLabel={pendingStatus?.status === 'active' ? 'Deactivate' : 'Activate'}
        tone={pendingStatus?.status === 'active' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingStatus) return
          const isActive = pendingStatus.status === 'active'
          setActionLoading(true)
          const action = isActive
            ? departmentService.deactivateDepartment(pendingStatus.id, actorName)
            : departmentService.activateDepartment(pendingStatus.id, actorName)
          void action
            .then(() => {
              showSuccess(
                isActive
                  ? 'Department deactivated successfully.'
                  : 'Department activated successfully.',
              )
              setPendingStatus(null)
              void load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to update department.')
              if (message.includes('active employees')) {
                setBlockedDepartment(pendingStatus)
                setBlockedMessage(message)
                setPendingStatus(null)
              } else {
                showError(message)
              }
            })
            .finally(() => setActionLoading(false))
        }}
      />

      <ConfirmDialog
        open={Boolean(blockedMessage)}
        onClose={() => {
          setBlockedMessage(null)
          setBlockedDepartment(null)
        }}
        title="Action blocked"
        description={blockedMessage ?? undefined}
        confirmLabel="View Employees"
        tone="primary"
        onConfirm={() => {
          if (blockedDepartment) navigate(`/departments/${blockedDepartment.id}`)
          setBlockedMessage(null)
          setBlockedDepartment(null)
        }}
      />
    </div>
  )
}
