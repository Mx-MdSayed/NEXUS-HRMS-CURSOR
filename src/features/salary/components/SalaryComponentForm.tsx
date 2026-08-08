import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  Form,
  FormGrid,
  FormSection,
  Input,
  Select,
  Switch,
  Textarea,
} from '@/components/ui'
import { SALARY_CURRENCY_OPTIONS, DEFAULT_SALARY_CURRENCY } from '@/constants/currencies'
import {
  CALCULATION_METHOD_OPTIONS,
  SALARY_COMPONENT_CATEGORY_OPTIONS,
  isPercentageMethod,
} from '../constants'
import type { SalaryComponent, SalaryComponentFormValues } from '../types'

const defaults: SalaryComponentFormValues = {
  name: '',
  code: '',
  description: '',
  category: 'earning',
  calculationMethod: 'fixed',
  fixedAmount: 0,
  percentage: 0,
  taxable: true,
  statutory: false,
  recurring: true,
  employerContribution: false,
  employeeContribution: false,
  currency: DEFAULT_SALARY_CURRENCY,
  status: 'active',
  displayOrder: 10,
}

function toValues(initial?: SalaryComponent): SalaryComponentFormValues {
  if (!initial) return defaults
  return {
    name: initial.name,
    code: initial.code,
    description: initial.description ?? '',
    category: initial.category,
    calculationMethod: initial.calculationMethod,
    fixedAmount: initial.fixedAmount ?? 0,
    percentage: initial.percentage ?? 0,
    percentageOf: initial.percentageOf,
    taxable: initial.taxable,
    statutory: initial.statutory,
    recurring: initial.recurring,
    employerContribution: initial.employerContribution,
    employeeContribution: initial.employeeContribution,
    currency: initial.currency,
    status: initial.status,
    displayOrder: initial.displayOrder,
  }
}

interface SalaryComponentFormProps {
  initial?: SalaryComponent
  onSubmit: (values: SalaryComponentFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SalaryComponentForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: SalaryComponentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SalaryComponentFormValues>({
    defaultValues: toValues(initial),
  })

  const method = watch('calculationMethod')
  const showPercentage = isPercentageMethod(method)

  return (
    <Form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          code: values.code.trim().toUpperCase(),
          fixedAmount: Number(values.fixedAmount) || 0,
          percentage: Number(values.percentage) || 0,
          displayOrder: Number(values.displayOrder) || 0,
        })
      })}
    >
      <FormSection title="Component details" description="Configure how this component is calculated.">
        <FormGrid columns={2}>
          <Input
            label="Name"
            required
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Code"
            required
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />
          <div className="md:col-span-2">
            <Textarea label="Description" rows={3} {...register('description')} />
          </div>
          <Select
            label="Category"
            options={SALARY_COMPONENT_CATEGORY_OPTIONS}
            {...register('category')}
          />
          <Select
            label="Calculation method"
            options={CALCULATION_METHOD_OPTIONS}
            {...register('calculationMethod')}
          />
          {showPercentage ? (
            <Input
              label="Percentage"
              type="number"
              step={0.01}
              min={0}
              max={100}
              error={errors.percentage?.message}
              {...register('percentage', {
                valueAsNumber: true,
                min: { value: 0, message: 'Min 0' },
                max: { value: 100, message: 'Max 100' },
              })}
            />
          ) : (
            <Input
              label="Fixed amount"
              type="number"
              step={0.01}
              min={0}
              error={errors.fixedAmount?.message}
              {...register('fixedAmount', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cannot be negative' },
              })}
            />
          )}
          <Select label="Currency" options={SALARY_CURRENCY_OPTIONS} {...register('currency')} />
          <Input
            label="Display order"
            type="number"
            {...register('displayOrder', { valueAsNumber: true })}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            {...register('status')}
          />
        </FormGrid>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Controller
            name="taxable"
            control={control}
            render={({ field }) => (
              <Switch label="Taxable" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Controller
            name="statutory"
            control={control}
            render={({ field }) => (
              <Switch label="Statutory" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Controller
            name="recurring"
            control={control}
            render={({ field }) => (
              <Switch label="Recurring" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Controller
            name="employeeContribution"
            control={control}
            render={({ field }) => (
              <Switch
                label="Employee contribution"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="employerContribution"
            control={control}
            render={({ field }) => (
              <Switch
                label="Employer contribution"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initial ? 'Save component' : 'Create component'}
        </Button>
      </div>
    </Form>
  )
}
