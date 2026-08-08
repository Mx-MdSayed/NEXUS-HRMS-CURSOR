import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import {
  Button,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
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
import { AddressFormFields } from '../components/AddressFormFields'
import { getSettingsErrorMessage } from '../services/errors'
import { settingsService } from '../services/settingsService'
import type { CompanyLocation, EntityStatus } from '../types'
import { TIMEZONE_OPTIONS } from '../utils/nav'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

type LocationFormValues = Omit<CompanyLocation, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>

const emptyForm: LocationFormValues = {
  name: '',
  code: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  timezone: 'Asia/Kolkata',
  contactPerson: '',
  contactPhone: '',
  status: 'active',
}

export function LocationsSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.LOCATION_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [rows, setRows] = useState<CompanyLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const form = useForm<LocationFormValues>({ defaultValues: emptyForm })
  const { register, handleSubmit, reset } = form

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await settingsService.getLocations()
      setRows(data)
    } catch (err) {
      showError(getSettingsErrorMessage(err, 'Unable to load locations.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = statusFilter
    ? rows.filter((r) => r.status === statusFilter)
    : rows

  function openCreate() {
    setEditingId(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  function openEdit(row: CompanyLocation) {
    setEditingId(row.id)
    reset({
      name: row.name,
      code: row.code,
      addressLine1: row.addressLine1 ?? '',
      addressLine2: row.addressLine2 ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? '',
      postalCode: row.postalCode ?? '',
      timezone: row.timezone,
      contactPerson: row.contactPerson ?? '',
      contactPhone: row.contactPhone ?? '',
      status: row.status,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    reset(emptyForm)
  }

  async function onSubmit(values: LocationFormValues) {
    setSubmitting(true)
    try {
      if (editingId) {
        await settingsService.updateLocation(editingId, values)
        showSuccess('Location updated.')
      } else {
        await settingsService.createLocation(values)
        showSuccess('Location created.')
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
        title="Locations"
        description="Offices and work sites used across attendance and organization."
        breadcrumbs={[{ label: 'Home' }, { label: 'Settings', href: '/settings' }, { label: 'Locations' }]}
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add location
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
          className="w-48"
        />
      </div>

      <DataTable
        isLoading={loading}
        isEmpty={filtered.length === 0}
        emptyTitle="No locations configured."
        emptyDescription="Add offices and work sites for your organization."
        emptyActionLabel={canManage ? 'Add location' : undefined}
        onEmptyAction={canManage ? openCreate : undefined}
        columnCount={6}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.city ?? '—'}</TableCell>
              <TableCell>{row.timezone}</TableCell>
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
        title={editingId ? 'Edit location' : 'Add location'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit(onSubmit)}>
              {editingId ? 'Save changes' : 'Create location'}
            </Button>
          </>
        }
      >
        <FormProvider {...form}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name" {...register('name', { required: true })} />
              <Input label="Code" {...register('code', { required: true })} />
              <Input label="Contact person" {...register('contactPerson')} />
              <Input label="Contact phone" {...register('contactPhone')} />
              <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
              <Select
                label="Timezone"
                options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                {...register('timezone')}
              />
            </div>
            <AddressFormFields />
          </div>
        </FormProvider>
      </Modal>
    </div>
  )
}
