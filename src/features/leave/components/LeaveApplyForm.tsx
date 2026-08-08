import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  FileUpload,
  Form,
  FormGrid,
  FormSection,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import {
  DAY_PORTION_OPTIONS,
  HALF_DAY_TYPE_OPTIONS,
  LEAVE_ATTACHMENT_ACCEPT,
  LEAVE_ATTACHMENT_MAX_BYTES,
  LEAVE_ATTACHMENT_TYPES,
} from '../constants'
import { leaveService } from '../services/leaveService'
import type {
  LeaveAttachment,
  LeaveBalance,
  LeaveRequestFormValues,
  LeaveType,
} from '../types'
import { calculateRemainingBalance } from '../utils/calculations'

interface LeaveApplyFormProps {
  leaveTypes: LeaveType[]
  balances: LeaveBalance[]
  defaultEmployeeId?: string
  initial?: Partial<LeaveRequestFormValues> & { attachment?: LeaveAttachment | null }
  onSubmit: (values: LeaveRequestFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  showEmployeeSelect?: boolean
  employees?: { id: string; fullName: string; employeeCode: string }[]
}

export function LeaveApplyForm({
  leaveTypes,
  balances,
  defaultEmployeeId,
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
  showEmployeeSelect,
  employees = [],
}: LeaveApplyFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({
    defaultValues: {
      employeeId: initial?.employeeId ?? defaultEmployeeId ?? '',
      leaveTypeId: initial?.leaveTypeId ?? '',
      startDate: initial?.startDate ?? '',
      endDate: initial?.endDate ?? '',
      dayPortion: initial?.dayPortion ?? 'full_day',
      halfDayType: initial?.halfDayType ?? 'first_half',
      reason: initial?.reason ?? '',
      attachment: initial?.attachment ?? null,
    },
  })

  const leaveTypeId = watch('leaveTypeId')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const dayPortion = watch('dayPortion')
  const attachment = watch('attachment')

  const [preview, setPreview] = useState<{ duration: number; workingDates: string[] }>({
    duration: 0,
    workingDates: [],
  })
  const [previewLoading, setPreviewLoading] = useState(false)

  const selectedType = useMemo(
    () => leaveTypes.find((item) => item.id === leaveTypeId),
    [leaveTypes, leaveTypeId],
  )

  const balance = useMemo(
    () => balances.find((item) => item.leaveTypeId === leaveTypeId),
    [balances, leaveTypeId],
  )

  useEffect(() => {
    if (dayPortion === 'half_day' && startDate) {
      setValue('endDate', startDate)
    }
  }, [dayPortion, startDate, setValue])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!startDate || !endDate) {
        setPreview({ duration: 0, workingDates: [] })
        return
      }
      setPreviewLoading(true)
      try {
        const result = await leaveService.previewDuration(startDate, endDate, dayPortion)
        if (!cancelled) setPreview(result)
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [startDate, endDate, dayPortion])

  const available = balance?.available ?? 0
  const remaining = calculateRemainingBalance(available, preview.duration)
  const requiresDocument =
    Boolean(selectedType?.requiresDocument) ||
    (typeof selectedType?.documentRequiredAfterDays === 'number' &&
      preview.duration >= selectedType.documentRequiredAfterDays)

  return (
    <Form
      onSubmit={handleSubmit(async (values) => {
        if (requiresDocument && !values.attachment) {
          return
        }
        await onSubmit({
          ...values,
          endDate: values.dayPortion === 'half_day' ? values.startDate : values.endDate,
        })
      })}
    >
      <FormSection title="Leave request" description="Select dates and leave type.">
        <FormGrid columns={2}>
          {showEmployeeSelect ? (
            <Select
              label="Employee"
              required
              error={errors.employeeId?.message}
              placeholder="Select employee"
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.employeeCode})`,
              }))}
              {...register('employeeId', { required: 'Employee is required' })}
            />
          ) : null}

          <Select
            label="Leave type"
            required
            error={errors.leaveTypeId?.message}
            placeholder="Select leave type"
            options={leaveTypes
              .filter((item) => item.status === 'active')
              .map((item) => ({
                value: item.id,
                label: `${item.name} (${item.code})${item.paid ? '' : ' · Unpaid'}`,
              }))}
            {...register('leaveTypeId', { required: 'Leave type is required' })}
          />

          <Input
            label="Start date"
            type="date"
            required
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Start date is required' })}
          />
          <Input
            label="End date"
            type="date"
            required
            disabled={dayPortion === 'half_day'}
            error={errors.endDate?.message}
            {...register('endDate', { required: 'End date is required' })}
          />

          <Select
            label="Day portion"
            options={DAY_PORTION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            {...register('dayPortion')}
          />

          {dayPortion === 'half_day' ? (
            <Select
              label="Half day type"
              options={HALF_DAY_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              {...register('halfDayType')}
            />
          ) : (
            <div />
          )}

          <div className="md:col-span-2">
            <Textarea
              label="Reason"
              required
              rows={4}
              error={errors.reason?.message}
              {...register('reason', { required: 'Reason is required' })}
            />
          </div>
        </FormGrid>

        <div className="mt-4 grid gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm dark:border-surface-700 dark:bg-surface-900/50 sm:grid-cols-3">
          <div>
            <p className="text-surface-500">Available balance</p>
            <p className="mt-1 text-lg font-semibold">
              {selectedType?.paid === false ? 'N/A (unpaid)' : available}
            </p>
          </div>
          <div>
            <p className="text-surface-500">Requested days</p>
            <p className="mt-1 text-lg font-semibold">
              {previewLoading ? '…' : preview.duration}
            </p>
          </div>
          <div>
            <p className="text-surface-500">Remaining balance</p>
            <p className="mt-1 text-lg font-semibold">
              {selectedType?.paid === false
                ? 'N/A'
                : previewLoading
                  ? '…'
                  : remaining}
            </p>
          </div>
        </div>

        {requiresDocument ? (
          <div className="mt-4">
            <Controller
              name="attachment"
              control={control}
              rules={{
                validate: (value) =>
                  !requiresDocument || value
                    ? true
                    : 'A supporting document is required for this leave type',
              }}
              render={({ field, fieldState }) => (
                <FileUpload
                  label="Supporting document"
                  hint="PDF, JPG, JPEG, or PNG up to 5 MB"
                  accept={LEAVE_ATTACHMENT_ACCEPT}
                  error={fieldState.error?.message}
                  value={
                    field.value
                      ? { name: field.value.name, size: field.value.size }
                      : null
                  }
                  onFileSelect={(file) => {
                    if (!file) {
                      field.onChange(null)
                      return
                    }
                    if (file.size > LEAVE_ATTACHMENT_MAX_BYTES) {
                      field.onChange(null)
                      return
                    }
                    if (!LEAVE_ATTACHMENT_TYPES.includes(file.type) && file.type !== '') {
                      field.onChange(null)
                      return
                    }
                    const meta: LeaveAttachment = {
                      name: file.name,
                      size: file.size,
                      fileType: file.type || 'application/octet-stream',
                    }
                    field.onChange(meta)
                  }}
                  onRemove={() => field.onChange(null)}
                />
              )}
            />
            {attachment ? (
              <p className="mt-2 text-xs text-surface-500">Selected: {attachment.name}</p>
            ) : null}
          </div>
        ) : null}
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Submit leave request
        </Button>
      </div>
    </Form>
  )
}
