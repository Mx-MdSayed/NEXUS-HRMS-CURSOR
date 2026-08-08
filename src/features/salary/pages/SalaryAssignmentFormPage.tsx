import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  ErrorState,
  Input,
  PageHeader,
  PageLoader,
  Select,
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees'
import { showError, showSuccess } from '@/utils/toast'
import { SalaryPreview } from '../components/SalaryPreview'
import { employeeSalaryService } from '../services/employeeSalaryService'
import { salaryCalculationService } from '../services/salaryCalculationService'
import { salaryStructureService } from '../services/salaryStructureService'
import type { SalaryCalculationResult, SalaryStructure } from '../types'
import { getSalaryErrorMessage } from '../utils/errors'

export function SalaryAssignmentFormPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const canAssign = hasPermission(PERMISSIONS.SALARY_ASSIGN) || hasPermission(PERMISSIONS.SALARY_MANAGE)

  const [employees, setEmployees] = useState<{ id: string; fullName: string; employeeCode: string }[]>(
    [],
  )
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [structureId, setStructureId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('2026-08-01')
  const [notes, setNotes] = useState('')
  const [overrideBasic, setOverrideBasic] = useState('')
  const [preview, setPreview] = useState<SalaryCalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const [empResult, structs] = await Promise.all([
          employeeService.getEmployees({ page: 1, pageSize: 100, sortBy: 'fullName' }),
          salaryStructureService.getStructures({ status: 'active' }),
        ])
        if (cancelled) return
        setEmployees(
          empResult.data.map((item) => ({
            id: item.id,
            fullName: item.fullName,
            employeeCode: item.employeeCode,
          })),
        )
        setStructures(structs)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedStructure = useMemo(
    () => structures.find((item) => item.id === structureId),
    [structureId, structures],
  )

  useEffect(() => {
    if (!selectedStructure) {
      setPreview(null)
      return
    }
    const overrides =
      overrideBasic !== ''
        ? {
            'sc-basic': { fixedAmount: Number(overrideBasic) },
          }
        : undefined
    const inputs = selectedStructure.components.map((line) => ({
      componentId: line.componentId,
      fixedAmount:
        overrides?.[line.componentId as 'sc-basic']?.fixedAmount ?? line.fixedAmount,
      percentage: line.percentage,
      displayOrder: line.displayOrder,
      override: Boolean(overrides?.[line.componentId as 'sc-basic']),
    }))
    try {
      setPreview(
        salaryCalculationService.calculateSalaryStructure(inputs, selectedStructure.currency),
      )
    } catch {
      setPreview(null)
    }
  }, [overrideBasic, selectedStructure])

  if (!canAssign) {
    return <ErrorState title="Access denied" message="You cannot assign salaries." />
  }
  if (isLoading) return <PageLoader label="Loading assignment form" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign salary"
        description="Create an employee salary snapshot from a structure. Overrides do not change the master structure."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Salary', href: '/salary' },
          { label: 'Assignments', href: '/salary/assignments' },
          { label: 'New' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
          <Select
            label="Employee"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            options={[
              { value: '', label: 'Select employee' },
              ...employees.map((item) => ({
                value: item.id,
                label: `${item.fullName} (${item.employeeCode})`,
              })),
            ]}
          />
          <Select
            label="Salary structure"
            required
            value={structureId}
            onChange={(event) => setStructureId(event.target.value)}
            options={[
              { value: '', label: 'Select structure' },
              ...structures.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.code}) · ${item.currency}`,
              })),
            ]}
          />
          <Input
            label="Effective from"
            type="date"
            required
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
          <Input
            label="Custom override — Basic (optional)"
            type="number"
            hint="Leave blank to use structure basic. Marked as override on the snapshot."
            value={overrideBasic}
            onChange={(event) => setOverrideBasic(event.target.value)}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/salary/assignments')}>
              Cancel
            </Button>
            <Button
              isLoading={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  const assigned = await employeeSalaryService.assignSalary(
                    {
                      employeeId,
                      structureId,
                      effectiveFrom,
                      notes,
                      overrides:
                        overrideBasic !== ''
                          ? { 'sc-basic': { fixedAmount: Number(overrideBasic) } }
                          : undefined,
                    },
                    user?.name ?? 'System',
                  )
                  showSuccess('Salary assigned successfully.')
                  navigate(`/salary/${assigned.employeeId}`)
                } catch (err) {
                  showError(getSalaryErrorMessage(err, 'Failed to assign salary.'))
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              Assign salary
            </Button>
          </div>
        </div>
        <SalaryPreview result={preview} currency={selectedStructure?.currency} />
      </div>
    </div>
  )
}
