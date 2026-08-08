import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Badge,
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
import { DESIGNATION_LEVEL_LABELS, DESIGNATION_LEVEL_OPTIONS, ORG_STATUS_OPTIONS } from '../constants'
import { listActiveDepartmentOptions } from '../data/orgDb'
import { designationService } from '../services/designationService'
import type { DepartmentOption, DesignationFilters, DesignationListItem } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

const defaultFilters: DesignationFilters = {
  search: '',
  departmentId: '',
  level: '',
  status: '',
}

export function DesignationListPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const actorName = user?.name ?? 'System'

  const canCreate = hasPermission(PERMISSIONS.DESIGNATION_CREATE)
  const canEdit = hasPermission(PERMISSIONS.DESIGNATION_EDIT)
  const canDelete = hasPermission(PERMISSIONS.DESIGNATION_DELETE)
  const canManage = hasPermission(PERMISSIONS.DESIGNATION_MANAGE)

  const [rows, setRows] = useState<DesignationListItem[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [filters, setFilters] = useState<DesignationFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DesignationListItem | null>(null)
  const [pendingStatus, setPendingStatus] = useState<DesignationListItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [blockedDesignation, setBlockedDesignation] = useState<DesignationListItem | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await designationService.getDesignations(filters, page, DEFAULT_PAGE_SIZE)
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
    setDepartments(listActiveDepartmentOptions())
  }, [])

  const updateFilter = <K extends keyof DesignationFilters>(key: K, value: DesignationFilters[K]) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designations"
        description="Manage job titles, levels and organizational roles."
        breadcrumbs={[{ label: 'Home' }, { label: 'Designations' }]}
        actions={
          canCreate ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/designations/new')}
            >
              Add Designation
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder="Search name, code, department, level…"
        onReset={() => {
          setFilters(defaultFilters)
          setPage(1)
        }}
        filters={
          <>
            <Select
              label="Department"
              value={filters.departmentId ?? ''}
              onChange={(event) => updateFilter('departmentId', event.target.value)}
              options={[
                { value: '', label: 'All departments' },
                ...departments.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <Select
              label="Level"
              value={filters.level ?? ''}
              onChange={(event) =>
                updateFilter('level', event.target.value as DesignationFilters['level'])
              }
              options={[{ value: '', label: 'All levels' }, ...DESIGNATION_LEVEL_OPTIONS]}
            />
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                updateFilter('status', event.target.value as DesignationFilters['status'])
              }
              options={[{ value: '', label: 'All statuses' }, ...ORG_STATUS_OPTIONS]}
            />
          </>
        }
      />

      {hasError ? (
        <ErrorState
          title="Unable to load designations"
          message="Please try again."
          onRetry={() => void load()}
        />
      ) : (
        <>
          <DataTable
            isLoading={isLoading}
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No designations found"
            emptyDescription="Try adjusting search or filters, or add a new designation."
            emptyActionLabel={canCreate ? 'Add Designation' : undefined}
            onEmptyAction={canCreate ? () => navigate('/designations/new') : undefined}
            columnCount={7}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Designation</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((designation) => {
                const isActive = designation.status === 'active'
                return (
                  <TableRow key={designation.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-surface-900 hover:text-primary-700 dark:text-surface-50"
                        onClick={() => navigate(`/designations/${designation.id}`)}
                      >
                        {designation.name}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{designation.code}</TableCell>
                    <TableCell>{designation.departmentName}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">
                        {DESIGNATION_LEVEL_LABELS[designation.level]}
                      </Badge>
                    </TableCell>
                    <TableCell>{designation.employeeCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={designation.status} />
                    </TableCell>
                    <TableCell>
                      <TableActions
                        onView={() => navigate(`/designations/${designation.id}`)}
                        onEdit={
                          canEdit
                            ? () => navigate(`/designations/${designation.id}/edit`)
                            : undefined
                        }
                        moreItems={[
                          ...(canManage
                            ? [
                                {
                                  id: 'toggle',
                                  label: isActive ? 'Deactivate' : 'Activate',
                                  onClick: () => setPendingStatus(designation),
                                },
                              ]
                            : []),
                          ...(canDelete
                            ? [
                                {
                                  id: 'delete',
                                  label: 'Delete',
                                  danger: true,
                                  onClick: () => setPendingDelete(designation),
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
            <p className="text-sm text-surface-500">Showing {rows.length} of {total} designations</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete designation?"
        description="The designation will be soft-deleted and hidden from the default list."
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingDelete) return
          setActionLoading(true)
          void designationService
            .deleteDesignation(pendingDelete.id, actorName)
            .then(() => {
              showSuccess('Designation deleted successfully.')
              setPendingDelete(null)
              void load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to delete designation.')
              if (message.includes('assigned to employees')) {
                setBlockedDesignation(pendingDelete)
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
        title={
          pendingStatus?.status === 'active' ? 'Deactivate designation?' : 'Activate designation?'
        }
        description={
          pendingStatus?.status === 'active'
            ? 'Inactive designations cannot be selected for new employee assignments.'
            : 'The designation will become available for new assignments.'
        }
        confirmLabel={pendingStatus?.status === 'active' ? 'Deactivate' : 'Activate'}
        tone={pendingStatus?.status === 'active' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingStatus) return
          const isActive = pendingStatus.status === 'active'
          setActionLoading(true)
          const action = isActive
            ? designationService.deactivateDesignation(pendingStatus.id, actorName)
            : designationService.activateDesignation(pendingStatus.id, actorName)
          void action
            .then(() => {
              showSuccess(
                isActive
                  ? 'Designation deactivated successfully.'
                  : 'Designation activated successfully.',
              )
              setPendingStatus(null)
              void load()
            })
            .catch((error) => {
              const message = getOrgErrorMessage(error, 'Unable to update designation.')
              if (message.includes('assigned to employees')) {
                setBlockedDesignation(pendingStatus)
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
          setBlockedDesignation(null)
        }}
        title="Action blocked"
        description={blockedMessage ?? undefined}
        confirmLabel="View Employees"
        tone="primary"
        onConfirm={() => {
          if (blockedDesignation) navigate(`/designations/${blockedDesignation.id}`)
          setBlockedMessage(null)
          setBlockedDesignation(null)
        }}
      />
    </div>
  )
}
