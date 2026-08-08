import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Card, CardContent, ConfirmDialog, ErrorState, Input, PageHeader, PageLoader, Select, StatusBadge } from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { getEffectivePermissions } from '@/features/access-control/services/roleService'
import { showError, showSuccess } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { useAccessActor } from '../hooks/useAccessActor'
import { getAccessControlErrorMessage } from '../services/errors'
import { roleService } from '../services/roleService'
import { userManagementService } from '../services/userManagementService'
import type { ManagedUser, RoleDefinition } from '../types'

interface FormValues {
  email: string
  username: string
  roleId: string
  status: ManagedUser['status']
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const actor = useAccessActor()
  const [user, setUser] = useState<ManagedUser | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void userManagementService
      .getUser(id, actor)
      .then((row) => setUser(row))
      .catch((err) => setError(getAccessControlErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [actor, id])

  if (isLoading) return <PageLoader label="Loading user" />
  if (error || !user) return <ErrorState title="Unable to load user" message={error || 'User not found.'} />

  const permissions = getEffectivePermissions(user)

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description="User profile, role assignment, and effective permissions summary."
        breadcrumbs={[{ label: 'Home' }, { label: 'Users', href: '/users' }, { label: user.name }]}
        actions={
          <Link to={`/users/${user.id}/edit`}>
            <Button>Edit User</Button>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 text-sm">
            <h2 className="text-card-title">Account</h2>
            <p><span className="text-surface-500">Email:</span> {user.email}</p>
            <p><span className="text-surface-500">Username:</span> {user.username ?? '—'}</p>
            <p><span className="text-surface-500">Employee ID:</span> {user.employeeCode ?? user.employeeId ?? '—'}</p>
            <p><span className="text-surface-500">Department:</span> {user.departmentName ?? '—'}</p>
            <p><span className="text-surface-500">Designation:</span> {user.designationName ?? '—'}</p>
            <p><span className="text-surface-500">Role:</span> {user.roleName}</p>
            <p className="flex items-center gap-2"><span className="text-surface-500">Status:</span> <StatusBadge status={user.status as never} /></p>
            <p><span className="text-surface-500">Last login:</span> {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</p>
            <p><span className="text-surface-500">Created:</span> {formatDate(user.createdAt)}</p>
            {user.suspendedReason ? <p><span className="text-surface-500">Suspension reason:</span> {user.suspendedReason}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-3 text-card-title">Effective permissions ({permissions.length})</h2>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-800">
              <ul className="divide-y divide-surface-100 text-sm dark:divide-surface-800">
                {permissions.map((permission) => (
                  <li key={permission} className="px-3 py-2 font-mono text-xs">{permission}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function UserEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const actor = useAccessActor()
  const [user, setUser] = useState<ManagedUser | null>(null)
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [confirmElevate, setConfirmElevate] = useState(false)
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null)
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>()

  useEffect(() => {
    void Promise.all([userManagementService.getUser(id, actor), roleService.listRoles({ status: 'active' })]).then(
      ([row, roleRows]) => {
        if (!row) return
        setUser(row)
        setRoles(roleRows)
        reset({
          email: row.email,
          username: row.username ?? '',
          roleId: row.roleId,
          status: row.status,
        })
      },
    )
  }, [actor, id, reset])

  const save = async (values: FormValues) => {
    if (!user) return
    try {
      await userManagementService.updateUser(
        user.id,
        {
          email: values.email,
          username: values.username,
          roleId: values.roleId,
          status: values.status,
        },
        actor,
      )
      showSuccess('User updated successfully.')
      navigate(`/users/${user.id}`)
    } catch (error) {
      showError(getAccessControlErrorMessage(error))
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    const nextRole = roles.find((role) => role.id === values.roleId)
    const elevating =
      user.role === ROLES.EMPLOYEE &&
      nextRole &&
      (nextRole.systemRole === ROLES.HR_ADMIN ||
        nextRole.systemRole === ROLES.HR_MANAGER ||
        nextRole.systemRole === ROLES.SUPER_ADMIN)
    if (elevating) {
      setPendingValues(values)
      setConfirmElevate(true)
      return
    }
    await save(values)
  })

  if (!user) return <PageLoader label="Loading user" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${user.name}`}
        description="Update email, username, role, and account status. Employee ID cannot be edited here."
        breadcrumbs={[{ label: 'Home' }, { label: 'Users', href: '/users' }, { label: user.name, href: `/users/${user.id}` }, { label: 'Edit' }]}
      />
      <Card className="max-w-2xl">
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input label="Employee ID" value={user.employeeCode ?? user.employeeId ?? ''} disabled />
            <Input label="Email" {...register('email', { required: true })} />
            <Input label="Username" {...register('username')} />
            <Select
              label="Role"
              value={watch('roleId')}
              onChange={(event) => setValue('roleId', event.target.value)}
              options={roles.map((role) => ({ label: role.name, value: role.id }))}
            />
            <Select
              label="Status"
              value={watch('status')}
              onChange={(event) => setValue('status', event.target.value as FormValues['status'])}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Pending', value: 'pending' },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await userManagementService.resetPasswordFoundation(user.id, actor)
                    showSuccess('Password reset initiated. User must change password on next login.')
                  } catch (error) {
                    showError(getAccessControlErrorMessage(error))
                  }
                }}
              >
                Reset Password
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(`/users/${user.id}`)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmElevate}
        title="You are granting elevated HR access. Continue?"
        description="This changes an Employee account to an elevated management role."
        confirmLabel="Grant access"
        tone="danger"
        onClose={() => {
          setConfirmElevate(false)
          setPendingValues(null)
        }}
        onConfirm={() => {
          setConfirmElevate(false)
          if (pendingValues) void save(pendingValues)
        }}
      />
    </div>
  )
}
