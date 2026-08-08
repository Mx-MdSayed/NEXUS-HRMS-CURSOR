import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Plus, Shield } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
  TableActions,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLE_LABELS, ROLE_LIST } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { Can } from '../components/Can'
import { useAccessActor } from '../hooks/useAccessActor'
import { getAccessControlErrorMessage } from '../services/errors'
import { userManagementService } from '../services/userManagementService'
import type { ManagedUser, UserListFilters } from '../types'
import { exportUsersToCsv } from '../utils/exportCsv'
import { showError, showSuccess } from '@/utils/toast'
import { formatDate } from '@/utils/date'

const defaultFilters: UserListFilters = {
  search: '',
  role: '',
  status: '',
}

export function UserListPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const actor = useAccessActor()
  const [rows, setRows] = useState<ManagedUser[]>([])
  const [filters, setFilters] = useState<UserListFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<{ user: ManagedUser; action: 'activate' | 'deactivate' | 'suspend' } | null>(
    null,
  )
  const [suspendReason, setSuspendReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setRows(await userManagementService.listUsers(filters, actor))
    } catch (err) {
      setError(getAccessControlErrorMessage(err))
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [actor, filters])

  useEffect(() => {
    void load()
  }, [load])

  const statusOptions = useMemo(
    () => [
      { label: 'All statuses', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Suspended', value: 'suspended' },
      { label: 'Pending', value: 'pending' },
    ],
    [],
  )

  const confirmAction = async () => {
    if (!pending) return
    setBusy(true)
    try {
      if (pending.action === 'suspend' && !suspendReason.trim()) {
        showError('Suspension reason is required.')
        return
      }
      const status =
        pending.action === 'activate' ? 'active' : pending.action === 'deactivate' ? 'inactive' : 'suspended'
      await userManagementService.setStatus(pending.user.id, status, actor, suspendReason.trim() || undefined)
      showSuccess(
        status === 'active'
          ? 'User activated successfully.'
          : status === 'suspended'
            ? 'User suspended successfully.'
            : 'User deactivated successfully.',
      )
      setPending(null)
      setSuspendReason('')
      await load()
    } catch (err) {
      showError(getAccessControlErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (isLoading && rows.length === 0) return <PageLoader label="Loading users" />
  if (error && rows.length === 0) return <ErrorState title="Unable to load users" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, activation, and employee mapping."
        breadcrumbs={[{ label: 'Home' }, { label: 'Users' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission={PERMISSIONS.USER_EXPORT}>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => {
                  exportUsersToCsv(rows)
                  showSuccess('Users exported to CSV.')
                }}
              >
                Export CSV
              </Button>
            </Can>
            <Can permission={[PERMISSIONS.USER_CREATE, PERMISSIONS.USER_MANAGE]}>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/users/new')}>
                Create User
              </Button>
            </Can>
          </div>
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search name, email, employee ID…"
        onReset={() => setFilters(defaultFilters)}
        filters={
          <>
            <Select
              label="Role"
              value={filters.role ?? ''}
              onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value as never }))}
              options={[
                { label: 'All roles', value: '' },
                ...ROLE_LIST.map((role) => ({ label: ROLE_LABELS[role], value: role })),
              ]}
            />
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as never }))}
              options={statusOptions}
            />
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No users found." description="Try adjusting filters or create a new user account." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-surface-800">
            <thead className="bg-surface-50 dark:bg-surface-950">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <Link to={`/users/${user.id}`} className="font-medium text-primary-700 dark:text-primary-300">
                      {user.name}
                    </Link>
                    <p className="text-xs text-surface-500">{user.username ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{user.employeeCode ?? user.employeeId ?? '—'}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.roleName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        user.status === 'invited'
                          ? 'pending'
                          : user.status === 'locked'
                            ? 'suspended'
                            : (user.status as 'active' | 'inactive' | 'pending' | 'suspended')
                      }
                    />
                  </td>
                  <td className="px-4 py-3">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</td>
                  <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <TableActions
                      onView={() => navigate(`/users/${user.id}`)}
                      onEdit={
                        hasPermission([PERMISSIONS.USER_EDIT, PERMISSIONS.USER_MANAGE])
                          ? () => navigate(`/users/${user.id}/edit`)
                          : undefined
                      }
                      moreItems={[
                        ...(hasPermission([PERMISSIONS.USER_EDIT, PERMISSIONS.USER_MANAGE]) && user.status !== 'active'
                          ? [{ id: 'activate', label: 'Activate', onClick: () => setPending({ user, action: 'activate' }) }]
                          : []),
                        ...(hasPermission([PERMISSIONS.USER_EDIT, PERMISSIONS.USER_MANAGE]) && user.status === 'active'
                          ? [
                              {
                                id: 'deactivate',
                                label: 'Deactivate',
                                onClick: () => setPending({ user, action: 'deactivate' }),
                              },
                              {
                                id: 'suspend',
                                label: 'Suspend',
                                danger: true,
                                onClick: () => setPending({ user, action: 'suspend' }),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending) && pending?.action !== 'suspend'}
        title={
          pending?.action === 'activate'
            ? 'Activate this user account?'
            : 'Deactivate this user account?'
        }
        description="Employee master data is not deleted."
        confirmLabel={pending?.action === 'activate' ? 'Activate' : 'Deactivate'}
        tone={pending?.action === 'activate' ? 'primary' : 'danger'}
        isLoading={busy}
        onConfirm={() => void confirmAction()}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending?.action === 'suspend'}
        title="Suspend this user account?"
        description={`Suspended users cannot sign in until reactivated.${suspendReason ? '' : ' Provide a reason in the next step by typing below before confirming — use the dedicated suspend flow.'}`}
        confirmLabel="Suspend"
        tone="danger"
        isLoading={busy}
        onConfirm={() => {
          if (!suspendReason.trim()) {
            showError('Suspension reason is required. Enter a reason, then confirm again.')
            return
          }
          void confirmAction()
        }}
        onClose={() => {
          setPending(null)
          setSuspendReason('')
        }}
      />

      {pending?.action === 'suspend' ? (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto max-w-lg rounded-xl border border-surface-200 bg-white p-4 shadow-elevated dark:border-surface-700 dark:bg-surface-900">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Suspension reason</span>
            <textarea
              className="w-full rounded-lg border border-surface-300 bg-white p-2 dark:border-surface-700 dark:bg-surface-950"
              rows={3}
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              aria-label="Suspension reason"
            />
          </label>
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-surface-500">
        <Shield className="h-4 w-4" />
        Super Admin lockout protection is enforced for status and role changes.
      </div>
    </div>
  )
}
