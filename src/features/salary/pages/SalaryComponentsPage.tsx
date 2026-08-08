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
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import {
  CALCULATION_METHOD_LABELS,
  SALARY_COMPONENT_CATEGORY_LABELS,
  SALARY_COMPONENT_CATEGORY_OPTIONS,
} from '../constants'
import { salaryComponentService } from '../services/salaryComponentService'
import type { SalaryComponent, SalaryComponentFilters } from '../types'
import { getSalaryErrorMessage } from '../utils/errors'

const defaultFilters: SalaryComponentFilters = { search: '', category: '', status: '' }

export function SalaryComponentsPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.SALARY_COMPONENT_MANAGE) || hasPermission(PERMISSIONS.SALARY_MANAGE)

  const [rows, setRows] = useState<SalaryComponent[]>([])
  const [filters, setFilters] = useState<SalaryComponentFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SalaryComponent | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      setRows(await salaryComponentService.getComponents(filters))
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  if (!canManage) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to manage salary components."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Components"
        description="Configure earnings, deductions, and employer contributions."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Components' },
        ]}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/salary/components/new')}
          >
            Add component
          </Button>
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search name or code…"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <>
            <Select
              label="Category"
              value={filters.category ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  category: event.target.value as SalaryComponentFilters['category'],
                }))
              }
              options={[
                { value: '', label: 'All categories' },
                ...SALARY_COMPONENT_CATEGORY_OPTIONS,
              ]}
            />
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as SalaryComponentFilters['status'],
                }))
              }
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </>
        }
      />

      {hasError ? (
        <ErrorState title="Failed to load components" message="Please try again." />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No salary components found."
          emptyDescription="Create components to build salary structures."
          columnCount={8}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>Employee / Employer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.code}</TableCell>
                <TableCell>{SALARY_COMPONENT_CATEGORY_LABELS[row.category]}</TableCell>
                <TableCell>{CALCULATION_METHOD_LABELS[row.calculationMethod]}</TableCell>
                <TableCell>{row.taxable ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  {row.employeeContribution ? 'Emp' : '—'} /{' '}
                  {row.employerContribution ? 'Er' : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions
                    onEdit={() => navigate(`/salary/components/${row.id}/edit`)}
                    moreItems={[
                      {
                        id: 'toggle',
                        label: row.status === 'active' ? 'Deactivate' : 'Activate',
                        onClick: async () => {
                          try {
                            if (row.status === 'active') {
                              await salaryComponentService.deactivateComponent(
                                row.id,
                                user?.name ?? 'System',
                              )
                              showSuccess('Component deactivated.')
                            } else {
                              await salaryComponentService.activateComponent(
                                row.id,
                                user?.name ?? 'System',
                              )
                              showSuccess('Component activated.')
                            }
                            await load()
                          } catch (err) {
                            showError(getSalaryErrorMessage(err, 'Failed to update status.'))
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Soft delete component?"
        description="The component will be deactivated and hidden from new structures."
        confirmLabel="Delete"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (!pendingDelete) return
          setActionLoading(true)
          try {
            await salaryComponentService.deleteComponent(
              pendingDelete.id,
              user?.name ?? 'System',
            )
            showSuccess('Salary component deleted.')
            setPendingDelete(null)
            await load()
          } catch (err) {
            showError(getSalaryErrorMessage(err, 'Failed to delete component.'))
          } finally {
            setActionLoading(false)
          }
        }}
      />
    </div>
  )
}
