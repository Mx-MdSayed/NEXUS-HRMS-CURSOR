import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button, Form, FormGrid, FormSection, Input, Select, Textarea } from '@/components/ui'
import { DESIGNATION_LEVEL_OPTIONS, ORG_STATUS_OPTIONS } from '../constants'
import { listActiveDepartmentOptions } from '../data/orgDb'
import type { DepartmentOption, DesignationFormValues } from '../types'

const defaultValues: DesignationFormValues = {
  name: '',
  code: '',
  description: '',
  departmentId: '',
  level: 'mid',
  status: 'active',
}

export function DesignationForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
}: {
  mode: 'create' | 'edit'
  initialValues?: DesignationFormValues
  onSubmit: (values: DesignationFormValues) => Promise<void>
  isSubmitting?: boolean
}) {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<DepartmentOption[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    defaultValues: initialValues ?? defaultValues,
  })

  useEffect(() => {
    if (initialValues) reset(initialValues)
  }, [initialValues, reset])

  useEffect(() => {
    setDepartments(listActiveDepartmentOptions())
  }, [])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Designation details" description="Job title and organizational level.">
        <FormGrid columns={2}>
          <Input
            label="Designation Name"
            requiredMark
            error={errors.name?.message}
            {...register('name', { required: 'Designation name is required' })}
          />
          <Input
            label="Designation Code"
            requiredMark
            error={errors.code?.message}
            {...register('code', {
              required: 'Designation code is required',
              pattern: {
                value: /^[A-Za-z0-9_-]+$/,
                message: 'Use letters, numbers, hyphen or underscore',
              },
            })}
          />
          <Select
            label="Department"
            requiredMark
            placeholder="Select department"
            options={departments.map((item) => ({ value: item.id, label: item.name }))}
            error={errors.departmentId?.message}
            {...register('departmentId', { required: 'Department is required' })}
          />
          <Select
            label="Level"
            requiredMark
            options={DESIGNATION_LEVEL_OPTIONS}
            error={errors.level?.message}
            {...register('level', { required: 'Level is required' })}
          />
          <div className="md:col-span-2">
            <Textarea label="Description" rows={3} {...register('description')} />
          </div>
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
          {mode === 'create' ? 'Create Designation' : 'Save Changes'}
        </Button>
      </div>
    </Form>
  )
}
