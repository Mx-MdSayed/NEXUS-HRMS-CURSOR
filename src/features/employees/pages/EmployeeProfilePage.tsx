import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Dropdown,
  EmptyState,
  ErrorState,
  FileUpload,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatRelativeDate } from '@/utils/date'
import { showError, showInfo, showSuccess } from '@/utils/toast'
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_OPTIONS } from '../constants'
import { employeeService, isProtectedSuperAdminEmployee } from '../services/employeeService'
import type { DocumentCategory, Employee, EmployeeListItem } from '../types'
import { formatBytes, maskSensitiveValue } from '../utils/format'
import { getEmployeeErrorMessage } from '../utils/errors'
import { EMPLOYMENT_TYPE_LABELS } from '../constants'

export function EmployeeProfilePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [manager, setManager] = useState<EmployeeListItem | null>(null)
  const [departmentName, setDepartmentName] = useState('—')
  const [designationName, setDesignationName] = useState('—')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [docCategory, setDocCategory] = useState<DocumentCategory>('resume')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null)

  const canViewSensitive = hasPermission(PERMISSIONS.EMPLOYEE_MANAGE) || hasRole(ROLES.SUPER_ADMIN)
  const canEdit = hasPermission(PERMISSIONS.EMPLOYEE_EDIT)
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEE_DELETE)
  const canManage = hasPermission(PERMISSIONS.EMPLOYEE_MANAGE)

  const loadEmployee = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const record = await employeeService.getEmployeeById(id)
      setEmployee(record)
      const [departments, designations, managers] = await Promise.all([
        employeeService.getDepartments(),
        employeeService.getDesignations(),
        employeeService.getEmployees({ page: 1, pageSize: 100 }),
      ])
      setDepartmentName(departments.find((item) => item.id === record.departmentId)?.name ?? '—')
      setDesignationName(designations.find((item) => item.id === record.designationId)?.name ?? '—')
      setManager(
        managers.data.find((item) => item.id === record.reportingManagerId) ?? null,
      )
    } catch {
      setHasError(true)
      setEmployee(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployee()
  }, [id])

  const actorName = user?.name ?? 'System'
  const actorRole = user?.role
  const isActive = employee?.employmentStatus === 'active'
  const protectedTarget =
    Boolean(employee) && hasRole(ROLES.HR_ADMIN) && isProtectedSuperAdminEmployee(employee!)
  const showEdit = canEdit && !protectedTarget
  const showManage = canManage && !protectedTarget
  const showDelete = canDelete && !protectedTarget

  const kycDisplay = useMemo(() => {
    if (!employee) return []
    return [
      {
        label: 'National ID',
        value: canViewSensitive
          ? employee.kyc.nationalId || '—'
          : maskSensitiveValue(employee.kyc.nationalId),
      },
      {
        label: 'PAN / Tax ID',
        value: canViewSensitive ? employee.kyc.taxId || '—' : maskSensitiveValue(employee.kyc.taxId),
      },
      {
        label: 'Passport Number',
        value: canViewSensitive
          ? employee.kyc.passportNumber || '—'
          : maskSensitiveValue(employee.kyc.passportNumber),
      },
      {
        label: 'Passport Expiry',
        value: employee.kyc.passportExpiry ? formatDate(employee.kyc.passportExpiry) : '—',
      },
      {
        label: 'Driving License',
        value: canViewSensitive
          ? employee.kyc.drivingLicense || '—'
          : maskSensitiveValue(employee.kyc.drivingLicense),
      },
      {
        label: 'Other ID',
        value: canViewSensitive
          ? employee.kyc.otherId || '—'
          : maskSensitiveValue(employee.kyc.otherId),
      },
    ]
  }, [canViewSensitive, employee])

  if (isLoading) return <PageLoader label="Loading employee profile" />
  if (hasError || !employee) {
    return (
      <ErrorState
        title="Unable to load employee profile"
        message="Please try again."
        onRetry={() => {
          void loadEmployee()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        description={`${employee.employeeCode} · ${designationName} · ${departmentName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Employees', href: '/employees' },
          { label: employee.fullName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {showEdit ? (
              <Button variant="outline" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
                Edit
              </Button>
            ) : null}
            {showManage ? (
              <Button variant="secondary" onClick={() => setPendingStatus(true)}>
                {isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ) : null}
            {showDelete ? (
              <Button variant="danger" onClick={() => setPendingDelete(true)}>
                Delete
              </Button>
            ) : null}
            <Dropdown
              align="right"
              trigger={
                <span className="inline-flex h-10 items-center rounded-lg border border-surface-300 px-3 text-sm font-medium dark:border-surface-600">
                  More actions
                </span>
              }
              items={[
                {
                  id: 'view-list',
                  label: 'Back to directory',
                  onClick: () => navigate('/employees'),
                },
              ]}
            />
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.fullName} src={employee.profilePhoto} size="lg" />
            <div>
              <p className="font-display text-xl font-semibold text-surface-900 dark:text-surface-50">
                {employee.fullName}
              </p>
              <p className="text-sm text-surface-500">{employee.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={employee.employmentStatus} />
                <Badge variant="neutral">{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
            <div>
              <p className="text-surface-500">Employee ID</p>
              <p className="font-medium">{employee.employeeCode}</p>
            </div>
            <div>
              <p className="text-surface-500">Joining Date</p>
              <p className="font-medium">{formatDate(employee.joiningDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info label="Department" value={departmentName} />
                <Info label="Designation" value={designationName} />
                <Info label="Manager" value={manager?.fullName ?? '—'} />
                <Info label="Joining Date" value={formatDate(employee.joiningDate)} />
                <Info label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
                <Info label="Work Location" value={employee.workLocation || '—'} />
                <Info label="Status" value={<StatusBadge status={employee.employmentStatus} />} />
                <Info label="Phone" value={employee.phone} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-surface-500">
                <p>Attendance summary — available in later modules.</p>
                <p>Leave balance — available in later modules.</p>
                <p>Payroll summary — available in later modules.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Personal & Contact</CardTitle>
              {showEdit ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/employees/${employee.id}/edit`)}
                >
                  Edit
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Full Name" value={employee.fullName} />
              <Info label="Date of Birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'} />
              <Info label="Gender" value={employee.gender || '—'} />
              <Info label="Marital Status" value={employee.maritalStatus || '—'} />
              <Info label="Nationality" value={employee.nationality || '—'} />
              <Info label="Work Email" value={employee.email} />
              <Info label="Personal Email" value={employee.personalEmail || '—'} />
              <Info label="Phone" value={employee.phone} />
              <Info label="Alternate Phone" value={employee.alternatePhone || '—'} />
              <Info
                label="Address"
                value={`${employee.address.line1}, ${employee.address.city}, ${employee.address.state}, ${employee.address.country} ${employee.address.postalCode}`}
              />
              <div className="sm:col-span-2">
                <h4 className="mb-2 text-sm font-semibold">Emergency Contact</h4>
                {employee.emergencyContacts.length === 0 ? (
                  <EmptyState title="No emergency contact added" description="Add an emergency contact from the edit form." />
                ) : (
                  employee.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border border-surface-200 p-3 dark:border-surface-800">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-surface-500">
                        {contact.relationship} · {contact.phone}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Employee ID" value={employee.employeeCode} />
              <Info label="Joining Date" value={formatDate(employee.joiningDate)} />
              <Info
                label="Confirmation Date"
                value={employee.confirmationDate ? formatDate(employee.confirmationDate) : '—'}
              />
              <Info label="Department" value={departmentName} />
              <Info label="Designation" value={designationName} />
              <Info label="Manager" value={manager?.fullName ?? '—'} />
              <Info label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]} />
              <Info label="Employment Status" value={<StatusBadge status={employee.employmentStatus} />} />
              <Info label="Work Location" value={employee.workLocation || '—'} />
              <Info label="Shift" value={employee.shift || '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle>KYC Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {!canViewSensitive ? (
                <p className="sm:col-span-2 text-sm text-surface-500">
                  Sensitive identifiers are masked. Full KYC access is limited to authorized HR/Admin users.
                </p>
              ) : null}
              {kycDisplay.map((item) => (
                <Info key={item.label} label={item.label} value={item.value} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Banking Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {!canViewSensitive ? (
                <p className="sm:col-span-2 text-sm text-surface-500">
                  Account numbers are masked for non-authorized users.
                </p>
              ) : null}
              <Info label="Account Holder" value={employee.banking.accountHolderName || '—'} />
              <Info label="Bank Name" value={employee.banking.bankName || '—'} />
              <Info
                label="Account Number"
                value={
                  canViewSensitive
                    ? employee.banking.accountNumber || '—'
                    : maskSensitiveValue(employee.banking.accountNumber)
                }
              />
              <Info label="IFSC" value={employee.banking.ifsc || '—'} />
              <Info label="SWIFT" value={employee.banking.swift || '—'} />
              <Info label="Branch" value={employee.banking.branchName || '—'} />
              <Info label="Account Type" value={employee.banking.accountType || '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            {showEdit ? (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Category"
                    options={DOCUMENT_CATEGORY_OPTIONS}
                    value={docCategory}
                    onChange={(event) => setDocCategory(event.target.value as DocumentCategory)}
                  />
                  <FileUpload
                    label="Employee document"
                    hint="PDF, JPG, PNG, DOC, DOCX up to 5 MB"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    value={selectedFile}
                    progress={uploadProgress}
                    onFileSelect={(file) => {
                      if (!file) {
                        setSelectedFile(null)
                        return
                      }
                      setSelectedFile({ name: file.name, size: file.size })
                      setUploadProgress(20)
                      void employeeService
                        .addEmployeeDocument(employee.id, file, docCategory, actorName)
                        .then(() => {
                          setUploadProgress(100)
                          showSuccess('Document uploaded successfully.')
                          setSelectedFile(null)
                          setUploadProgress(null)
                          void loadEmployee()
                        })
                        .catch((error) => {
                          setUploadProgress(null)
                          showError(getEmployeeErrorMessage(error, 'Unable to upload document.'))
                        })
                    }}
                    onRemove={() => setSelectedFile(null)}
                  />
                </CardContent>
              </Card>
            ) : null}

            {employee.documents.length === 0 ? (
              <EmptyState title="No documents uploaded" description="Employee documents will appear here." />
            ) : (
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{DOCUMENT_CATEGORY_LABELS[doc.category]}</TableCell>
                      <TableCell>{doc.fileType}</TableCell>
                      <TableCell>{formatBytes(doc.fileSize)}</TableCell>
                      <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <Badge variant={doc.status === 'verified' ? 'success' : 'neutral'}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TableActions
                          onView={() => {
                            if (doc.url) window.open(doc.url, '_blank', 'noopener,noreferrer')
                            else showInfo('Document preview will be available with storage integration.')
                          }}
                          onDelete={
                            showEdit
                              ? () => {
                                  void employeeService
                                    .deleteEmployeeDocument(employee.id, doc.id, actorName)
                                    .then(() => {
                                      showSuccess('Document deleted successfully.')
                                      void loadEmployee()
                                    })
                                    .catch((error) =>
                                      showError(
                                        getEmployeeErrorMessage(error, 'Unable to delete document.'),
                                      ),
                                    )
                                }
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          {employee.activity.length === 0 ? (
            <EmptyState title="No activity available" description="Employee activity events will appear here." />
          ) : (
            <Card>
              <CardContent className="divide-y divide-surface-100 dark:divide-surface-800">
                {employee.activity.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-surface-500">
                        {item.actorName} · {item.action}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-surface-500">
                      {formatRelativeDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        title="Are you sure you want to delete this employee?"
        description="The employee will be soft deleted and hidden from the default directory."
        confirmLabel="Delete"
        tone="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          void employeeService
            .softDeleteEmployee(employee.id, actorName, actorRole)
            .then(() => {
              showSuccess('Employee deleted successfully.')
              navigate('/employees')
            })
            .catch((error) => showError(getEmployeeErrorMessage(error, 'Unable to delete employee.')))
            .finally(() => setActionLoading(false))
        }}
      />

      <ConfirmDialog
        open={pendingStatus}
        onClose={() => setPendingStatus(false)}
        title={isActive ? 'Deactivate this employee?' : 'Activate this employee?'}
        description={
          isActive
            ? 'The employee will be marked inactive. Historical records remain.'
            : 'The employee will be marked active.'
        }
        confirmLabel={isActive ? 'Deactivate' : 'Activate'}
        tone={isActive ? 'danger' : 'primary'}
        isLoading={actionLoading}
        onConfirm={() => {
          setActionLoading(true)
          const action = isActive
            ? employeeService.deactivateEmployee(employee.id, actorName, actorRole)
            : employeeService.activateEmployee(employee.id, actorName, actorRole)
          void action
            .then((updated) => {
              setEmployee(updated)
              showSuccess(
                isActive ? 'Employee deactivated successfully.' : 'Employee activated successfully.',
              )
              setPendingStatus(false)
            })
            .catch((error) => showError(getEmployeeErrorMessage(error, 'Unable to update employee.')))
            .finally(() => setActionLoading(false))
        }}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-surface-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-surface-900 dark:text-surface-50">{value}</div>
    </div>
  )
}
