import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorState, PageHeader, PageLoader } from '@/components/ui'
import { DEFAULT_SALARY_CURRENCY } from '@/constants/currencies'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import {
  StructureBuilder,
  type StructureBuilderState,
} from '../components/StructureBuilder'
import { salaryComponentService } from '../services/salaryComponentService'
import { salaryStructureService } from '../services/salaryStructureService'
import type { SalaryCalculationResult, SalaryComponent } from '../types'
import { getSalaryErrorMessage } from '../utils/errors'

const emptyState = (): StructureBuilderState => ({
  name: '',
  code: '',
  description: '',
  currency: DEFAULT_SALARY_CURRENCY,
  effectiveFrom: '2026-08-01',
  status: 'active',
  components: [],
})

export function SalaryStructureFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.SALARY_MANAGE) ||
    hasPermission(PERMISSIONS.SALARY_CREATE) ||
    hasPermission(PERMISSIONS.SALARY_EDIT)

  const [state, setState] = useState<StructureBuilderState>(emptyState())
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [preview, setPreview] = useState<SalaryCalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const comps = await salaryComponentService.getComponents({ status: 'active' })
        if (cancelled) return
        setComponents(comps)
        if (isEdit && id) {
          const structure = await salaryStructureService.getStructureById(id)
          if (cancelled) return
          setState({
            name: structure.name,
            code: structure.code,
            description: structure.description ?? '',
            currency: structure.currency,
            effectiveFrom: structure.effectiveFrom,
            status: structure.status,
            components: structure.components.map((line) => ({
              componentId: line.componentId,
              fixedAmount: line.fixedAmount,
              percentage: line.percentage,
              displayOrder: line.displayOrder,
              override: line.override,
            })),
          })
        }
      } catch (err) {
        if (!cancelled) setError(getSalaryErrorMessage(err, 'Failed to load structure form.'))
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
    return <ErrorState title="Access denied" message="You cannot edit salary structures." />
  }
  if (isLoading) return <PageLoader label="Loading structure builder" />
  if (error) return <ErrorState title="Unable to load" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit salary structure' : 'New salary structure'}
        description="Build components and preview gross, net, and CTC live."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Structures', href: '/salary/structures' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/salary/structures')}>
              Cancel
            </Button>
            <Button
              isLoading={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  if (isEdit && id) {
                    await salaryStructureService.updateStructure(
                      id,
                      state,
                      user?.name ?? 'System',
                    )
                    showSuccess('Salary structure updated successfully.')
                    navigate(`/salary/structures/${id}`)
                  } else {
                    const created = await salaryStructureService.createStructure(
                      state,
                      user?.name ?? 'System',
                    )
                    showSuccess('Salary structure created successfully.')
                    navigate(`/salary/structures/${created.id}`)
                  }
                } catch (err) {
                  showError(getSalaryErrorMessage(err, 'Failed to save structure.'))
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              Save structure
            </Button>
          </div>
        }
      />

      <StructureBuilder
        value={state}
        onChange={setState}
        availableComponents={components}
        preview={preview}
        onPreviewChange={(result) => setPreview(result)}
      />
    </div>
  )
}
