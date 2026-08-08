import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { EmployeeForm } from '../components/EmployeeForm'
import { employeeService } from '../services/employeeService'
import type { EmployeeFormValues } from '../types'
import { getEmployeeErrorMessage } from '../utils/errors'

export function EmployeeEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [initialValues, setInitialValues] = useState<EmployeeFormValues | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setHasError(false)
    void employeeService
      .getEmployeeById(id)
      .then((employee) => {
        if (!active) return
        setInitialValues(employeeService.employeeToFormValues(employee))
      })
      .catch(() => {
        if (!active) return
        setHasError(true)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const onSubmit = async (values: EmployeeFormValues) => {
    setIsSubmitting(true)
    try {
      await employeeService.updateEmployee(id, values, user?.name ?? 'System')
      showSuccess('Employee updated successfully.')
      navigate(`/employees/${id}`)
    } catch (error) {
      showError(getEmployeeErrorMessage(error, 'Unable to update employee.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoader label="Loading employee" />
  if (hasError || !initialValues) {
    return (
      <ErrorState
        title="Unable to load employee"
        message="The employee record could not be loaded."
        onRetry={() => navigate(0)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Employee"
        description="Update employee personal, employment, KYC and banking details."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Employees', href: '/employees' },
          { label: 'Edit' },
        ]}
      />
      <EmployeeForm
        mode="edit"
        initialValues={initialValues}
        currentEmployeeId={id}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
