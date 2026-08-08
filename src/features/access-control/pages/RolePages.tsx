import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Copy, Download, Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { DANGEROUS_PERMISSIONS } from '@/constants/permissions'
import type { PermissionName } from '@/types'
import { showError, showSuccess } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { Can } from '../components/Can'
import { PERMISSION_CATALOG, PERMISSION_MODULES } from '../data/permissionCatalog'
import { useAccessActor } from '../hooks/useAccessActor'
import { getAccessControlErrorMessage } from '../services/errors'
import {
  applyPermissionDependencies,
  describeRoleCapabilities,
  roleService,
} from '../services/roleService'
import { userManagementService } from '../services/userManagementService'
import type { RoleDefinition, RoleFormInput } from '../types'
import { exportRolesToCsv } from '../utils/exportCsv'

export function RoleListPage() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [search, setSearch] = useState('')
  const [systemFilter, setSystemFilter] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    void roleService
      .listRoles({
        search,
        status: status || undefined,
        systemOnly: systemFilter === '' ? undefined : systemFilter === 'system',
      })
      .then(setRoles)
      .catch((err) => setError(getAccessControlErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [search, status, systemFilter])

  if (isLoading) return <PageLoader label="Loading roles" />
  if (error) return <ErrorState title="Unable to load roles" message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="System and custom roles with permission counts and assigned users."
        breadcrumbs={[{ label: 'Home' }, { label: 'Roles' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                exportRolesToCsv(
                  roles.map((role) => ({
                    name: role.name,
                    description: role.description,
                    userCount: userManagementService.countUsersByRoleId(role.id),
                    permissionCount: role.permissions.length,
                    status: role.status,
                  })),
                )
                showSuccess('Roles exported to CSV.')
              }}
            >
              Export
            </Button>
            <Can permission={['role.create', 'role.manage']}>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/roles/new')}>
                Create Role
              </Button>
            </Can>
          </div>
        }
      />
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search roles…"
        onReset={() => {
          setSearch('')
          setSystemFilter('')
          setStatus('')
        }}
        filters={
          <>
            <Select
              label="Type"
              value={systemFilter}
              onChange={(event) => setSystemFilter(event.target.value)}
              options={[
                { label: 'All', value: '' },
                { label: 'System roles', value: 'system' },
                { label: 'Custom roles', value: 'custom' },
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: 'All', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </>
        }
      />
      {roles.length === 0 ? (
        <EmptyState title="No roles found." description="Create a custom role to get started." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-950">
              <tr>
                <th className="px-4 py-3 text-left">Role Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Users</th>
                <th className="px-4 py-3 text-left">Permissions</th>
                <th className="px-4 py-3 text-left">System</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary-700 dark:text-primary-300" to={`/roles/${role.id}`}>
                      {role.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{role.description}</td>
                  <td className="px-4 py-3">{userManagementService.countUsersByRoleId(role.id)}</td>
                  <td className="px-4 py-3">{role.permissions.length}</td>
                  <td className="px-4 py-3">{role.isSystem ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3"><StatusBadge status={role.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/roles/${role.id}/edit`)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RolePermissionEditor({
  value,
  onChange,
}: {
  value: PermissionName[]
  onChange: (next: PermissionName[]) => void
}) {
  const [query, setQuery] = useState('')
  const selected = new Set(value)

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PERMISSION_MODULES.map((module) => ({
      module,
      items: PERMISSION_CATALOG.filter((item) => {
        if (item.module !== module) return false
        if (!q) return true
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.action.toLowerCase().includes(q)
        )
      }),
    })).filter((group) => group.items.length > 0)
  }, [query])

  const toggle = (code: PermissionName, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(code)
    else next.delete(code)
    onChange(applyPermissionDependencies(Array.from(next)))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input label="Search permissions" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange(applyPermissionDependencies(PERMISSION_CATALOG.map((item) => item.code)))}
        >
          Select All
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange([])}>
          Clear All
        </Button>
      </div>
      {grouped.map((group) => (
        <details key={group.module} open className="rounded-lg border border-surface-200 dark:border-surface-800">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-medium">
            <span>{group.module}</span>
            <span className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary-700"
                onClick={(event) => {
                  event.preventDefault()
                  const codes = group.items.map((item) => item.code)
                  onChange(applyPermissionDependencies([...new Set([...value, ...codes])]))
                }}
              >
                Select module
              </button>
              <button
                type="button"
                className="text-xs text-surface-500"
                onClick={(event) => {
                  event.preventDefault()
                  const remove = new Set(group.items.map((item) => item.code))
                  onChange(value.filter((code) => !remove.has(code)))
                }}
              >
                Clear module
              </button>
            </span>
          </summary>
          <div className="space-y-2 border-t border-surface-100 px-4 py-3 dark:border-surface-800">
            {group.items.map((item) => (
              <Checkbox
                key={item.id}
                label={item.name}
                description={`${item.code} — ${item.description}${
                  DANGEROUS_PERMISSIONS.includes(item.code)
                    ? ' Sensitive HR operation permission.'
                    : ''
                }`}
                checked={selected.has(item.code)}
                onChange={(event) => toggle(item.code, event.target.checked)}
              />
            ))}
          </div>
        </details>
      ))}
      <Card>
        <CardContent>
          <h3 className="mb-2 text-sm font-semibold">Users with this role can:</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-surface-600 dark:text-surface-300">
            {describeRoleCapabilities(value).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function RoleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const actor = useAccessActor()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [permissions, setPermissions] = useState<PermissionName[]>([])
  const [isSystem, setIsSystem] = useState(false)
  const [confirmDanger, setConfirmDanger] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit')

  useEffect(() => {
    if (mode !== 'edit') return
    void roleService.getRole(id).then((role) => {
      if (!role) return
      setName(role.name)
      setDescription(role.description)
      setStatus(role.status)
      setPermissions(role.permissions)
      setIsSystem(role.isSystem)
      setLoading(false)
    })
  }, [id, mode])

  const save = async () => {
    const input: RoleFormInput = {
      name,
      description,
      status,
      permissions: permissions as never,
    }
    try {
      if (mode === 'create') {
        const created = await roleService.createRole(input, actor)
        showSuccess('Role created successfully.')
        navigate(`/roles/${created.id}`)
      } else {
        const updated = await roleService.updateRole(id, input, actor)
        showSuccess('Permissions updated successfully.')
        navigate(`/roles/${updated.id}`)
      }
    } catch (error) {
      showError(getAccessControlErrorMessage(error))
    } finally {
      setPendingSave(false)
    }
  }

  if (loading) return <PageLoader label="Loading role" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create Role' : `Edit Role`}
        description="Assign grouped module permissions. Dependencies are applied automatically."
        breadcrumbs={[{ label: 'Home' }, { label: 'Roles', href: '/roles' }, { label: mode === 'create' ? 'Create' : 'Edit' }]}
      />
      <Card>
        <CardContent className="space-y-4">
          <Input label="Role name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSystem} />
          <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          {!isSystem ? (
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as 'active' | 'inactive')}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          ) : (
            <p className="text-sm text-surface-500">System roles cannot be renamed or permanently deleted.</p>
          )}
          <RolePermissionEditor value={permissions} onChange={setPermissions} />
          <div className="flex gap-2">
            <Button
              isLoading={pendingSave}
              onClick={() => {
                const grantsDanger = permissions.some((code) => DANGEROUS_PERMISSIONS.includes(code as never))
                if (grantsDanger) {
                  setConfirmDanger(true)
                  return
                }
                setPendingSave(true)
                void save()
              }}
            >
              Save Role
            </Button>
            <Button variant="secondary" onClick={() => navigate('/roles')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDanger}
        title="This permission provides access to sensitive HR operations."
        description="You are granting payroll, salary, user, or settings management permissions."
        confirmLabel="Grant permissions"
        tone="danger"
        onClose={() => setConfirmDanger(false)}
        onConfirm={() => {
          setConfirmDanger(false)
          setPendingSave(true)
          void save()
        }}
      />
    </div>
  )
}

export function RoleCreatePage() {
  return <RoleFormPage mode="create" />
}

export function RoleEditPage() {
  return <RoleFormPage mode="edit" />
}

export function RoleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const actor = useAccessActor()
  const [role, setRole] = useState<RoleDefinition | null>(null)
  const [users, setUsers] = useState<string[]>([])

  useEffect(() => {
    void roleService.getRole(id).then(async (row) => {
      setRole(row)
      if (!row) return
      const assigned = await userManagementService.listUsers({ roleId: row.id }, actor)
      setUsers(assigned.map((user) => user.name))
    })
  }, [actor, id])

  if (!role) return <PageLoader label="Loading role" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description={role.description}
        breadcrumbs={[{ label: 'Home' }, { label: 'Roles', href: '/roles' }, { label: role.name }]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={async () => {
              try {
                const copy = await roleService.duplicateRole(role.id, actor)
                showSuccess('Role duplicated successfully.')
                navigate(`/roles/${copy.id}/edit`)
              } catch (error) {
                showError(getAccessControlErrorMessage(error))
              }
            }}>
              Duplicate
            </Button>
            <Button onClick={() => navigate(`/roles/${role.id}/edit`)}>Edit</Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 text-sm">
            <p>System role: {role.isSystem ? 'Yes' : 'No'}</p>
            <p>Status: <StatusBadge status={role.status} /></p>
            <p>Created: {formatDate(role.createdAt)}</p>
            <p>Updated: {formatDate(role.updatedAt)}</p>
            <p>Permissions: {role.permissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-2 text-card-title">Assigned users</h2>
            {users.length === 0 ? (
              <p className="text-sm text-surface-500">No users assigned.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {users.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent>
          <h2 className="mb-3 text-card-title">Permissions</h2>
          <div className="flex flex-wrap gap-2">
            {role.permissions.map((permission) => (
              <span key={permission} className="rounded-md bg-surface-100 px-2 py-1 font-mono text-xs dark:bg-surface-800">
                {permission}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
