import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, DateInput, Input, Modal, Select, Textarea } from '@/components/ui'
import { ATTENDANCE_STATUS_OPTIONS, STATUSES_REQUIRING_TIMES } from '../constants'
import type { AttendanceFormValues, AttendanceStatus } from '../types'

export function AttendanceFormModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  employees,
  initialValues,
  lockEmployee,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: AttendanceFormValues) => Promise<void>
  isSubmitting?: boolean
  title: string
  employees: Array<{ id: string; label: string }>
  initialValues?: Partial<AttendanceFormValues>
  lockEmployee?: boolean
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    defaultValues: {
      employeeId: '',
      date: '',
      checkIn: '',
      checkOut: '',
      status: 'present',
      remarks: '',
      ...initialValues,
    },
  })

  const status = watch('status') as AttendanceStatus
  const requiresTimes = STATUSES_REQUIRING_TIMES.includes(status)

  useEffect(() => {
    if (open) {
      reset({
        employeeId: '',
        date: '',
        checkIn: '',
        checkOut: '',
        status: 'present',
        remarks: '',
        ...initialValues,
      })
    }
  }, [initialValues, open, reset])

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values)
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Employee"
            requiredMark
            disabled={lockEmployee}
            placeholder="Select employee"
            options={employees.map((item) => ({ value: item.id, label: item.label }))}
            error={errors.employeeId?.message}
            {...register('employeeId', { required: 'Employee is required' })}
          />
          <DateInput
            label="Date"
            requiredMark
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
          <Select
            label="Status"
            requiredMark
            options={ATTENDANCE_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status', { required: 'Status is required' })}
          />
          <Input
            label="Check In"
            type="time"
            requiredMark={requiresTimes}
            error={errors.checkIn?.message}
            {...register('checkIn', {
              validate: (value) =>
                !requiresTimes || Boolean(value) || 'Check-in is required for this status',
            })}
          />
          <Input label="Check Out" type="time" {...register('checkOut')} />
          <div className="sm:col-span-2">
            <Textarea label="Remarks" rows={3} {...register('remarks')} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Attendance
          </Button>
        </div>
      </form>
    </Modal>
  )
}
