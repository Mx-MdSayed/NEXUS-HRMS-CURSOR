import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Filter, X } from 'lucide-react'
import { Button, Card, CardContent, Input, Select } from '@/components/ui'
import { SALARY_CURRENCY_OPTIONS } from '@/constants/currencies'
import { departmentService } from '@/features/organization/services/departmentService'
import { designationService } from '@/features/organization/services/designationService'
import type { ReportFilters as ReportFilterValues } from '../types'
import { ReportDateFilter } from './ReportDateFilter'

interface ReportFiltersProps {
  value: ReportFilterValues
  onApply: (filters: ReportFilterValues) => void
  onReset: () => void
  showCurrency?: boolean
  showStatus?: boolean
  statusOptions?: Array<{ label: string; value: string }>
}

const defaultStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Finalized', value: 'finalized' },
]

export function ReportFilters({
  value,
  onApply,
  onReset,
  showCurrency = false,
  showStatus = false,
  statusOptions = defaultStatusOptions,
}: ReportFiltersProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<ReportFilterValues>({
    defaultValues: value,
  })
  const [departments, setDepartments] = useState<Array<{ label: string; value: string }>>([])
  const [designations, setDesignations] = useState<Array<{ label: string; value: string }>>([])
  const preset = watch('preset') ?? 'this_month'
  const departmentId = watch('departmentId') ?? ''

  useEffect(() => {
    reset(value)
  }, [reset, value])

  useEffect(() => {
    void departmentService.getDepartmentOptions().then((items) =>
      setDepartments(items.map((item) => ({ label: item.name, value: item.id }))),
    )
  }, [])

  useEffect(() => {
    void designationService.getDesignationOptions(departmentId || undefined).then((items) =>
      setDesignations(items.map((item) => ({ label: item.name, value: item.id }))),
    )
  }, [departmentId])

  const activeSummary = useMemo(() => {
    const parts: string[] = []
    if (value.search) parts.push(`Search: ${value.search}`)
    if (value.departmentId) parts.push('Department filtered')
    if (value.designationId) parts.push('Designation filtered')
    if (value.status) parts.push(`Status: ${value.status}`)
    if (value.currency) parts.push(`Currency: ${value.currency}`)
    parts.push(`Range: ${value.preset ?? 'this_month'}`)
    return parts.join(' · ')
  }, [value])

  return (
    <Card className="no-print">
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onApply)}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Search" placeholder="Search reports..." {...register('search')} />
            <ReportDateFilter
              preset={preset}
              startDate={watch('startDate')}
              endDate={watch('endDate')}
              onPresetChange={(next) => setValue('preset', next)}
              onStartDateChange={(next) => setValue('startDate', next)}
              onEndDateChange={(next) => setValue('endDate', next)}
            />
            <Select
              label="Department"
              value={departmentId}
              onChange={(event) => {
                setValue('departmentId', event.target.value)
                setValue('designationId', '')
              }}
              options={[{ label: 'All departments', value: '' }, ...departments]}
            />
            <Select
              label="Designation"
              value={watch('designationId') ?? ''}
              onChange={(event) => setValue('designationId', event.target.value)}
              options={[{ label: 'All designations', value: '' }, ...designations]}
            />
            {showStatus ? (
              <Select
                label="Status"
                value={watch('status') ?? ''}
                onChange={(event) => setValue('status', event.target.value)}
                options={[{ label: 'All statuses', value: '' }, ...statusOptions]}
              />
            ) : null}
            {showCurrency ? (
              <Select
                label="Currency"
                value={watch('currency') ?? ''}
                onChange={(event) => setValue('currency', event.target.value as never)}
                options={[{ label: 'All currencies', value: '' }, ...SALARY_CURRENCY_OPTIONS]}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-surface-500 dark:text-surface-400">{activeSummary}</p>
            <div className="flex gap-2">
              <Button variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={onReset}>
                Clear All
              </Button>
              <Button type="submit" leftIcon={<Filter className="h-4 w-4" />}>
                Apply
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
