import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { DesignationForm } from '../components/DesignationForm'
import { designationService } from '../services/designationService'
import type { DesignationFormValues } from '../types'
import { getOrgErrorMessage } from '../utils/errors'

export function DesignationEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [initialValues, setInitialValues] = useState<DesignationFormValues | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    void designationService
      .getDesignationById(id)
      .then((designation) => {
        if (!active) return
        setInitialValues(designationService.designationToFormValues(designation))
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

  const onSubmit = async (values: DesignationFormValues) => {
    setIsSubmitting(true)
    try {
      await designationService.updateDesignation(id, values, user?.name ?? 'System')
      showSuccess('Designation updated successfully.')
      navigate(`/designations/${id}`)
    } catch (error) {
      showError(getOrgErrorMessage(error, 'Unable to update designation.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <PageLoader label="Loading designation" />
  if (hasError || !initialValues) {
    return (
      <ErrorState
        title="Unable to load designation"
        message="The designation record could not be loaded."
        onRetry={() => navigate(0)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Designation"
        description="Update designation details and department linkage."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Designations', href: '/designations' },
          { label: 'Edit' },
        ]}
      />
      <DesignationForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
