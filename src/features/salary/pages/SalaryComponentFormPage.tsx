import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { SalaryComponentForm } from '../components/SalaryComponentForm'
import { salaryComponentService } from '../services/salaryComponentService'
import type { SalaryComponent, SalaryComponentFormValues } from '../types'
import { getSalaryErrorMessage } from '../utils/errors'

export function SalaryComponentFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.SALARY_COMPONENT_MANAGE) || hasPermission(PERMISSIONS.SALARY_MANAGE)

  const [initial, setInitial] = useState<SalaryComponent | undefined>()
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !id) return
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const item = await salaryComponentService.getComponentById(id!)
        if (!cancelled) setInitial(item)
      } catch (err) {
        if (!cancelled) setError(getSalaryErrorMessage(err, 'Component not found.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  if (!canManage) {
    return (
      <ErrorState
        title="Access denied"
        message="You do not have permission to manage salary components."
      />
    )
  }
  if (isLoading) return <PageLoader label="Loading component" />
  if (error) return <ErrorState title="Unable to load component" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit salary component' : 'New salary component'}
        description="Define calculation method, taxability, and statutory flags."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Components', href: '/salary/components' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />
      <SalaryComponentForm
        initial={initial}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/salary/components')}
        onSubmit={async (values: SalaryComponentFormValues) => {
          setIsSubmitting(true)
          try {
            if (isEdit && id) {
              await salaryComponentService.updateComponent(id, values, user?.name ?? 'System')
              showSuccess('Salary component updated successfully.')
            } else {
              await salaryComponentService.createComponent(values, user?.name ?? 'System')
              showSuccess('Salary component created successfully.')
            }
            navigate('/salary/components')
          } catch (err) {
            showError(getSalaryErrorMessage(err, 'Failed to save component.'))
          } finally {
            setIsSubmitting(false)
          }
        }}
      />
    </div>
  )
}
