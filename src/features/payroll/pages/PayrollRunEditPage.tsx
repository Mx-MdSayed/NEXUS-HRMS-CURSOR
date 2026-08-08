import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  Input,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { payrollService } from '../services/payrollService'
import type { PayrollRun } from '../types'
import { getPayrollErrorMessage } from '../utils/errors'
import { payrollStatusLabel, payrollStatusTone } from '../utils/status'

interface EditFormValues {
  name: string
}

export function PayrollRunEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canEdit = hasPermission(PERMISSIONS.PAYROLL_EDIT) || hasPermission(PERMISSIONS.PAYROLL_MANAGE)
  const actor = user?.name ?? 'System'

  const [run, setRun] = useState<PayrollRun | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({ defaultValues: { name: '' } })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const row = await payrollService.getPayrollRunById(id)
        if (cancelled) return
        if (row.status === 'finalized') {
          showError('Finalized payroll runs cannot be edited.')
          navigate(`/payroll/runs/${row.id}`, { replace: true })
          return
        }
        setRun(row)
        reset({ name: row.name })
      } catch (err) {
        if (!cancelled) setError(getPayrollErrorMessage(err, 'Unable to load payroll run.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, navigate, reset])

  async function onSubmit(values: EditFormValues) {
    if (!run) return
    setIsSubmitting(true)
    try {
      const updated = await payrollService.updatePayrollRun(run.id, { name: values.name }, actor)
      showSuccess('Payroll run updated successfully.')
      navigate(`/payroll/runs/${updated.id}`)
    } catch (err) {
      showError(getPayrollErrorMessage(err, 'Failed to update payroll run.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canEdit) {
    return <ErrorState title="Access denied" message="You do not have permission to edit payroll runs." />
  }
  if (isLoading) return <PageLoader label="Loading payroll run" />
  if (error || !run) {
    return <ErrorState title="Unable to load payroll run" message={error ?? 'Payroll run not found.'} />
  }

  const editable = run.status === 'draft' || run.status === 'calculated'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Payroll Run"
        description="Only the run name can be changed after payroll selection is created."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Runs', href: '/payroll/runs' },
          { label: run.name, href: `/payroll/runs/${run.id}` },
          { label: 'Edit' },
        ]}
      />

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">{run.name}</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {run.monthKey} · {run.currency}
              </p>
            </div>
            <StatusBadge status={payrollStatusTone(run.status)} label={payrollStatusLabel(run.status)} />
          </div>

          {!editable ? (
            <ErrorState
              title="Payroll run is locked"
              message="Only Draft and Calculated payroll runs can be edited."
            />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Run name"
                required
                error={errors.name?.message}
                {...register('name', {
                  required: 'Run name is required.',
                  validate: (value) => value.trim().length > 0 || 'Run name is required.',
                })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => navigate(`/payroll/runs/${run.id}`)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
