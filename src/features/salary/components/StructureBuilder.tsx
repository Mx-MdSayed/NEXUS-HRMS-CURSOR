import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { SALARY_CURRENCY_OPTIONS } from '@/constants/currencies'
import type { SalaryCurrencyCode } from '@/constants/currencies'
import { CALCULATION_METHOD_LABELS, SALARY_COMPONENT_CATEGORY_LABELS } from '../constants'
import { salaryCalculationService } from '../services/salaryCalculationService'
import type {
  SalaryCalculationResult,
  SalaryComponent,
  StructureComponentLineInput,
} from '../types'
import { SalaryPreview } from './SalaryPreview'
import { getSalaryErrorMessage } from '../utils/errors'

export interface StructureBuilderState {
  name: string
  code: string
  description: string
  currency: SalaryCurrencyCode
  effectiveFrom: string
  status: 'active' | 'inactive' | 'draft'
  components: StructureComponentLineInput[]
}

interface StructureBuilderProps {
  value: StructureBuilderState
  onChange: (next: StructureBuilderState) => void
  availableComponents: SalaryComponent[]
  preview: SalaryCalculationResult | null
  onPreviewChange: (result: SalaryCalculationResult | null, error?: string) => void
}

export function StructureBuilder({
  value,
  onChange,
  availableComponents,
  preview,
  onPreviewChange,
}: StructureBuilderProps) {
  const [addComponentId, setAddComponentId] = useState('')
  const [calcError, setCalcError] = useState<string | null>(null)

  const unusedComponents = useMemo(() => {
    const used = new Set(value.components.map((item) => item.componentId))
    return availableComponents.filter(
      (item) => item.status === 'active' && !used.has(item.id),
    )
  }, [availableComponents, value.components])

  useEffect(() => {
    if (value.components.length === 0) {
      onPreviewChange(null)
      setCalcError(null)
      return
    }
    try {
      const result = salaryCalculationService.calculateSalaryStructure(
        value.components,
        value.currency,
        availableComponents,
      )
      onPreviewChange(result)
      setCalcError(null)
    } catch (error) {
      onPreviewChange(null, getSalaryErrorMessage(error, 'Calculation failed.'))
      setCalcError(getSalaryErrorMessage(error, 'Calculation failed.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.components, value.currency, availableComponents])

  const updateLine = (componentId: string, patch: Partial<StructureComponentLineInput>) => {
    onChange({
      ...value,
      components: value.components.map((item) =>
        item.componentId === componentId ? { ...item, ...patch } : item,
      ),
    })
  }

  const move = (index: number, direction: -1 | 1) => {
    const next = [...value.components]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    onChange({
      ...value,
      components: next.map((item, i) => ({ ...item, displayOrder: i + 1 })),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Structure name"
            required
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
          />
          <Input
            label="Structure code"
            required
            value={value.code}
            onChange={(event) => onChange({ ...value, code: event.target.value.toUpperCase() })}
          />
          <Input
            label="Description"
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            className="md:col-span-2"
          />
          <Select
            label="Currency"
            value={value.currency}
            onChange={(event) =>
              onChange({ ...value, currency: event.target.value as SalaryCurrencyCode })
            }
            options={SALARY_CURRENCY_OPTIONS}
          />
          <Input
            label="Effective from"
            type="date"
            required
            value={value.effectiveFrom}
            onChange={(event) => onChange({ ...value, effectiveFrom: event.target.value })}
          />
          <Select
            label="Status"
            value={value.status}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value as StructureBuilderState['status'],
              })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </div>

        <div className="rounded-xl border border-surface-200 p-4 dark:border-surface-800">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Select
                label="Add component"
                value={addComponentId}
                onChange={(event) => setAddComponentId(event.target.value)}
                options={[
                  { value: '', label: 'Select component' },
                  ...unusedComponents.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.code}) · ${SALARY_COMPONENT_CATEGORY_LABELS[item.category]}`,
                  })),
                ]}
              />
            </div>
            <Button
              type="button"
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={!addComponentId}
              onClick={() => {
                const master = availableComponents.find((item) => item.id === addComponentId)
                if (!master) return
                onChange({
                  ...value,
                  components: [
                    ...value.components,
                    {
                      componentId: master.id,
                      fixedAmount: master.fixedAmount ?? 0,
                      percentage: master.percentage ?? 0,
                      displayOrder: value.components.length + 1,
                    },
                  ],
                })
                setAddComponentId('')
              }}
            >
              Add
            </Button>
          </div>

          {value.components.length === 0 ? (
            <p className="text-sm text-surface-500">No components added yet.</p>
          ) : (
            <div className="space-y-3">
              {value.components.map((line, index) => {
                const master = availableComponents.find((item) => item.id === line.componentId)
                if (!master) return null
                const isPct = master.calculationMethod !== 'fixed'
                return (
                  <div
                    key={line.componentId}
                    className="grid gap-3 rounded-lg border border-surface-100 p-3 dark:border-surface-800 md:grid-cols-[1.2fr_1fr_auto]"
                  >
                    <div>
                      <p className="font-medium">{master.name}</p>
                      <p className="text-xs text-surface-500">
                        {master.code} · {SALARY_COMPONENT_CATEGORY_LABELS[master.category]} ·{' '}
                        {CALCULATION_METHOD_LABELS[master.calculationMethod]}
                      </p>
                    </div>
                    <div>
                      {isPct ? (
                        <Input
                          label="Percentage"
                          type="number"
                          step={0.01}
                          value={line.percentage ?? 0}
                          onChange={(event) =>
                            updateLine(line.componentId, {
                              percentage: Number(event.target.value),
                            })
                          }
                        />
                      ) : (
                        <Input
                          label="Fixed amount"
                          type="number"
                          step={0.01}
                          value={line.fixedAmount ?? 0}
                          onChange={(event) =>
                            updateLine(line.componentId, {
                              fixedAmount: Number(event.target.value),
                            })
                          }
                        />
                      )}
                    </div>
                    <div className="flex items-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Move up"
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Move down"
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Remove"
                        onClick={() =>
                          onChange({
                            ...value,
                            components: value.components
                              .filter((item) => item.componentId !== line.componentId)
                              .map((item, i) => ({ ...item, displayOrder: i + 1 })),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-danger-600" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {calcError ? <p className="mt-3 text-sm text-danger-600">{calcError}</p> : null}
        </div>
      </div>

      <SalaryPreview result={preview} currency={value.currency} />
    </div>
  )
}
