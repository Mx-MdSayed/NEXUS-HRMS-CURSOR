import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { DepartmentForm } from '../components/DepartmentForm'
import { departmentService } from '../services/departmentService'
import type { DepartmentFormValues } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

export function DepartmentEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [initialValues, setInitialValues] = useState<DepartmentFormValues | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    void departmentService
      .getDepartmentById(id)
      .then((department) => {
        if (!active) return
        setInitialValues(departmentService.departmentToFormValues(department))
      })
      .catch(() => {
        if (active) setHasError(true)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const onSubmit = async (values: DepartmentFormValues) => {
    setIsSubmitting(true)
    try {
      await departmentService.updateDepartment(id, values, user?.name ?? 'System')
      showSuccess('Department updated successfully.')
      navigate(`/departments/${id}`)
    } catch (error) {
      showError(getOrgErrorMessage(error, 'Unable to update department.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoader label="Loading department" />
  if (hasError || !initialValues) {
    return (
      <ErrorState
        title="Unable to load department"
        message="The department record could not be loaded."
        onRetry={() => navigate(0)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Department"
        description="Update department details and structure."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Departments', href: '/departments' },
          { label: 'Edit' },
        ]}
      />
      <DepartmentForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
