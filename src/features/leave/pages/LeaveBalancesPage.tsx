import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui'
import { DEFAULT_PAGE_SIZE } from '@/constants/app'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees'
import { listActiveDepartmentOptions } from '@/features/organization/data/orgDb'
import { showError, showSuccess } from '@/utils/toast'
import { LEAVE_DEMO_YEAR } from '../constants'
import { leaveService } from '../services/leaveService'
import type { LeaveBalanceFilters, LeaveBalanceListItem, LeaveType } from '../types'
import { getLeaveErrorMessage } from '../utils/errors'

const defaultFilters: LeaveBalanceFilters = {
  year: LEAVE_DEMO_YEAR,
  search: '',
  employeeId: '',
  departmentId: '',
  leaveTypeId: '',
}

export function LeaveBalancesPage() {
  const { user, hasPermission } = useAuth()
  const canView =
    hasPermission(PERMISSIONS.LEAVE_BALANCE_MANAGE) || hasPermission(PERMISSIONS.LEAVE_MANAGE)
  const canAdjust = hasPermission(PERMISSIONS.LEAVE_BALANCE_MANAGE)

  const [rows, setRows] = useState<LeaveBalanceListItem[]>([])
  const [types, setTypes] = useState<LeaveType[]>([])
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([])
  const [filters, setFilters] = useState<LeaveBalanceFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [adjustTarget, setAdjustTarget] = useState<LeaveBalanceListItem | null>(null)
  const [adjustment, setAdjustment] = useState('0')
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await leaveService.getLeaveBalances(filters, page, DEFAULT_PAGE_SIZE)
      setRows(result.data)
      setTotalPages(result.totalPages)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void leaveService.getLeaveTypes(true).then(setTypes)
    void employeeService
      .getEmployees({ page: 1, pageSize: 100, sortBy: 'fullName' })
      .then((result) =>
        setEmployees(result.data.map((item) => ({ id: item.id, fullName: item.fullName }))),
      )
  }, [])

  if (!canView) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to view leave balances."
      />
    )
  }

  const departments = listActiveDepartmentOptions()

  const updateFilter = <K extends keyof LeaveBalanceFilters>(
    key: K,
    value: LeaveBalanceFilters[K],
  ) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Balances"
        description="Yearly allocations, usage, and available balances by employee."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Leave', href: '/leave' },
          { label: 'Balances' },
        ]}
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder="Search employee or leave type…"
        onReset={() => {
          setFilters(defaultFilters)
          setPage(1)
        }}
        filters={
          <>
            <Select
              label="Year"
              value={String(filters.year ?? LEAVE_DEMO_YEAR)}
              onChange={(event) => updateFilter('year', Number(event.target.value))}
              options={[
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2027', label: '2027' },
              ]}
            />
            <Select
              label="Employee"
              value={filters.employeeId ?? ''}
              onChange={(event) => updateFilter('employeeId', event.target.value)}
              options={[
                { value: '', label: 'All employees' },
                ...employees.map((emp) => ({ value: emp.id, label: emp.fullName })),
              ]}
            />
            <Select
              label="Department"
              value={filters.departmentId ?? ''}
              onChange={(event) => updateFilter('departmentId', event.target.value)}
              options={[
                { value: '', label: 'All departments' },
                ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
              ]}
            />
            <Select
              label="Leave type"
              value={filters.leaveTypeId ?? ''}
              onChange={(event) => updateFilter('leaveTypeId', event.target.value)}
              options={[
                { value: '', label: 'All types' },
                ...types.map((type) => ({ value: type.id, label: type.name })),
              ]}
            />
          </>
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load balances" message="Please try again." />
      ) : (
        <>
          <DataTable
            isLoading={isLoading}
            isEmpty={!isLoading && rows.length === 0}
            emptyTitle="No leave balance available."
            emptyDescription="Balances appear after yearly allocation."
            columnCount={8}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Carry Forward</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Available</TableHead>
                {canAdjust ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.employeeName}</div>
                    <div className="text-xs text-surface-500">{row.employeeCode}</div>
                  </TableCell>
                  <TableCell>
                    {row.leaveTypeName} ({row.leaveTypeCode})
                  </TableCell>
                  <TableCell>{row.allocated}</TableCell>
                  <TableCell>{row.carryForward}</TableCell>
                  <TableCell>{row.used}</TableCell>
                  <TableCell>{row.pending}</TableCell>
                  <TableCell className="font-semibold">{row.available}</TableCell>
                  {canAdjust ? (
                    <TableCell className="text-right">
                      <TableActions
                        moreItems={[
                          {
                            id: 'adjust',
                            label: 'Adjust balance',
                            onClick: () => {
                              setAdjustTarget(row)
                              setAdjustment('0')
                              setReason('')
                            },
                          },
                        ]}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={Boolean(adjustTarget)}
        onClose={() => setAdjustTarget(null)}
        title="Adjust leave balance"
        description={
          adjustTarget
            ? `${adjustTarget.employeeName} · ${adjustTarget.leaveTypeName} · Available ${adjustTarget.available}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustTarget(null)} disabled={actionLoading}>
              Close
            </Button>
            <Button
              isLoading={actionLoading}
              onClick={async () => {
                if (!adjustTarget) return
                setActionLoading(true)
                try {
                  await leaveService.adjustLeaveBalance({
                    employeeId: adjustTarget.employeeId,
                    leaveTypeId: adjustTarget.leaveTypeId,
                    year: adjustTarget.year,
                    adjustment: Number(adjustment) || 0,
                    reason,
                    actorName: user?.name ?? 'System',
                  })
                  showSuccess('Leave balance updated.')
                  setAdjustTarget(null)
                  await load()
                } catch (err) {
                  showError(getLeaveErrorMessage(err, 'Failed to adjust balance.'))
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              Save adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Adjustment (+/− days)"
            type="number"
            step={0.5}
            value={adjustment}
            onChange={(event) => setAdjustment(event.target.value)}
          />
          <Textarea
            label="Reason"
            required
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
