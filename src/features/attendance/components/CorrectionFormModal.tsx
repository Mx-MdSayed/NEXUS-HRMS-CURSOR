import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, DateInput, Input, Modal, Select, Textarea } from '@/components/ui'
import { ATTENDANCE_STATUS_OPTIONS } from '../constants'
import type { AttendanceStatus } from '../types'

export type CorrectionFormValues = {
  date: string
  requestedStatus: AttendanceStatus
  requestedCheckIn?: string
  requestedCheckOut?: string
  reason: string
}

export function CorrectionFormModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialDate,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: CorrectionFormValues) => Promise<void>
  isSubmitting?: boolean
  initialDate?: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrectionFormValues>({
    defaultValues: {
      date: initialDate ?? '',
      requestedStatus: 'present',
      requestedCheckIn: '',
      requestedCheckOut: '',
      reason: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        date: initialDate ?? '',
        requestedStatus: 'present',
        requestedCheckIn: '',
        requestedCheckOut: '',
        reason: '',
      })
    }
  }, [initialDate, open, reset])

  return (
    <Modal open={open} onClose={onClose} title="Request attendance correction" size="lg">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateInput
            label="Date"
            requiredMark
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <Select
            label="Requested Status"
            requiredMark
            options={ATTENDANCE_STATUS_OPTIONS}
            {...register('requestedStatus', { required: 'Status is required' })}
          />
          <Input label="Requested Check In" type="time" {...register('requestedCheckIn')} />
          <Input label="Requested Check Out" type="time" {...register('requestedCheckOut')} />
          <div className="sm:col-span-2">
            <Textarea
              label="Reason"
              requiredMark
              rows={3}
              error={errors.reason?.message}
              {...register('reason', { required: 'Reason is required' })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  )
}
