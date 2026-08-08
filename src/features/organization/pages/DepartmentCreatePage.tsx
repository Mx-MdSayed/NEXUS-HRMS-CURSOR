import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { DepartmentForm } from '../components/DepartmentForm'
import { departmentService } from '../services/departmentService'
import type { DepartmentFormValues } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

export function DepartmentCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: DepartmentFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await departmentService.createDepartment(values, user?.name ?? 'System')
      showSuccess('Department created successfully.')
      navigate(`/departments/${created.id}`)
    } catch (error) {
      showError(getOrgErrorMessage(error, 'Unable to save department.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Department"
        description="Create a new organizational department."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Departments', href: '/departments' },
          { label: 'Add Department' },
        ]}
      />
      <DepartmentForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
