import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormGrid,
  FormSection,
  Input,
  PageHeader,
  PageLoader,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees'
import type { Employee } from '@/features/employees'
import { formatDate } from '@/utils/date'
import { formatRole } from '@/utils/status'
import { showError, showSuccess } from '@/utils/toast'

type PersonalFormValues = {
  personalEmail: string
  phone: string
  alternatePhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
  emergencyAlternatePhone: string
  emergencyAddress: string
}

export function ProfilePage() {
  const { user, hasPermission, hasRole } = useAuth()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departmentName, setDepartmentName] = useState('—')
  const [designationName, setDesignationName] = useState('—')
  const [loadingEmployee, setLoadingEmployee] = useState(true)
  const [saving, setSaving] = useState(false)
  const canEditProfile = hasPermission(PERMISSIONS.PROFILE_EDIT)
  const isEmployeeRole = hasRole(ROLES.EMPLOYEE)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonalFormValues>({
    defaultValues: {
      personalEmail: '',
      phone: '',
      alternatePhone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      emergencyAlternatePhone: '',
      emergencyAddress: '',
    },
  })

  useEffect(() => {
    if (!user?.email) {
      setLoadingEmployee(false)
      return
    }
    let active = true
    setLoadingEmployee(true)
    void employeeService
      .getEmployeeByEmail(user.email)
      .then((record) => {
        if (!active) return
        setEmployee(record)
        if (record) {
          const emergency = record.emergencyContacts[0]
          reset({
            personalEmail: record.personalEmail ?? '',
            phone: record.phone,
            alternatePhone: record.alternatePhone ?? '',
            addressLine1: record.address.line1,
            addressLine2: record.address.line2 ?? '',
            city: record.address.city,
            state: record.address.state,
            country: record.address.country,
            postalCode: record.address.postalCode,
            emergencyName: emergency?.name ?? '',
            emergencyRelationship: emergency?.relationship ?? '',
            emergencyPhone: emergency?.phone ?? '',
            emergencyAlternatePhone: emergency?.alternatePhone ?? '',
            emergencyAddress: emergency?.address ?? '',
          })
          void Promise.all([
            employeeService.getDepartments(),
            employeeService.getDesignations(),
          ]).then(([departments, designations]) => {
            if (!active) return
            setDepartmentName(
              departments.find((item) => item.id === record.departmentId)?.name ?? '—',
            )
            setDesignationName(
              designations.find((item) => item.id === record.designationId)?.name ?? '—',
            )
          })
        }
      })
      .finally(() => {
        if (active) setLoadingEmployee(false)
      })
    return () => {
      active = false
    }
  }, [reset, user?.email])

  if (!user) return null
  if (loadingEmployee) return <PageLoader label="Loading profile" />

  const onSavePersonal = async (values: PersonalFormValues) => {
    if (!employee || !canEditProfile) return
    setSaving(true)
    try {
      const updated = await employeeService.updateOwnPersonalInfo(
        employee.id,
        values,
        user.name,
      )
      setEmployee(updated)
      showSuccess('Profile updated successfully.')
    } catch {
      showError('Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description={
          isEmployeeRole
            ? 'View and update your personal employee information.'
            : 'Your authenticated account profile.'
        }
        breadcrumbs={[{ label: 'Home' }, { label: 'My Profile' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/change-password')}>
            Change Password
          </Button>
        }
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={employee?.profilePhoto ?? user.avatarUrl} size="lg" />
            <div>
              <CardTitle>{employee?.fullName ?? user.name}</CardTitle>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="neutral">{formatRole(user.role)}</Badge>
                {employee ? <StatusBadge status={employee.employmentStatus} /> : null}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Role</p>
            <p className="mt-1 text-sm font-medium">{formatRole(user.role)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Employee ID</p>
            <p className="mt-1 text-sm font-medium">
              {employee?.employeeCode ?? user.employeeId ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Department</p>
            <p className="mt-1 text-sm font-medium">{employee ? departmentName : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Designation</p>
            <p className="mt-1 text-sm font-medium">{employee ? designationName : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Joining Date</p>
            <p className="mt-1 text-sm font-medium">
              {employee?.joiningDate ? formatDate(employee.joiningDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Last login</p>
            <p className="mt-1 text-sm font-medium">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-surface-500">Member since</p>
            <p className="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {employee && canEditProfile ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit(onSavePersonal)} className="space-y-6">
              <FormSection title="Contact" description="Employees can update allowed personal fields only.">
                <FormGrid columns={2}>
                  <Input
                    label="Personal Email"
                    type="email"
                    error={errors.personalEmail?.message}
                    {...register('personalEmail', {
                      pattern: {
                        value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                  <Input
                    label="Phone"
                    requiredMark
                    error={errors.phone?.message}
                    {...register('phone', {
                      required: 'Phone is required',
                      minLength: { value: 8, message: 'Enter a valid phone number' },
                    })}
                  />
                  <Input label="Alternate Phone" {...register('alternatePhone')} />
                </FormGrid>
              </FormSection>

              <FormSection title="Address">
                <FormGrid columns={2}>
                  <div className="md:col-span-2">
                    <Input label="Address" {...register('addressLine1')} />
                  </div>
                  <Input label="Address Line 2" {...register('addressLine2')} />
                  <Input label="City" {...register('city')} />
                  <Input label="State" {...register('state')} />
                  <Input label="Country" {...register('country')} />
                  <Input label="Postal Code" {...register('postalCode')} />
                </FormGrid>
              </FormSection>

              <FormSection title="Emergency Contact">
                <FormGrid columns={2}>
                  <Input label="Contact Name" {...register('emergencyName')} />
                  <Input label="Relationship" {...register('emergencyRelationship')} />
                  <Input label="Phone" {...register('emergencyPhone')} />
                  <Input label="Alternate Phone" {...register('emergencyAlternatePhone')} />
                  <div className="md:col-span-2">
                    <Textarea label="Address" rows={2} {...register('emergencyAddress')} />
                  </div>
                </FormGrid>
              </FormSection>

              <div className="flex justify-end">
                <Button type="submit" isLoading={saving}>
                  Save personal details
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      ) : null}

      {employee && isEmployeeRole ? (
        <p className="max-w-3xl text-sm text-surface-500">
          Employment, KYC, and banking details are managed by HR. The employee directory is not
          available for your role.
        </p>
      ) : null}
    </div>
  )
}
