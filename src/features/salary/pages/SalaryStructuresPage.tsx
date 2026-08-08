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
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { SALARY_CURRENCY_OPTIONS } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { salaryStructureService } from '../services/salaryStructureService'
import type { SalaryStructure, SalaryStructureFilters } from '../types'
import { formatSalaryAmount } from '../utils/money'
import { getSalaryErrorMessage } from '../utils/errors'

const defaultFilters: SalaryStructureFilters = { search: '', status: '', currency: '' }

export function SalaryStructuresPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SALARY_MANAGE) || hasPermission(PERMISSIONS.SALARY_CREATE)
  const canEdit = hasPermission(PERMISSIONS.SALARY_EDIT) || canManage
  const canDelete = hasPermission(PERMISSIONS.SALARY_DELETE) || canManage
  const canView = hasPermission(PERMISSIONS.SALARY_VIEW)

  const [rows, setRows] = useState<SalaryStructure[]>([])
  const [filters, setFilters] = useState<SalaryStructureFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SalaryStructure | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await salaryStructureService.getStructures(filters))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  if (!canView) {
    return <ErrorState title="Access denied" message="You cannot view salary structures." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Structures"
        description="Reusable compensation templates with live CTC calculation."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Structures' },
        ]}
        actions={
          canManage ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/salary/structures/new')}
            >
              New structure
            </Button>
          ) : null
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search structure…"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <>
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as SalaryStructureFilters['status'],
                }))
              }
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <Select
              label="Currency"
              value={filters.currency ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  currency: event.target.value as SalaryStructureFilters['currency'],
                }))
              }
              options={[{ value: '', label: 'All currencies' }, ...SALARY_CURRENCY_OPTIONS]}
            />
          </>
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load structures" message="Please try again." />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No salary structures found."
          emptyDescription="Create a structure to assign compensation packages."
          columnCount={9}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Structure</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Monthly Gross</TableHead>
              <TableHead>Annual Gross</TableHead>
              <TableHead>Monthly CTC</TableHead>
              <TableHead>Annual CTC</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.code}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.monthlyGross, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.annualGross, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.monthlyCTC, row.currency)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatSalaryAmount(row.annualCTC, row.currency)}
                </TableCell>
                <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={row.status === 'draft' ? 'pending' : row.status}
                    label={row.status}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions
                    onView={() => navigate(`/salary/structures/${row.id}`)}
                    onEdit={
                      canEdit ? () => navigate(`/salary/structures/${row.id}/edit`) : undefined
                    }
                    moreItems={[
                      ...(canManage
                        ? [
                            {
                              id: 'duplicate',
                              label: 'Duplicate',
                              onClick: async () => {
                                try {
                                  const copy = await salaryStructureService.duplicateStructure(
                                    row.id,
                                    user?.name ?? 'System',
                                  )
                                  showSuccess('Salary structure duplicated successfully.')
                                  navigate(`/salary/structures/${copy.id}/edit`)
                                } catch (err) {
                                  showError(getSalaryErrorMessage(err, 'Duplicate failed.'))
                                }
                              },
                            },
                            {
                              id: 'toggle',
                              label: row.status === 'active' ? 'Deactivate' : 'Activate',
                              onClick: async () => {
                                try {
                                  if (row.status === 'active') {
                                    await salaryStructureService.deactivateStructure(
                                      row.id,
                                      user?.name ?? 'System',
                                    )
                                  } else {
                                    await salaryStructureService.activateStructure(
                                      row.id,
                                      user?.name ?? 'System',
                                    )
                                  }
                                  showSuccess('Structure status updated.')
                                  await load()
                                } catch (err) {
                                  showError(getSalaryErrorMessage(err, 'Failed to update status.'))
                                }
                              },
                            },
                          ]
                        : []),
                      ...(canDelete
                        ? [
                            {
                              id: 'delete',
                              label: 'Delete',
                              danger: true,
                              onClick: () => setPendingDelete(row),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Soft delete structure?"
        description="Existing employee salary snapshots are not deleted."
        confirmLabel="Delete"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (!pendingDelete) return
          setActionLoading(true)
          try {
            await salaryStructureService.deleteStructure(
              pendingDelete.id,
              user?.name ?? 'System',
            )
            showSuccess('Salary structure deleted.')
            setPendingDelete(null)
            await load()
          } catch (err) {
            showError(getSalaryErrorMessage(err, 'Failed to delete structure.'))
          } finally {
            setActionLoading(false)
          }
        }}
      />
    </div>
  )
}
