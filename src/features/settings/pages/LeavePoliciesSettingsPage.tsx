import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import {
  Button,
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
import type { EntityStatus, LeavePolicyDefinition } from '../types'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const ASSIGNMENT_OPTIONS = [
  { value: 'all', label: 'All employees' },
  { value: 'department', label: 'Department' },
  { value: 'employee', label: 'Specific employee' },
]

type PolicyFormValues = Omit<
  LeavePolicyDefinition,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>

const emptyForm: PolicyFormValues = {
  name: '',
  leaveTypeCode: '',
  leaveTypeName: '',
  annualAllocation: 0,
  monthlyAccrualEnabled: false,
  monthlyAccrualDays: 0,
  carryForwardEnabled: false,
  carryForwardLimit: 0,
  minimumNoticeDays: 0,
  maximumConsecutiveDays: 0,
  requiresApproval: true,
  requiresDocument: false,
  halfDayAllowed: true,
  assignment: 'all',
  assignmentTargetId: '',
  status: 'active',
}

export function LeavePoliciesSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.LEAVE_POLICY_MANAGE) || hasPermission(PERMISSIONS.SETTINGS_MANAGE)

  const [rows, setRows] = useState<LeavePolicyDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm<PolicyFormValues>({
    defaultValues: emptyForm,
  })

  const monthlyAccrualEnabled = watch('monthlyAccrualEnabled')
  const carryForwardEnabled = watch('carryForwardEnabled')
  const assignment = watch('assignment')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await settingsService.getLeavePolicies()
      setRows(data)
    } catch (err) {
      showError(getSettingsErrorMessage(err, 'Unable to load leave policies.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditingId(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  function openEdit(row: LeavePolicyDefinition) {
    setEditingId(row.id)
    reset({
      name: row.name,
      leaveTypeCode: row.leaveTypeCode,
      leaveTypeName: row.leaveTypeName,
      annualAllocation: row.annualAllocation,
      monthlyAccrualEnabled: row.monthlyAccrualEnabled,
      monthlyAccrualDays: row.monthlyAccrualDays,
      carryForwardEnabled: row.carryForwardEnabled,
      carryForwardLimit: row.carryForwardLimit,
      minimumNoticeDays: row.minimumNoticeDays,
      maximumConsecutiveDays: row.maximumConsecutiveDays,
      requiresApproval: row.requiresApproval,
      requiresDocument: row.requiresDocument,
      halfDayAllowed: row.halfDayAllowed,
      assignment: row.assignment,
      assignmentTargetId: row.assignmentTargetId ?? '',
      status: row.status,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    reset(emptyForm)
  }

  async function onSubmit(values: PolicyFormValues) {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        assignmentTargetId: values.assignmentTargetId || undefined,
      }
      if (editingId) {
        await settingsService.updateLeavePolicy(editingId, payload)
        showSuccess('Leave policy updated.')
      } else {
        await settingsService.createLeavePolicy(payload)
        showSuccess('Leave policy created.')
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
        title="Leave Policies"
        description="Allocations, accrual, carry forward, and approval rules."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Settings', href: '/settings' },
          { label: 'Leave Policies' },
        ]}
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add policy
            </Button>
          ) : null
        }
      />

      <DataTable
        isLoading={loading}
        isEmpty={rows.length === 0}
        emptyTitle="No leave policies configured."
        emptyDescription="Define leave types, allocations, and approval requirements."
        emptyActionLabel={canManage ? 'Add policy' : undefined}
        onEmptyAction={canManage ? openCreate : undefined}
        columnCount={6}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Leave type</TableHead>
            <TableHead>Annual days</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.leaveTypeName}</TableCell>
              <TableCell>{row.annualAllocation}</TableCell>
              <TableCell>{row.assignment}</TableCell>
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
        title={editingId ? 'Edit leave policy' : 'Add leave policy'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit(onSubmit)}>
              {editingId ? 'Save changes' : 'Create policy'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Policy name" {...register('name', { required: true })} />
            <Input label="Leave type code" {...register('leaveTypeCode', { required: true })} />
            <Input label="Leave type name" {...register('leaveTypeName', { required: true })} />
            <Input
              label="Annual allocation (days)"
              type="number"
              min={0}
              {...register('annualAllocation', { valueAsNumber: true })}
            />
            <Input
              label="Minimum notice (days)"
              type="number"
              min={0}
              {...register('minimumNoticeDays', { valueAsNumber: true })}
            />
            <Input
              label="Max consecutive days"
              type="number"
              min={0}
              {...register('maximumConsecutiveDays', { valueAsNumber: true })}
            />
            <Select label="Assignment" options={ASSIGNMENT_OPTIONS} {...register('assignment')} />
            {assignment !== 'all' ? (
              <Input
                label="Assignment target ID"
                {...register('assignmentTargetId')}
                hint="Department or employee ID"
              />
            ) : null}
            <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Switch
              label="Monthly accrual"
              checked={monthlyAccrualEnabled}
              onCheckedChange={(v) => setValue('monthlyAccrualEnabled', v)}
            />
            {monthlyAccrualEnabled ? (
              <Input
                label="Monthly accrual days"
                type="number"
                step="0.5"
                min={0}
                {...register('monthlyAccrualDays', { valueAsNumber: true })}
              />
            ) : null}
            <Switch
              label="Carry forward"
              checked={carryForwardEnabled}
              onCheckedChange={(v) => setValue('carryForwardEnabled', v)}
            />
            {carryForwardEnabled ? (
              <Input
                label="Carry forward limit"
                type="number"
                min={0}
                {...register('carryForwardLimit', { valueAsNumber: true })}
              />
            ) : null}
            <Switch
              label="Requires approval"
              checked={watch('requiresApproval')}
              onCheckedChange={(v) => setValue('requiresApproval', v)}
            />
            <Switch
              label="Requires document"
              checked={watch('requiresDocument')}
              onCheckedChange={(v) => setValue('requiresDocument', v)}
            />
            <Switch
              label="Half day allowed"
              checked={watch('halfDayAllowed')}
              onCheckedChange={(v) => setValue('halfDayAllowed', v)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
