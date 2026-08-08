import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { EmployeeForm } from '../components/EmployeeForm'
import { employeeService } from '../services/employeeService'
import type { EmployeeFormValues } from '../types'
import { getEmployeeErrorMessage } from '../utils/errors'

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: EmployeeFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await employeeService.createEmployee(values, user?.name ?? 'System')
      showSuccess('Employee created successfully.')
      navigate(`/employees/${created.id}`)
    } catch (error) {
      showError(getEmployeeErrorMessage(error, 'Unable to save employee.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        description="Create a new employee record with employment and HR details."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Employees', href: '/employees' },
          { label: 'Add Employee' },
        ]}
      />
      <EmployeeForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
