import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/utils/date'
import { SalaryPreview } from '../components/SalaryPreview'
import { salaryCalculationService } from '../services/salaryCalculationService'
import { salaryStructureService } from '../services/salaryStructureService'
import type { SalaryCalculationResult, SalaryStructure } from '../types'
import { formatSalaryAmount } from '../utils/money'
import { getSalaryErrorMessage } from '../utils/errors'

export function SalaryStructureDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canEdit = hasPermission(PERMISSIONS.SALARY_EDIT) || hasPermission(PERMISSIONS.SALARY_MANAGE)

  const [structure, setStructure] = useState<SalaryStructure | null>(null)
  const [preview, setPreview] = useState<SalaryCalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const item = await salaryStructureService.getStructureById(id)
        if (cancelled) return
        setStructure(item)
        const calc = salaryCalculationService.calculateSalaryStructure(
          item.components.map((line) => ({
            componentId: line.componentId,
            fixedAmount: line.fixedAmount,
            percentage: line.percentage,
            displayOrder: line.displayOrder,
          })),
          item.currency,
        )
        if (!cancelled) setPreview(calc)
      } catch (err) {
        if (!cancelled) setError(getSalaryErrorMessage(err, 'Structure not found.'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) return <PageLoader label="Loading structure" />
  if (error || !structure) {
    return <ErrorState title="Unable to load structure" message={error ?? 'Not found'} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={structure.name}
        description={`${structure.code} · ${structure.currency}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Structures', href: '/salary/structures' },
          { label: structure.code },
        ]}
        actions={
          canEdit ? (
            <Button onClick={() => navigate(`/salary/structures/${structure.id}/edit`)}>
              Edit structure
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-surface-500">Monthly gross</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatSalaryAmount(structure.monthlyGross, structure.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-surface-500">Annual gross</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatSalaryAmount(structure.annualGross, structure.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-surface-500">Monthly CTC</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatSalaryAmount(structure.monthlyCTC, structure.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-surface-500">Annual CTC</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatSalaryAmount(structure.annualCTC, structure.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={structure.status === 'draft' ? 'pending' : structure.status}
                label={structure.status}
              />
              <span className="text-sm text-surface-500">
                Effective {formatDate(structure.effectiveFrom)}
              </span>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              {structure.description || 'No description.'}
            </p>
            <p className="text-xs text-surface-500">
              {structure.components.length} components · Updated by {structure.updatedBy}
            </p>
          </CardContent>
        </Card>
        <SalaryPreview result={preview} currency={structure.currency} />
      </div>
    </div>
  )
}
