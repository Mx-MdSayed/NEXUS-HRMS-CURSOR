import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flexRender, type ColumnVisibilityState, type SortingState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
} from '@tanstack/react-table/legacy'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Plus } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DateRangeInput,
  Dropdown,
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
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { EMPLOYMENT_STATUS_OPTIONS, EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_OPTIONS } from '../constants'
import { employeeService, isProtectedSuperAdminEmployee } from '../services/employeeService'
import type { EmployeeFilters, EmployeeListItem } from '../types'
import { getEmployeeErrorMessage } from '../utils/errors'

const columnHelper = legacyCreateColumnHelper<EmployeeListItem>()

type VisibilityState = ColumnVisibilityState

const defaultFilters: EmployeeFilters = {
  search: '',
  departmentId: '',
  designationId: '',
  employmentType: '',
  employmentStatus: '',
  joiningFrom: '',
  joiningTo: '',
}

export function EmployeeListPage() {
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const actorName = user?.name ?? 'System'
  const actorRole = user?.role

  const canCreate = hasPermission(PERMISSIONS.EMPLOYEE_CREATE)
  const canEdit = hasPermission(PERMISSIONS.EMPLOYEE_EDIT)
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEE_DELETE)
  const canManage = hasPermission(PERMISSIONS.EMPLOYEE_MANAGE)
  const isHrAdmin = hasRole(ROLES.HR_ADMIN)

  const [rows, setRows] = useState<EmployeeListItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState<EmployeeFilters>(defaultFilters)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fullName', desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [designations, setDesignations] = useState<Array<{ id: string; name: string }>>([])
  const [pendingDelete, setPendingDelete] = useState<EmployeeListItem | null>(null)
  const [pendingStatus, setPendingStatus] = useState<EmployeeListItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    void employeeService.getDepartments().then((items) =>
      setDepartments(items.map((item) => ({ id: item.id, name: item.name }))),
    )
  }, [])

  useEffect(() => {
    void employeeService.getDesignations(filters.departmentId || undefined).then((items) =>
      setDesignations(items.map((item) => ({ id: item.id, name: item.name }))),
    )
  }, [filters.departmentId])

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const sort = sorting[0]
      const result = await employeeService.getEmployees({
        filters,
        page,
        pageSize,
        sortBy: (sort?.id as keyof EmployeeListItem | undefined) ?? 'fullName',
        sortDirection: sort?.desc ? 'desc' : 'asc',
      })
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
  }, [filters, page, pageSize, sorting])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Employee',
        cell: (info) => {
          const employee = info.row.original
          return (
            <div className="flex min-w-[12rem] items-center gap-3">
              <Avatar name={employee.fullName} src={employee.profilePhoto} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-surface-900 dark:text-surface-50">
                  {employee.fullName}
                </p>
                <p className="truncate text-xs text-surface-500">{employee.email}</p>
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('employeeCode', {
        header: 'Employee ID',
        cell: (info) => (
          <span className="font-mono text-xs text-surface-600 dark:text-surface-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('departmentName', { header: 'Department' }),
      columnHelper.accessor('designationName', { header: 'Designation' }),
      columnHelper.accessor('employmentType', {
        header: 'Employment Type',
        cell: (info) => (
          <Badge variant="neutral">{EMPLOYMENT_TYPE_LABELS[info.getValue()]}</Badge>
        ),
      }),
      columnHelper.accessor('joiningDate', {
        header: 'Joining Date',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('employmentStatus', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
          const employee = row.original
          const isActive = employee.employmentStatus === 'active'
          const protectedTarget = isHrAdmin && isProtectedSuperAdminEmployee(employee)
          const moreItems = [
            ...(canManage && !protectedTarget
              ? [
                  {
                    id: 'toggle-status',
                    label: isActive ? 'Deactivate' : 'Activate',
                    onClick: () => setPendingStatus(employee),
                  },
                ]
              : []),
            ...(canDelete && !protectedTarget
              ? [
                  {
                    id: 'delete',
                    label: 'Delete',
                    danger: true,
                    onClick: () => setPendingDelete(employee),
                  },
                ]
              : []),
          ]

          return (
            <TableActions
              onView={() => navigate(`/employees/${employee.id}`)}
              onEdit={
                canEdit && !protectedTarget
                  ? () => navigate(`/employees/${employee.id}/edit`)
                  : undefined
              }
              moreItems={moreItems}
            />
          )
        },
      }),
    ],
    [canDelete, canEdit, canManage, isHrAdmin, navigate],
  )

  const table = useLegacyTable({
    data: rows,
    columns: columns as never,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      setPage(1)
      setSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater))
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  })

  const resetFilters = () => {
    setFilters(defaultFilters)
    setPage(1)
  }

  const updateFilter = <K extends keyof EmployeeFilters>(key: K, value: EmployeeFilters[K]) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Manage employee records, employment details and HR information."
        breadcrumbs={[{ label: 'Home' }, { label: 'Employees' }]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/employees/new')}>
              Add Employee
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder="Search name, ID, email, phone…"
        onReset={resetFilters}
        filters={
          <>
            <Select
              label="Department"
              aria-label="Department"
              value={filters.departmentId ?? ''}
              onChange={(event) => {
                setPage(1)
                setFilters((prev) => ({
                  ...prev,
                  departmentId: event.target.value,
                  designationId: '',
                }))
              }}
              options={[
                { value: '', label: 'All departments' },
                ...departments.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <Select
              label="Designation"
              aria-label="Designation"
              value={filters.designationId ?? ''}
              onChange={(event) => updateFilter('designationId', event.target.value)}
              options={[
                { value: '', label: 'All designations' },
                ...designations.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <Select
              label="Employment Type"
              aria-label="Employment Type"
              value={filters.employmentType ?? ''}
              onChange={(event) =>
                updateFilter('employmentType', event.target.value as EmployeeFilters['employmentType'])
              }
              options={[
                { value: '', label: 'All employment types' },
                ...EMPLOYMENT_TYPE_OPTIONS,
              ]}
            />
            <Select
              label="Employment Status"
              aria-label="Employment Status"
              value={filters.employmentStatus ?? ''}
              onChange={(event) =>
                updateFilter(
                  'employmentStatus',
                  event.target.value as EmployeeFilters['employmentStatus'],
                )
              }
              options={[
                { value: '', label: 'All statuses' },
                ...EMPLOYMENT_STATUS_OPTIONS,
              ]}
            />
            <DateRangeInput
              label="Joining Date"
              value={{
                from: filters.joiningFrom ?? '',
                to: filters.joiningTo ?? '',
              }}
              onValueChange={(range) => {
                setPage(1)
                setFilters((prev) => ({
                  ...prev,
                  joiningFrom: range.from,
                  joiningTo: range.to,
                }))
              }}
            />
          </>
        }
        actions={
          <Dropdown
            align="right"
            trigger={
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-300 px-3 text-xs font-medium text-surface-800 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-100 dark:hover:bg-surface-800">
                <Columns3 className="h-4 w-4" />
                Columns
              </span>
            }
            items={table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => ({
                id: column.id,
                label: `${column.getIsVisible() ? '✓ ' : ''}${column.id}`,
                onClick: () => column.toggleVisibility(!column.getIsVisible()),
              }))}
          />
        }
      />

      {hasError ? (
        <ErrorState
          title="Unable to load employees"
          message="Please try again."
          onRetry={() => {
            void load()
          }}
        />
      ) : (
        <>
          <DataTable
            isLoading={isLoading}
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No employees found"
            emptyDescription="Try adjusting search or filters, or add a new employee."
            emptyActionLabel={canCreate ? 'Add Employee' : undefined}
            onEmptyAction={canCreate ? () => navigate('/employees/new') : undefined}
            columnCount={9}
            loadingRows={8}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 uppercase tracking-wide"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </DataTable>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Showing {rows.length} of {total} employees
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete employee?"
        description={
          pendingDelete
            ? `${pendingDelete.fullName} will be soft-deleted and hidden from the default employee list. Historical records are preserved.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingDelete) return
          setActionLoading(true)
          void employeeService
            .deleteEmployee(pendingDelete.id, actorName, actorRole)
            .then(() => {
              showSuccess('Employee deleted successfully.')
              setPendingDelete(null)
              void load()
            })
            .catch((error) => showError(getEmployeeErrorMessage(error, 'Unable to delete employee.')))
            .finally(() => setActionLoading(false))
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        title={
          pendingStatus?.employmentStatus === 'active'
            ? 'Deactivate employee?'
            : 'Activate employee?'
        }
        description={
          pendingStatus
            ? pendingStatus.employmentStatus === 'active'
              ? `${pendingStatus.fullName} will be marked inactive. Historical records remain.`
              : `${pendingStatus.fullName} will be restored to active status.`
            : undefined
        }
        confirmLabel={pendingStatus?.employmentStatus === 'active' ? 'Deactivate' : 'Activate'}
        tone={pendingStatus?.employmentStatus === 'active' ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          if (!pendingStatus) return
          const isActive = pendingStatus.employmentStatus === 'active'
          setActionLoading(true)
          const action = isActive
            ? employeeService.deactivateEmployee(pendingStatus.id, actorName, actorRole)
            : employeeService.activateEmployee(pendingStatus.id, actorName, actorRole)
          void action
            .then(() => {
              showSuccess(
                isActive
                  ? 'Employee deactivated successfully.'
                  : 'Employee activated successfully.',
              )
              setPendingStatus(null)
              void load()
            })
            .catch((error) => showError(getEmployeeErrorMessage(error, 'Unable to update employee.')))
            .finally(() => setActionLoading(false))
        }}
      />

    </div>
  )
}
