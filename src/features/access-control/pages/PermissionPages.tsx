import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardContent, EmptyState, Input, PageHeader, PageLoader, Switch } from '@/components/ui'
import { ROLE_LABELS, ROLE_LIST, SYSTEM_ROLE_IDS } from '@/constants/roles'
import { getPermissionsForRole } from '@/constants/rbac'
import type { PermissionName, RoleName } from '@/types'
import { showError, showSuccess } from '@/utils/toast'
import { PERMISSION_CATALOG, PERMISSION_MODULES } from '../data/permissionCatalog'
import { useAccessActor } from '../hooks/useAccessActor'
import { getAccessControlErrorMessage } from '../services/errors'
import { applyPermissionDependencies, roleService } from '../services/roleService'
import type { RoleDefinition } from '../types'

export function PermissionsPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PERMISSION_CATALOG
    return PERMISSION_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="System permission catalog organized by module and action."
        breadcrumbs={[{ label: 'Home' }, { label: 'Permissions' }]}
        actions={
          <Link to="/permissions/matrix">
            <Button variant="secondary">Permission Matrix</Button>
          </Link>
        }
      />
      <Input label="Search permissions" value={query} onChange={(event) => setQuery(event.target.value)} />
      {filtered.length === 0 ? (
        <EmptyState title="No permissions found." description="Try another search term." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-950">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Module</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-surface-100 dark:border-surface-800">
                  <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.module}</td>
                  <td className="px-4 py-3">{item.action}</td>
                  <td className="px-4 py-3 text-surface-500">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function PermissionMatrixPage() {
  const actor = useAccessActor()
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [matrix, setMatrix] = useState<Record<string, Set<PermissionName>>>({})
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void roleService.listRoles({ status: 'active' }).then((rows) => {
      const systemRoles = rows.filter((role) => role.isSystem && role.systemRole)
      setRoles(systemRoles)
      const next: Record<string, Set<PermissionName>> = {}
      for (const role of systemRoles) {
        next[role.id] = new Set(role.permissions)
      }
      setMatrix(next)
      setLoading(false)
    })
  }, [])

  const permissions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PERMISSION_CATALOG.filter((item) => {
      if (!q) return true
      return item.code.includes(q) || item.name.toLowerCase().includes(q) || item.module.toLowerCase().includes(q)
    })
  }, [query])

  const toggle = (roleId: string, permission: PermissionName, enabled: boolean) => {
    setMatrix((prev) => {
      const current = new Set(prev[roleId] ?? [])
      if (enabled) current.add(permission)
      else current.delete(permission)
      return { ...prev, [roleId]: new Set(applyPermissionDependencies(Array.from(current))) }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      for (const role of roles) {
        await roleService.updateRole(
          role.id,
          {
            name: role.name,
            description: role.description,
            status: role.status,
            permissions: Array.from(matrix[role.id] ?? []),
            scopes: role.scopes,
          },
          actor,
        )
      }
      showSuccess('Permissions updated successfully.')
    } catch (error) {
      showError(getAccessControlErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader label="Loading permission matrix" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Matrix"
        description="Rows are permissions. Columns are system roles. Horizontal scroll on smaller screens."
        breadcrumbs={[{ label: 'Home' }, { label: 'Permissions', href: '/permissions' }, { label: 'Matrix' }]}
        actions={
          <Button isLoading={saving} onClick={() => void save()}>
            Save Matrix
          </Button>
        }
      />
      <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        <table className="min-w-max text-sm">
          <thead className="bg-surface-50 dark:bg-surface-950">
            <tr>
              <th className="sticky left-0 z-10 bg-surface-50 px-4 py-3 text-left dark:bg-surface-950">Permission</th>
              {roles.map((role) => (
                <th key={role.id} className="px-4 py-3 text-center">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.flatMap((module) => {
              const moduleRows = permissions.filter((item) => item.module === module)
              if (moduleRows.length === 0) return []
              return [
                <tr key={`module-${module}`} className="bg-surface-50/80 dark:bg-surface-950/80">
                  <td className="sticky left-0 px-4 py-2 font-semibold" colSpan={roles.length + 1}>
                    {module}
                  </td>
                </tr>,
                ...moduleRows.map((permission) => (
                  <tr key={permission.id} className="border-t border-surface-100 dark:border-surface-800">
                    <td className="sticky left-0 bg-white px-4 py-2 dark:bg-surface-900">
                      <div className="font-mono text-xs">{permission.code}</div>
                      <div className="text-xs text-surface-500">{permission.name}</div>
                    </td>
                    {roles.map((role) => (
                      <td key={`${role.id}-${permission.code}`} className="px-4 py-2 text-center">
                        <Switch
                          checked={matrix[role.id]?.has(permission.code) ?? false}
                          onCheckedChange={(checked) => toggle(role.id, permission.code, checked)}
                          aria-label={`${role.name} ${permission.code}`}
                        />
                      </td>
                    ))}
                  </tr>
                )),
              ]
            })}
          </tbody>
        </table>
      </div>
      <Card>
        <CardContent className="text-sm text-surface-500">
          Default scopes: Employee = Own, Manager = Team, HR Manager = Department, HR/Super Admin = All.
          Current defaults for system roles still come from `{ROLE_LIST.map((role) => ROLE_LABELS[role]).join(', ')}`
          (`{SYSTEM_ROLE_IDS.employee}` etc.). Effective count example for Employee: {getPermissionsForRole('employee' as RoleName).length}.
        </CardContent>
      </Card>
    </div>
  )
}
