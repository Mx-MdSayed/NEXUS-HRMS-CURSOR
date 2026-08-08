import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  PageLoader,
  Select,
} from '@/components/ui'
import { SALARY_CURRENCY_OPTIONS } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService, type DepartmentOption, type EmployeeListItem } from '@/features/employees'
import { showError, showSuccess } from '@/utils/toast'
import { PayrollValidationPanel } from '../components/PayrollValidationPanel'
import { DEMO_PAYROLL_MONTH, DEMO_PAYROLL_YEAR } from '../constants'
import { PayrollServiceError } from '../services/errors'
import { payrollService } from '../services/payrollService'
import type { PayrollRunFormValues, PayrollValidationIssue } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'

const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const month = index + 1
  return {
    value: String(month),
    label: new Date(DEMO_PAYROLL_YEAR, index, 1).toLocaleString('en', { month: 'long' }),
  }
})

interface ValidationState {
  ready: number
  warnings: PayrollValidationIssue[]
  errors: PayrollValidationIssue[]
}

const defaultValues: PayrollRunFormValues = {
  month: DEMO_PAYROLL_MONTH,
  year: DEMO_PAYROLL_YEAR,
  name: 'August 2026 Payroll',
  currency: 'INR',
  selectionMode: 'all',
  departmentId: '',
  selectedEmployeeIds: [],
}

export function PayrollRunNewPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canCreate = hasPermission(PERMISSIONS.PAYROLL_CREATE) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const actor = user?.name ?? 'System'

  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationState | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayrollRunFormValues>({ defaultValues })

  const selectionMode = watch('selectionMode')
  const selectedEmployeeIds = watch('selectedEmployeeIds') ?? []

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const [departmentRows, employeePage] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getEmployees({
            filters: { employmentStatus: 'active' },
            page: 1,
            pageSize: 500,
            sortBy: 'fullName',
          }),
        ])
        if (cancelled) return
        setDepartments(departmentRows)
        setEmployees(employeePage.data)
      } catch (error) {
        if (!cancelled) {
          setLoadError(getPayrollErrorMessage(error, 'Unable to load payroll form data.'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const departmentOptions = useMemo(
    () => [
      { value: '', label: 'Select department' },
      ...departments.map((department) => ({
        value: department.id,
        label: `${department.name} (${department.code})`,
      })),
    ],
    [departments],
  )

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.fullName} (${employee.employeeCode})`,
      })),
    [employees],
  )

  async function validate(values: PayrollRunFormValues) {
    setIsValidating(true)
    try {
      const result = await payrollService.validateCreate(values)
      const nextValidation = {
        ready: result.ready,
        warnings: result.warnings,
        errors: result.errors,
      }
      setValidation(nextValidation)
      return nextValidation
    } catch (error) {
      setValidation(null)
      if (error instanceof PayrollServiceError && error.code === 'CONFLICT') {
        setError('month', { message: error.message })
        setError('year', { message: error.message })
        showError(error.message)
      } else {
        showError(getPayrollErrorMessage(error, 'Payroll validation failed.'))
      }
      return null
    } finally {
      setIsValidating(false)
    }
  }

  async function onSubmit(values: PayrollRunFormValues) {
    setIsSubmitting(true)
    try {
      const checked = await validate(values)
      if (!checked || checked.errors.length > 0) {
        if (checked?.errors.length) {
          showError('Resolve payroll validation errors before creating the run.')
        }
        return
      }
      const run = await payrollService.createPayrollRun(values, actor)
      showSuccess('Payroll run created successfully.')
      navigate(`/payroll/runs/${run.id}`)
    } catch (error) {
      if (error instanceof PayrollServiceError && error.code === 'CONFLICT') {
        setError('month', { message: error.message })
        setError('year', { message: error.message })
      }
      showError(getPayrollErrorMessage(error, 'Failed to create payroll run.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canCreate) {
    return <ErrorState title="Access denied" message="You do not have permission to create payroll runs." />
  }

  if (isLoading) return <PageLoader label="Loading payroll form" />
  if (loadError) return <ErrorState title="Unable to load payroll form" message={loadError} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Payroll Run"
        description="Create a payroll period and validate employee salary snapshots before processing."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Runs', href: '/payroll/runs' },
          { label: 'New' },
        ]}
      />

      <form className="grid gap-6 xl:grid-cols-[1.2fr_1fr]" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Month"
                required
                error={errors.month?.message}
                options={monthOptions}
                {...register('month', { valueAsNumber: true, required: 'Month is required.' })}
              />
              <Input
                label="Year"
                type="number"
                required
                min={2000}
                max={2100}
                error={errors.year?.message}
                {...register('year', {
                  valueAsNumber: true,
                  required: 'Year is required.',
                  min: { value: 2000, message: 'Year must be 2000 or later.' },
                  max: { value: 2100, message: 'Year must be 2100 or earlier.' },
                })}
              />
            </div>

            <Input
              label="Run name"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Payroll name is required.' })}
            />

            <Select
              label="Currency"
              required
              options={SALARY_CURRENCY_OPTIONS}
              {...register('currency', { required: 'Currency is required.' })}
            />

            <Select
              label="Employee selection"
              options={[
                { value: 'all', label: 'All active employees' },
                { value: 'department', label: 'By department' },
                { value: 'selected', label: 'Selected employees' },
              ]}
              {...register('selectionMode')}
              onChange={(event) => {
                setValidation(null)
                setValue('selectionMode', event.target.value as PayrollRunFormValues['selectionMode'])
              }}
            />

            {selectionMode === 'department' ? (
              <Select
                label="Department"
                required
                options={departmentOptions}
                error={errors.departmentId?.message}
                {...register('departmentId', {
                  validate: (value) =>
                    selectionMode !== 'department' || Boolean(value) || 'Department is required.',
                })}
              />
            ) : null}

            {selectionMode === 'selected' ? (
              <div className="space-y-2">
                <Select
                  label="Employees"
                  multiple
                  size={Math.min(8, Math.max(4, employeeOptions.length))}
                  value={selectedEmployeeIds}
                  options={employeeOptions}
                  error={errors.selectedEmployeeIds?.message}
                  onChange={(event) => {
                    const ids = Array.from(event.target.selectedOptions).map((option) => option.value)
                    setValue('selectedEmployeeIds', ids, { shouldValidate: true })
                    setValidation(null)
                  }}
                />
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Hold Ctrl or Cmd to select multiple employees.
                </p>
                {employees.length === 0 ? (
                  <EmptyState title="No active employees found." description="Add employees before creating payroll." />
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-surface-100 pt-4 dark:border-surface-800">
              <Button variant="secondary" onClick={() => navigate('/payroll/runs')}>
                Cancel
              </Button>
              <Button
                variant="outline"
                isLoading={isValidating}
                onClick={handleSubmit((values) => validate(values))}
              >
                Validate selection
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create payroll run
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
                Validation summary
              </h2>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Payroll validates duplicate periods, salary snapshots, currency compatibility, attendance, and
                leave inputs before creation.
              </p>
            </div>
            {validation ? (
              <PayrollValidationPanel
                ready={validation.ready}
                errors={validation.errors}
                warnings={validation.warnings}
              />
            ) : (
              <EmptyState
                title="No validation run yet."
                description="Validate the selection to preview blocking errors and warnings."
              />
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
