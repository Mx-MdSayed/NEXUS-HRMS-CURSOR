import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Form, FormGrid, FormSection, Input, Select, Textarea } from '@/components/ui'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { ORG_STATUS_OPTIONS } from '../constants'
import type { DepartmentFormValues } from '../types'

const defaultValues: DepartmentFormValues = {
  name: '',
  code: '',
  description: '',
  headEmployeeId: '',
  location: '',
  email: '',
  phone: '',
  status: 'active',
}

export function DepartmentForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
}: {
  mode: 'create' | 'edit'
  initialValues?: DepartmentFormValues
  onSubmit: (values: DepartmentFormValues) => Promise<void>
  isSubmitting?: boolean
}) {
  const navigate = useNavigate()
  const [heads, setHeads] = useState<EmployeeListItem[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    defaultValues: initialValues ?? defaultValues,
  })

  useEffect(() => {
    if (initialValues) reset(initialValues)
  }, [initialValues, reset])

  useEffect(() => {
    void employeeService
      .getEmployees({
        filters: { employmentStatus: 'active' },
        page: 1,
        pageSize: 100,
        sortBy: 'fullName',
      })
      .then((result) => setHeads(result.data))
  }, [])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Department details" description="Core department master data.">
        <FormGrid columns={2}>
          <Input
            label="Department Name"
            requiredMark
            error={errors.name?.message}
            {...register('name', { required: 'Department name is required' })}
          />
          <Input
            label="Department Code"
            requiredMark
            error={errors.code?.message}
            {...register('code', {
              required: 'Department code is required',
              pattern: {
                value: /^[A-Za-z0-9_-]+$/,
                message: 'Use letters, numbers, hyphen or underscore',
              },
            })}
          />
          <div className="md:col-span-2">
            <Textarea label="Description" rows={3} {...register('description')} />
          </div>
          <Select
            label="Department Head"
            placeholder="Select department head"
            options={heads.map((item) => ({
              value: item.id,
              label: `${item.fullName} (${item.employeeCode})`,
            }))}
            {...register('headEmployeeId')}
          />
          <Input label="Location" {...register('location')} />
          <Input
            label="Department Email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              pattern: {
                value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          <Input
            label="Department Phone"
            error={errors.phone?.message}
            {...register('phone', {
              validate: (value) =>
                !value || value.trim().length >= 8 || 'Enter a valid phone number',
            })}
          />
          <Select
            label="Status"
            requiredMark
            options={ORG_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status', { required: 'Status is required' })}
          />
        </FormGrid>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Department' : 'Save Changes'}
        </Button>
      </div>
    </Form>
  )
}
