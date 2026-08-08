import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { DesignationForm } from '../components/DesignationForm'
import { designationService } from '../services/designationService'
import type { DesignationFormValues } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

export function DesignationCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: DesignationFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await designationService.createDesignation(values, user?.name ?? 'System')
      showSuccess('Designation created successfully.')
      navigate(`/designations/${created.id}`)
    } catch (error) {
      showError(getOrgErrorMessage(error, 'Unable to save designation.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Designation"
        description="Create a new job title and organizational role."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Designations', href: '/designations' },
          { label: 'Add Designation' },
        ]}
      />
      <DesignationForm mode="create" onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
