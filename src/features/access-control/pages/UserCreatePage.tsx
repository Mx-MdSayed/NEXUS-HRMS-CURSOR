import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Card, CardContent, Input, PageHeader, Select } from '@/components/ui'
import { SYSTEM_ROLE_IDS } from '@/constants/roles'
import { employeeService } from '@/features/employees/services/employeeService'
import type { EmployeeListItem } from '@/features/employees/types'
import { showError, showSuccess } from '@/utils/toast'
import { useAccessActor } from '../hooks/useAccessActor'
import { getAccessControlErrorMessage } from '../services/errors'
import { roleService } from '../services/roleService'
import { userManagementService } from '../services/userManagementService'
import type { RoleDefinition } from '../types'

interface FormValues {
  employeeRecordId: string
  email: string
  username: string
  roleId: string
  status: 'active' | 'pending'
  temporaryPassword: string
}

export function UserCreatePage() {
  const navigate = useNavigate()
  const actor = useAccessActor()
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [existingMessage, setExistingMessage] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<FormValues>({
    defaultValues: {
      employeeRecordId: '',
      email: '',
      username: '',
      roleId: SYSTEM_ROLE_IDS.employee,
      status: 'pending',
      temporaryPassword: 'TempPass123!',
    },
  })

  const employeeRecordId = watch('employeeRecordId')

  useEffect(() => {
    void employeeService.getEmployees({ page: 1, pageSize: 200, sortBy: 'fullName' }).then((result) => {
      setEmployees(result.data.filter((item) => item.employmentStatus !== 'terminated'))
    })
    void roleService.listRoles({ status: 'active' }).then(setRoles)
  }, [])

  useEffect(() => {
    const employee = employees.find((item) => item.id === employeeRecordId)
    if (!employee) {
      setExistingMessage('')
      return
    }
    setValue('email', employee.email)
    setValue('username', employee.email.split('@')[0] ?? '')
    const existing = userManagementService.getActiveUserForEmployee(employee.id)
    setExistingMessage(existing ? 'User account already exists.' : '')
  }, [employeeRecordId, employees, setValue])

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === employeeRecordId),
    [employeeRecordId, employees],
  )

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedEmployee) {
      showError('Select an employee.')
      return
    }
    if (existingMessage) {
      showError(existingMessage)
      return
    }
    try {
      const created = await userManagementService.createUser(
        {
          employeeRecordId: selectedEmployee.id,
          email: values.email,
          username: values.username,
          roleId: values.roleId,
          status: values.status,
          temporaryPassword: values.temporaryPassword,
          mustChangePassword: true,
        },
        actor,
        {
          id: selectedEmployee.id,
          employeeCode: selectedEmployee.employeeCode,
          firstName: selectedEmployee.fullName.split(' ')[0] ?? selectedEmployee.fullName,
          lastName: selectedEmployee.fullName.split(' ').slice(1).join(' ') || selectedEmployee.fullName,
          fullName: selectedEmployee.fullName,
          email: selectedEmployee.email,
          departmentId: selectedEmployee.departmentId,
          departmentName: selectedEmployee.departmentName,
          designationId: selectedEmployee.designationId,
          designationName: selectedEmployee.designationName,
        },
      )
      showSuccess('User created successfully.')
      navigate(`/users/${created.id}`)
    } catch (error) {
      showError(getAccessControlErrorMessage(error))
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create User"
        description="Map an employee to a login account and assign a default Employee role unless elevated."
        breadcrumbs={[{ label: 'Home' }, { label: 'Users', href: '/users' }, { label: 'Create' }]}
      />
      <Card className="max-w-3xl">
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Select
              label="Employee"
              value={employeeRecordId}
              onChange={(event) => setValue('employeeRecordId', event.target.value)}
              options={[
                { label: 'Select employee', value: '' },
                ...employees.map((employee) => ({
                  label: `${employee.fullName} (${employee.employeeCode})`,
                  value: employee.id,
                })),
              ]}
            />
            {existingMessage ? <p className="text-sm text-danger-600">{existingMessage}</p> : null}
            {selectedEmployee ? (
              <div className="rounded-lg border border-surface-200 p-3 text-sm dark:border-surface-800">
                <p>{selectedEmployee.departmentName} · {selectedEmployee.designationName}</p>
                <p className="text-surface-500">Employee ID: {selectedEmployee.employeeCode}</p>
              </div>
            ) : null}
            <Input label="Email" {...register('email', { required: 'Email is required' })} error={errors.email?.message} />
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
                { label: 'Pending', value: 'pending' },
                { label: 'Active', value: 'active' },
              ]}
            />
            <Input
              label="Temporary password"
              type="text"
              {...register('temporaryPassword', { required: 'Temporary password is required' })}
              error={errors.temporaryPassword?.message}
            />
            <p className="text-xs text-surface-500">User must change password on first login.</p>
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitting} disabled={Boolean(existingMessage)}>
                Create Account
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
