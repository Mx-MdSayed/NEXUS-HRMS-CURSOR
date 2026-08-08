import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { REVISION_STATUS_LABELS } from '../constants'
import { employeeSalaryService } from '../services/employeeSalaryService'
import { salaryStructureService } from '../services/salaryStructureService'
import type { SalaryRevision, SalaryRevisionFilters, SalaryStructure } from '../types'
import { formatSalaryAmount } from '../utils/money'
import { getSalaryErrorMessage } from '../utils/errors'

type RevisionRow = SalaryRevision & { employeeName: string; employeeCode: string }

const defaultFilters: SalaryRevisionFilters = { search: '', status: '' }

export function SalaryRevisionsPage() {
  const { user, hasPermission } = useAuth()
  const canRevise = hasPermission(PERMISSIONS.SALARY_REVISE) || hasPermission(PERMISSIONS.SALARY_MANAGE)
  const canView = hasPermission(PERMISSIONS.SALARY_VIEW)

  const [rows, setRows] = useState<RevisionRow[]>([])
  const [filters, setFilters] = useState<SalaryRevisionFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([])
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [form, setForm] = useState({
    employeeId: '',
    structureId: '',
    effectiveFrom: '2026-09-01',
    reason: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await employeeSalaryService.getSalaryRevisions(filters))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void employeeService
      .getEmployees({ page: 1, pageSize: 100, sortBy: 'fullName' })
      .then((result) =>
        setEmployees(result.data.map((item) => ({ id: item.id, fullName: item.fullName }))),
      )
    void salaryStructureService.getStructures({ status: 'active' }).then(setStructures)
  }, [])

  if (!canView) {
    return <ErrorState title="Access denied" message="You cannot view salary revisions." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Revisions"
        description="Create revisions without overwriting historical salary snapshots."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Revisions' },
        ]}
        actions={
          canRevise ? (
            <Button onClick={() => setCreateOpen(true)}>New revision</Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search employee or reason…"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <Select
            label="Status"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as SalaryRevisionFilters['status'],
              }))
            }
            options={[
              { value: '', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'applied', label: 'Applied' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load revisions" message="Please try again." />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No salary revisions found."
          emptyDescription="Create a revision to change compensation while keeping history."
          columnCount={8}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Previous Gross</TableHead>
              <TableHead>New Gross</TableHead>
              <TableHead>New Annual CTC</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    to={`/salary/${row.employeeId}`}
                    className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                  >
                    {row.employeeName}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.previousMonthlyGross, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.newMonthlyGross, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.newAnnualCTC, row.currency)}
                </TableCell>
                <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                <TableCell>{row.reason}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={
                      row.status === 'applied'
                        ? 'approved'
                        : row.status === 'pending'
                          ? 'pending'
                          : 'cancelled'
                    }
                    label={REVISION_STATUS_LABELS[row.status]}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions
                    onView={() => undefined}
                    moreItems={
                      canRevise && row.status === 'pending'
                        ? [
                            {
                              id: 'apply',
                              label: 'Apply revision',
                              onClick: async () => {
                                try {
                                  await employeeSalaryService.applySalaryRevision(
                                    row.id,
                                    user?.name ?? 'System',
                                  )
                                  showSuccess('Salary revision applied.')
                                  await load()
                                } catch (err) {
                                  showError(getSalaryErrorMessage(err, 'Failed to apply revision.'))
                                }
                              },
                            },
                          ]
                        : []
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create salary revision"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={actionLoading}>
              Close
            </Button>
            <Button
              isLoading={actionLoading}
              onClick={async () => {
                setActionLoading(true)
                try {
                  await employeeSalaryService.createSalaryRevision(
                    form,
                    user?.name ?? 'System',
                    true,
                  )
                  showSuccess('Salary revision created successfully.')
                  setCreateOpen(false)
                  await load()
                } catch (err) {
                  showError(getSalaryErrorMessage(err, 'Failed to create revision.'))
                } finally {
                  setActionLoading(false)
                }
              }}
            >
              Apply revision
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Employee"
            value={form.employeeId}
            onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}
            options={[
              { value: '', label: 'Select employee' },
              ...employees.map((item) => ({ value: item.id, label: item.fullName })),
            ]}
          />
          <Select
            label="New salary structure"
            value={form.structureId}
            onChange={(event) => setForm((prev) => ({ ...prev, structureId: event.target.value }))}
            options={[
              { value: '', label: 'Select structure' },
              ...structures.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.code})`,
              })),
            ]}
          />
          <Input
            label="Effective from"
            type="date"
            value={form.effectiveFrom}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, effectiveFrom: event.target.value }))
            }
          />
          <Input
            label="Reason"
            required
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
