import { useForm, Controller } from 'react-hook-form'
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
import { LEAVE_CATEGORY_OPTIONS } from '../constants'
import type { LeaveType, LeaveTypeFormValues } from '../types'

const defaultValues: LeaveTypeFormValues = {
  name: '',
  code: '',
  description: '',
  category: 'casual',
  paid: true,
  annualAllocation: 0,
  carryForwardAllowed: false,
  maxCarryForwardDays: 0,
  requiresApproval: true,
  requiresDocument: false,
  documentRequiredAfterDays: undefined,
  minimumNoticeDays: 0,
  maximumConsecutiveDays: 30,
  applicableGender: 'all',
  applicableEmploymentTypes: ['all'],
  status: 'active',
}

function toFormValues(type?: LeaveType): LeaveTypeFormValues {
  if (!type) return defaultValues
  return {
    name: type.name,
    code: type.code,
    description: type.description ?? '',
    category: type.category,
    paid: type.paid,
    annualAllocation: type.annualAllocation,
    carryForwardAllowed: type.carryForwardAllowed,
    maxCarryForwardDays: type.maxCarryForwardDays,
    requiresApproval: type.requiresApproval,
    requiresDocument: type.requiresDocument,
    documentRequiredAfterDays: type.documentRequiredAfterDays,
    minimumNoticeDays: type.minimumNoticeDays,
    maximumConsecutiveDays: type.maximumConsecutiveDays,
    applicableGender: type.applicableGender,
    applicableEmploymentTypes: type.applicableEmploymentTypes,
    status: type.status,
  }
}

interface LeaveTypeFormProps {
  initial?: LeaveType
  onSubmit: (values: LeaveTypeFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function LeaveTypeForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: LeaveTypeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<LeaveTypeFormValues>({
    defaultValues: toFormValues(initial),
  })

  const carryForwardAllowed = watch('carryForwardAllowed')

  return (
    <Form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          code: values.code.trim().toUpperCase(),
          annualAllocation: Number(values.annualAllocation) || 0,
          maxCarryForwardDays: Number(values.maxCarryForwardDays) || 0,
          minimumNoticeDays: Number(values.minimumNoticeDays) || 0,
          maximumConsecutiveDays: Number(values.maximumConsecutiveDays) || 0,
          documentRequiredAfterDays:
            values.documentRequiredAfterDays === undefined ||
            Number.isNaN(values.documentRequiredAfterDays)
              ? undefined
              : Number(values.documentRequiredAfterDays),
        })
      })}
    >
      <FormSection title="Leave type details" description="Configure how this leave type behaves.">
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
            options={LEAVE_CATEGORY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            {...register('category')}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            {...register('status')}
          />
          <Input
            label="Annual allocation"
            type="number"
            min={0}
            step={0.5}
            error={errors.annualAllocation?.message}
            {...register('annualAllocation', {
              required: 'Allocation is required',
              min: { value: 0, message: 'Allocation must be 0 or more' },
              valueAsNumber: true,
            })}
          />
          <Input
            label="Minimum notice days"
            type="number"
            min={0}
            {...register('minimumNoticeDays', { valueAsNumber: true })}
          />
          <Input
            label="Maximum consecutive days"
            type="number"
            min={0}
            {...register('maximumConsecutiveDays', { valueAsNumber: true })}
          />
          <Input
            label="Document required after (days)"
            type="number"
            min={0}
            hint="Optional — e.g. sick leave after 2 days"
            {...register('documentRequiredAfterDays', { valueAsNumber: true })}
          />
          <Select
            label="Applicable gender"
            options={[
              { value: 'all', label: 'All' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            {...register('applicableGender')}
          />
        </FormGrid>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Controller
            name="paid"
            control={control}
            render={({ field }) => (
              <Switch
                label="Paid leave"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="requiresApproval"
            control={control}
            render={({ field }) => (
              <Switch
                label="Requires approval"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="requiresDocument"
            control={control}
            render={({ field }) => (
              <Switch
                label="Requires document"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            name="carryForwardAllowed"
            control={control}
            render={({ field }) => (
              <Switch
                label="Carry forward allowed"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {carryForwardAllowed ? (
          <div className="mt-4 max-w-xs">
            <Input
              label="Maximum carry forward days"
              type="number"
              min={0}
              max={30}
              {...register('maxCarryForwardDays', {
                valueAsNumber: true,
                max: { value: 30, message: 'Carry-forward cannot exceed 30 days' },
              })}
              error={errors.maxCarryForwardDays?.message}
            />
          </div>
        ) : null}
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initial ? 'Save leave type' : 'Create leave type'}
        </Button>
      </div>
    </Form>
  )
}
