import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  DateInput,
  Form,
  FormGrid,
  FormSection,
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import {
  ACCOUNT_TYPE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from '../constants'
import { employeeService } from '../services/employeeService'
import type {
  DepartmentOption,
  DesignationOption,
  EmployeeFormValues,
  EmployeeListItem,
} from '../types'
import {
  getDepartmentByIdSync,
  getDesignationByIdSync,
} from '@/features/organization/data/orgDb'

const defaultValues: EmployeeFormValues = {
  employeeCode: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  personalEmail: '',
  phone: '',
  alternatePhone: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: 'Indian',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  departmentId: '',
  designationId: '',
  reportingManagerId: '',
  joiningDate: '',
  confirmationDate: '',
  employmentType: 'full_time',
  employmentStatus: 'active',
  workLocation: '',
  shift: 'General',
  salaryCurrency: 'INR',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  emergencyAlternatePhone: '',
  emergencyAddress: '',
  nationalId: '',
  taxId: '',
  passportNumber: '',
  passportExpiry: '',
  drivingLicense: '',
  otherId: '',
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  swift: '',
  branchName: '',
  accountType: '',
}

export function EmployeeForm({
  mode,
  initialValues,
  currentEmployeeId,
  onSubmit,
  isSubmitting,
}: {
  mode: 'create' | 'edit'
  initialValues?: EmployeeFormValues
  currentEmployeeId?: string
  onSubmit: (values: EmployeeFormValues) => Promise<void>
  isSubmitting?: boolean
}) {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [managers, setManagers] = useState<EmployeeListItem[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    defaultValues: initialValues ?? defaultValues,
  })

  const departmentId = watch('departmentId')

  useEffect(() => {
    if (initialValues) reset(initialValues)
  }, [initialValues, reset])

  useEffect(() => {
    void employeeService.getDepartments().then((items) => {
      const currentId = initialValues?.departmentId
      if (currentId && !items.some((item) => item.id === currentId)) {
        const current = getDepartmentByIdSync(currentId)
        if (current) {
          items = [
            ...items,
            {
              id: current.id,
              name: `${current.name} (inactive)`,
              code: current.code,
              isActive: false,
            },
          ]
        }
      }
      setDepartments(items)
    })
    void employeeService
      .getEmployees({ page: 1, pageSize: 100, sortBy: 'fullName' })
      .then((result) =>
        setManagers(result.data.filter((item) => item.id !== currentEmployeeId)),
      )
  }, [currentEmployeeId, initialValues?.departmentId])

  useEffect(() => {
    void employeeService.getDesignations(departmentId || undefined).then((items) => {
      const currentDesignation = watch('designationId')
      if (
        currentDesignation &&
        departmentId &&
        !items.some((item) => item.id === currentDesignation)
      ) {
        const current = getDesignationByIdSync(currentDesignation)
        if (current && current.departmentId === departmentId) {
          items = [
            ...items,
            {
              id: current.id,
              name: `${current.name} (inactive)`,
              code: current.code,
              departmentId: current.departmentId,
              isActive: false,
            },
          ]
        } else if (currentDesignation) {
          setValue('designationId', '')
        }
      } else if (
        currentDesignation &&
        items.length > 0 &&
        !items.some((item) => item.id === currentDesignation)
      ) {
        setValue('designationId', '')
      }
      setDesignations(items)
    })
  }, [departmentId, setValue, watch])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Personal Information" description="Basic identity details.">
        <FormGrid columns={2}>
          <Input
            label="First Name"
            requiredMark
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required' })}
          />
          <Input label="Middle Name" {...register('middleName')} />
          <Input
            label="Last Name"
            requiredMark
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Last name is required' })}
          />
          <DateInput label="Date of Birth" {...register('dateOfBirth')} />
          <Select
            label="Gender"
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            {...register('gender')}
          />
          <Select
            label="Marital Status"
            placeholder="Select status"
            options={MARITAL_STATUS_OPTIONS}
            {...register('maritalStatus')}
          />
          <Input label="Nationality" {...register('nationality')} />
        </FormGrid>
      </FormSection>

      <FormSection title="Contact Information">
        <FormGrid columns={2}>
          <Input
            label="Work Email"
            type="email"
            requiredMark
            error={errors.email?.message}
            {...register('email', {
              required: 'Work email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
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
            <Input
              label="Address"
              requiredMark
              error={errors.addressLine1?.message}
              {...register('addressLine1', { required: 'Address is required' })}
            />
          </div>
          <Input label="Address Line 2" {...register('addressLine2')} />
          <Input
            label="City"
            requiredMark
            error={errors.city?.message}
            {...register('city', { required: 'City is required' })}
          />
          <Input
            label="State"
            requiredMark
            error={errors.state?.message}
            {...register('state', { required: 'State is required' })}
          />
          <Input
            label="Country"
            requiredMark
            error={errors.country?.message}
            {...register('country', { required: 'Country is required' })}
          />
          <Input
            label="Postal Code"
            requiredMark
            error={errors.postalCode?.message}
            {...register('postalCode', { required: 'Postal code is required' })}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Employment Information">
        <FormGrid columns={2}>
          <Input
            label="Employee ID"
            requiredMark
            error={errors.employeeCode?.message}
            {...register('employeeCode', { required: 'Employee ID is required' })}
          />
          <DateInput
            label="Joining Date"
            requiredMark
            error={errors.joiningDate?.message}
            {...register('joiningDate', { required: 'Joining date is required' })}
          />
          <DateInput label="Confirmation Date" {...register('confirmationDate')} />
          <Select
            label="Department"
            requiredMark
            placeholder="Select department"
            options={departments.map((item) => ({ value: item.id, label: item.name }))}
            error={errors.departmentId?.message}
            {...register('departmentId', { required: 'Department is required' })}
          />
          <Select
            label="Designation"
            requiredMark
            placeholder="Select designation"
            options={designations.map((item) => ({ value: item.id, label: item.name }))}
            error={errors.designationId?.message}
            {...register('designationId', { required: 'Designation is required' })}
          />
          <Select
            label="Reporting Manager"
            placeholder="Select manager"
            options={managers.map((item) => ({
              value: item.id,
              label: `${item.fullName} (${item.employeeCode})`,
            }))}
            {...register('reportingManagerId')}
          />
          <Select
            label="Employment Type"
            requiredMark
            options={EMPLOYMENT_TYPE_OPTIONS}
            error={errors.employmentType?.message}
            {...register('employmentType', { required: 'Employment type is required' })}
          />
          <Select
            label="Employment Status"
            requiredMark
            options={EMPLOYMENT_STATUS_OPTIONS}
            error={errors.employmentStatus?.message}
            {...register('employmentStatus', { required: 'Employment status is required' })}
          />
          <Input label="Work Location" {...register('workLocation')} />
          <Input label="Shift" {...register('shift')} />
          <Input label="Salary Currency" {...register('salaryCurrency')} />
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

      <FormSection
        title="KYC Information"
        description="Sensitive identifiers are stored securely and should be treated carefully."
      >
        <FormGrid columns={2}>
          <Input label="National ID / Government ID" {...register('nationalId')} />
          <Input label="PAN / Tax ID" {...register('taxId')} />
          <Input label="Passport Number" {...register('passportNumber')} />
          <DateInput label="Passport Expiry" {...register('passportExpiry')} />
          <Input label="Driving License" {...register('drivingLicense')} />
          <Input label="Other ID" {...register('otherId')} />
        </FormGrid>
      </FormSection>

      <FormSection title="Banking Information">
        <FormGrid columns={2}>
          <Input label="Account Holder Name" {...register('accountHolderName')} />
          <Input label="Bank Name" {...register('bankName')} />
          <Input label="Account Number" {...register('accountNumber')} />
          <Input label="IFSC" {...register('ifsc')} />
          <Input label="SWIFT" {...register('swift')} />
          <Input label="Branch Name" {...register('branchName')} />
          <Select
            label="Account Type"
            placeholder="Select account type"
            options={ACCOUNT_TYPE_OPTIONS}
            {...register('accountType')}
          />
        </FormGrid>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create Employee' : 'Save Changes'}
        </Button>
      </div>
    </Form>
  )
}
