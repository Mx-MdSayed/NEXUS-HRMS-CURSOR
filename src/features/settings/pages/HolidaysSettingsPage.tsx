import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, getDaysInMonth, parseISO, startOfMonth } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
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
import type { CompanyHoliday, EntityStatus } from '../types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const TYPE_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'company', label: 'Company' },
  { value: 'optional', label: 'Optional' },
]

type HolidayFormValues = Omit<CompanyHoliday, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'locationName'>

const emptyForm: HolidayFormValues = {
  name: '',
  date: '',
  type: 'public',
  locationId: '',
  description: '',
  optional: false,
  status: 'active',
}

export function HolidaysSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.HOLIDAY_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [rows, setRows] = useState<CompanyHoliday[]>([])
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()))
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())

  const { register, handleSubmit, reset, watch, setValue } = useForm<HolidayFormValues>({
    defaultValues: emptyForm,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [holidays, locs] = await Promise.all([
        settingsService.getHolidays(),
        settingsService.getLocations(),
      ])
      setRows(holidays)
      setLocations(locs.map((l) => ({ id: l.id, name: l.name })))
    } catch (err) {
      showError(getSettingsErrorMessage(err, 'Unable to load holidays.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (yearFilter && !row.date.startsWith(yearFilter)) return false
      if (locationFilter && (row.locationId ?? '') !== locationFilter) return false
      if (typeFilter && row.type !== typeFilter) return false
      if (statusFilter && row.status !== statusFilter) return false
      return true
    })
  }, [rows, yearFilter, locationFilter, typeFilter, statusFilter])

  const calendarHolidays = useMemo(() => {
    const monthStart = new Date(Number(yearFilter), calendarMonth, 1)
    const prefix = format(monthStart, 'yyyy-MM')
    return filtered.filter((h) => h.date.startsWith(prefix))
  }, [filtered, yearFilter, calendarMonth])

  const yearOptions = useMemo(() => {
    const years = new Set(rows.map((r) => r.date.slice(0, 4)))
    years.add(String(new Date().getFullYear()))
    return Array.from(years)
      .sort()
      .map((y) => ({ value: y, label: y }))
  }, [rows])

  function openCreate() {
    setEditingId(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  function openEdit(row: CompanyHoliday) {
    setEditingId(row.id)
    reset({
      name: row.name,
      date: row.date,
      type: row.type,
      locationId: row.locationId ?? '',
      description: row.description ?? '',
      optional: row.optional,
      status: row.status,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    reset(emptyForm)
  }

  async function onSubmit(values: HolidayFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        locationId: values.locationId || undefined,
        description: values.description || undefined,
      }
      if (editingId) {
        await settingsService.updateHoliday(editingId, payload)
        showSuccess('Holiday updated.')
      } else {
        await settingsService.createHoliday(payload)
        showSuccess('Holiday created.')
      }
      closeModal()
      await load()
    } catch (err) {
      showError(getSettingsErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const monthDate = new Date(Number(yearFilter), calendarMonth, 1)
  const daysInMonth = getDaysInMonth(monthDate)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holidays"
        description="Public, company, and optional holidays by location."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Holidays' }]}
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add holiday
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          options={yearOptions}
          className="w-32"
        />
        <Select
          label="Location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          options={[
            { value: '', label: 'All locations' },
            ...locations.map((l) => ({ value: l.id, label: l.name })),
          ]}
          className="w-48"
        />
        <Select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[{ value: '', label: 'All types' }, ...TYPE_OPTIONS]}
          className="w-40"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
          className="w-40"
        />
      </div>

      <Card className="border-surface-200 dark:border-surface-700">
        <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">
            {format(monthDate, 'MMMM yyyy')}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCalendarMonth((m) => Math.max(0, m - 1))}
              disabled={calendarMonth === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCalendarMonth((m) => Math.min(11, m + 1))}
              disabled={calendarMonth === 11}
            >
              Next
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 p-4 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1 font-medium text-surface-500">{d}</div>
          ))}
          {Array.from({ length: startOfMonth(monthDate).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = format(new Date(Number(yearFilter), calendarMonth, day), 'yyyy-MM-dd')
            const dayHolidays = calendarHolidays.filter((h) => h.date === dateStr)
            return (
              <div
                key={day}
                className={`rounded-lg border p-1 min-h-[48px] ${
                  dayHolidays.length
                    ? 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40'
                    : 'border-surface-100 dark:border-surface-800'
                }`}
              >
                <span className="text-surface-700 dark:text-surface-200">{day}</span>
                {dayHolidays.map((h) => (
                  <p key={h.id} className="mt-0.5 truncate text-[10px] text-brand-800 dark:text-brand-200">
                    {h.name}
                  </p>
                ))}
              </div>
            )
          })}
        </div>
        </CardContent>
      </Card>

      <DataTable
        isLoading={loading}
        isEmpty={filtered.length === 0}
        emptyTitle="No holidays configured."
        emptyDescription="Add public and company holidays for leave and attendance."
        emptyActionLabel={canManage ? 'Add holiday' : undefined}
        onEmptyAction={canManage ? openCreate : undefined}
        columnCount={6}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{format(parseISO(row.date), 'dd MMM yyyy')}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.locationName ?? 'All'}</TableCell>
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
        title={editingId ? 'Edit holiday' : 'Add holiday'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit(onSubmit)}>
              {editingId ? 'Save changes' : 'Create holiday'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" {...register('name', { required: true })} />
          <Input label="Date" type="date" {...register('date', { required: true })} />
          <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
          <Select
            label="Location"
            value={watch('locationId') ?? ''}
            onChange={(e) => setValue('locationId', e.target.value)}
            options={[
              { value: '', label: 'All locations' },
              ...locations.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          <Input label="Description" {...register('description')} />
          <Switch
            label="Optional holiday"
            checked={watch('optional')}
            onCheckedChange={(v) => setValue('optional', v)}
          />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        </div>
      </Modal>
    </div>
  )
}