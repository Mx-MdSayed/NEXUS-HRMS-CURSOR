import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import {
  Button,
  Checkbox,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Switch,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { EntityStatus, Weekday, WorkSchedule } from '../types'
import { WEEKDAY_OPTIONS } from '../utils/nav'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

type ScheduleFormValues = Omit<WorkSchedule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>

const emptyForm: ScheduleFormValues = {
  name: '',
  code: '',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '09:30',
  endTime: '18:00',
  breakEnabled: true,
  breakDurationMinutes: 30,
  flexibleBreak: false,
  gracePeriodMinutes: 15,
  minimumWorkingHours: 8,
  overtimeEnabled: true,
  minimumOvertimeMinutes: 30,
  status: 'active',
}

export function WorkSchedulesSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.SCHEDULE_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [rows, setRows] = useState<WorkSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm<ScheduleFormValues>({
    defaultValues: emptyForm,
  })

  const workingDays = watch('workingDays')
  const breakEnabled = watch('breakEnabled')
  const overtimeEnabled = watch('overtimeEnabled')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await settingsService.getWorkSchedules()
      setRows(data)
    } catch (err) {
      showError(getSettingsErrorMessage(err, 'Unable to load work schedules.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggleDay(day: Weekday) {
    const current = workingDays ?? []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    setValue('workingDays', next, { shouldDirty: true })
  }

  function openCreate() {
    setEditingId(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  function openEdit(row: WorkSchedule) {
    setEditingId(row.id)
    reset({
      name: row.name,
      code: row.code,
      workingDays: [...row.workingDays],
      startTime: row.startTime,
      endTime: row.endTime,
      breakEnabled: row.breakEnabled,
      breakDurationMinutes: row.breakDurationMinutes,
      flexibleBreak: row.flexibleBreak,
      gracePeriodMinutes: row.gracePeriodMinutes,
      minimumWorkingHours: row.minimumWorkingHours,
      overtimeEnabled: row.overtimeEnabled,
      minimumOvertimeMinutes: row.minimumOvertimeMinutes,
      status: row.status,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    reset(emptyForm)
  }

  async function onSubmit(values: ScheduleFormValues) {
    setSubmitting(true)
    try {
      if (editingId) {
        await settingsService.updateWorkSchedule(editingId, values)
        showSuccess('Work schedule updated.')
      } else {
        await settingsService.createWorkSchedule(values)
        showSuccess('Work schedule created.')
      }
      closeModal()
      await load()
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Schedules"
        description="Shifts, grace periods, breaks, and overtime rules."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Settings', href: '/settings' },
          { label: 'Work Schedules' },
        ]}
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add schedule
            </Button>
          ) : null
        }
      />

      <DataTable
        isLoading={loading}
        isEmpty={rows.length === 0}
        emptyTitle="No work schedules configured."
        emptyDescription="Define working days, hours, and overtime thresholds."
        emptyActionLabel={canManage ? 'Add schedule' : undefined}
        onEmptyAction={canManage ? openCreate : undefined}
        columnCount={6}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Working days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.startTime} – {row.endTime}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {row.workingDays.join(', ')}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status as EntityStatus} />
              </TableCell>
              <TableCell>
                {canManage ? <TableActions onEdit={() => openEdit(row)} /> : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit work schedule' : 'Add work schedule'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit(onSubmit)}>
              {editingId ? 'Save changes' : 'Create schedule'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" {...register('name', { required: true })} />
            <Input label="Code" {...register('code', { required: true })} />
            <Input label="Start time" type="time" {...register('startTime')} />
            <Input label="End time" type="time" {...register('endTime')} />
            <Input
              label="Grace period (minutes)"
              type="number"
              min={0}
              {...register('gracePeriodMinutes', { valueAsNumber: true })}
            />
            <Input
              label="Minimum working hours"
              type="number"
              step="0.5"
              min={0}
              {...register('minimumWorkingHours', { valueAsNumber: true })}
            />
            <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-surface-800 dark:text-surface-100">
              Working days
            </p>
            <div className="flex flex-wrap gap-3">
              {WEEKDAY_OPTIONS.map((day) => (
                <Checkbox
                  key={day.value}
                  label={day.label}
                  checked={workingDays?.includes(day.value as Weekday) ?? false}
                  onChange={() => toggleDay(day.value as Weekday)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Switch
              label="Break enabled"
              checked={breakEnabled}
              onCheckedChange={(v) => setValue('breakEnabled', v)}
            />
            {breakEnabled ? (
              <>
                <Input
                  label="Break duration (minutes)"
                  type="number"
                  min={0}
                  {...register('breakDurationMinutes', { valueAsNumber: true })}
                />
                <Switch
                  label="Flexible break"
                  checked={watch('flexibleBreak')}
                  onCheckedChange={(v) => setValue('flexibleBreak', v)}
                />
              </>
            ) : null}
            <Switch
              label="Overtime enabled"
              checked={overtimeEnabled}
              onCheckedChange={(v) => setValue('overtimeEnabled', v)}
            />
            {overtimeEnabled ? (
              <Input
                label="Minimum overtime (minutes)"
                type="number"
                min={0}
                {...register('minimumOvertimeMinutes', { valueAsNumber: true })}
              />
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  )
}
