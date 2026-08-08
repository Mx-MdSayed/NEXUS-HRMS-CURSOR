import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarPlus, CheckCheck, Edit3, Eye, Printer, Save } from 'lucide-react'
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
  EmptyState,
  Form,
  FormGrid,
  FormSection,
  Input,
  Select,
  StatusBadge,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import type { AttendanceStatus } from '@/features/attendance/types'
import { leaveService } from '@/features/leave/services/leaveService'
import type { LeaveType } from '@/features/leave/types'
import { PayslipTemplate } from '@/features/payslip/components/PayslipTemplate'
import { formatSalaryAmount } from '@/features/salary/utils/money'
import { formatDate, formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import {
  EssAttendanceChart,
  EssKpiCards,
  EssPageShell,
  EssQuickActions,
  EssRecentActivity,
} from '../components'
import { employeeSelfServiceService } from '../services/employeeSelfServiceService'
import type {
  EmployeeDocument,
  EssAccountPreferences,
  EssAttendanceCalendar,
  EssAttendanceData,
  EssDashboardData,
  EssEditableProfile,
  EssLeaveDetails,
  EssNotification,
  EssProfileData,
  EssRequest,
  EssSalaryData,
  ProfileChangeRequest,
} from '../types'
import { getEssErrorMessage } from '../utils/errors'

type ResourceState<T> = {
  data: T | null
  isLoading: boolean
  error: string | null
}

function useEssResource<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  const load = useCallback(() => {
    setState((current) => ({ ...current, isLoading: true, error: null }))
    void loader()
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((error) =>
        setState({
          data: null,
          isLoading: false,
          error: getEssErrorMessage(error),
        }),
      )
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}

function FieldValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-surface-900 dark:text-surface-50">{value || '—'}</p>
    </div>
  )
}

const attendanceStatusOptions: Array<{ label: string; value: AttendanceStatus }> = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Late', value: 'late' },
  { label: 'Half Day', value: 'half_day' },
  { label: 'On Leave', value: 'on_leave' },
]

export function EssDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssDashboardData>(
    () => employeeSelfServiceService.getDashboard(user),
    [user],
  )

  return (
    <EssPageShell
      title="Employee Dashboard"
      description="Your attendance, leave, salary, payslip, and HR updates in one place."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={data.welcomeName} src={data.photo} size="lg" />
                <div>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Welcome back,</p>
                  <h2 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">
                    {data.welcomeName}
                  </h2>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    {data.employeeCode} · {data.department} · {data.designation}
                  </p>
                </div>
              </div>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                Joined {formatDate(data.joiningDate)}
              </div>
            </CardContent>
          </Card>
          <EssKpiCards kpis={data.kpis} />
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <EssAttendanceChart stats={data.attendanceMonthSummary} />
            <Card>
              <CardHeader>
                <CardTitle>Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldValue label="Attendance" value={data.todayAttendance?.status.replaceAll('_', ' ')} />
                <FieldValue
                  label="Check in"
                  value={data.todayAttendance?.checkIn ? formatDateTime(data.todayAttendance.checkIn) : '—'}
                />
                <FieldValue
                  label="Leave available"
                  value={`${data.leaveSummary.available} days`}
                />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <EssQuickActions actions={data.quickActions} />
            <EssRecentActivity items={data.recentActivity} />
          </div>
        </>
      ) : null}
    </EssPageShell>
  )
}

export function EssProfilePage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssProfileData>(
    () => employeeSelfServiceService.getProfile(user),
    [user],
  )
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const profileForm = useForm<EssEditableProfile>()
  const changeForm = useForm<{ field: string; currentValue: string; requestedValue: string; reason: string }>({
    defaultValues: { field: 'Date of birth', currentValue: '', requestedValue: '', reason: '' },
  })

  useEffect(() => {
    if (data?.editable) profileForm.reset(data.editable)
    if (data?.employee) {
      changeForm.reset({
        field: 'Date of birth',
        currentValue: data.employee.dateOfBirth ?? '',
        requestedValue: '',
        reason: '',
      })
    }
  }, [changeForm, data, profileForm])

  const saveProfile = async (values: EssEditableProfile) => {
    setSaving(true)
    try {
      await employeeSelfServiceService.updateEditableProfile(user, values)
      showSuccess('Profile updated successfully.')
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const requestChange = async (values: {
    field: string
    currentValue: string
    requestedValue: string
    reason: string
  }) => {
    setRequesting(true)
    try {
      await employeeSelfServiceService.createProfileChangeRequest(user, values)
      showSuccess('Profile change request submitted.')
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to submit change request.'))
    } finally {
      setRequesting(false)
    }
  }

  return (
    <EssPageShell
      title="My Profile"
      description="View your employee record and update permitted personal details."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <>
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
              <Avatar name={data.employee.fullName} src={data.employee.profilePhoto} size="lg" />
              <div>
                <h2 className="font-display text-xl font-semibold">{data.employee.fullName}</h2>
                <p className="text-sm text-surface-500">{data.employee.employeeCode}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={data.employee.employmentStatus} />
                  <Badge variant="neutral">{data.employee.email}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Profile completeness</p>
                <p className="mt-1 font-display text-3xl font-semibold text-primary-600">{data.completeness}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FieldValue label="Work email" value={data.employee.email} />
              <FieldValue label="Joining date" value={formatDate(data.employee.joiningDate)} />
              <FieldValue label="Work location" value={data.employee.workLocation} />
              <FieldValue label="Shift" value={data.employee.shift} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Editable details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-6">
                <FormSection title="Contact">
                  <FormGrid columns={2}>
                    <Input label="Personal email" type="email" {...profileForm.register('personalEmail')} />
                    <Input label="Phone" requiredMark {...profileForm.register('phone', { required: true })} />
                    <Input label="Alternate phone" {...profileForm.register('alternatePhone')} />
                  </FormGrid>
                </FormSection>
                <FormSection title="Address">
                  <FormGrid columns={2}>
                    <div className="md:col-span-2">
                      <Input label="Address" {...profileForm.register('addressLine1')} />
                    </div>
                    <Input label="Address line 2" {...profileForm.register('addressLine2')} />
                    <Input label="City" {...profileForm.register('city')} />
                    <Input label="State" {...profileForm.register('state')} />
                    <Input label="Country" {...profileForm.register('country')} />
                    <Input label="Postal code" {...profileForm.register('postalCode')} />
                  </FormGrid>
                </FormSection>
                <FormSection title="Emergency contact">
                  <FormGrid columns={2}>
                    <Input label="Name" {...profileForm.register('emergencyName')} />
                    <Input label="Relationship" {...profileForm.register('emergencyRelationship')} />
                    <Input label="Phone" {...profileForm.register('emergencyPhone')} />
                    <Input label="Alternate phone" {...profileForm.register('emergencyAlternatePhone')} />
                    <div className="md:col-span-2">
                      <Textarea label="Address" {...profileForm.register('emergencyAddress')} />
                    </div>
                  </FormGrid>
                </FormSection>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
                    Save changes
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request restricted profile change</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={changeForm.handleSubmit(requestChange)} className="space-y-4">
                <FormGrid columns={2}>
                  <Select
                    label="Field"
                    options={[
                      { label: 'Date of birth', value: 'Date of birth' },
                      { label: 'Legal name', value: 'Legal name' },
                      { label: 'Government ID', value: 'Government ID' },
                      { label: 'Bank account', value: 'Bank account' },
                    ]}
                    {...changeForm.register('field')}
                  />
                  <Input label="Current value" {...changeForm.register('currentValue')} />
                  <Input label="Requested value" requiredMark {...changeForm.register('requestedValue', { required: true })} />
                  <Input label="Reason" requiredMark {...changeForm.register('reason', { required: true })} />
                </FormGrid>
                <Button type="submit" variant="outline" isLoading={requesting} leftIcon={<Edit3 className="h-4 w-4" />}>
                  Submit request
                </Button>
              </Form>
            </CardContent>
          </Card>

          <ProfileChangeRequests rows={data.changeRequests} />
        </>
      ) : null}
    </EssPageShell>
  )
}

function ProfileChangeRequests({ rows }: { rows: ProfileChangeRequest[] }) {
  return (
    <DataTable isEmpty={rows.length === 0} emptyTitle="No profile change requests" columnCount={4}>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Requested value</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.field}</TableCell>
            <TableCell>{row.requestedValue}</TableCell>
            <TableCell><StatusBadge status={row.status} /></TableCell>
            <TableCell>{formatDate(row.requestedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  )
}

export function EssAttendancePage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const { data, isLoading, error, reload } = useEssResource<EssAttendanceData>(
    () => employeeSelfServiceService.getAttendance(user, { month }),
    [user, month],
  )

  return (
    <EssPageShell
      title="My Attendance"
      description="Review monthly attendance and open the calendar to request corrections."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      actions={
        <>
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <Link to="/employee/attendance/calendar">
            <Button variant="outline">Calendar</Button>
          </Link>
        </>
      }
    >
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent><FieldValue label="Attendance" value={`${data.stats.attendancePercentage}%`} /></CardContent></Card>
            <Card><CardContent><FieldValue label="Present" value={data.stats.presentDays} /></CardContent></Card>
            <Card><CardContent><FieldValue label="Late" value={data.stats.lateDays} /></CardContent></Card>
            <Card><CardContent><FieldValue label="Absent" value={data.stats.absentDays} /></CardContent></Card>
          </div>
          <DataTable isEmpty={data.records.length === 0} emptyTitle="No attendance records" columnCount={6}>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Work minutes</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.records.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell>{row.checkIn ? formatDateTime(row.checkIn) : '—'}</TableCell>
                  <TableCell>{row.checkOut ? formatDateTime(row.checkOut) : '—'}</TableCell>
                  <TableCell>{row.workMinutes}</TableCell>
                  <TableCell>{row.remarks ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </>
      ) : null}
    </EssPageShell>
  )
}

export function EssAttendanceCalendarPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const correctionForm = useForm<{ requestedStatus: AttendanceStatus; requestedCheckIn: string; requestedCheckOut: string; reason: string }>({
    defaultValues: { requestedStatus: 'present', requestedCheckIn: '', requestedCheckOut: '', reason: '' },
  })
  const { data, isLoading, error, reload } = useEssResource<EssAttendanceCalendar>(
    () => employeeSelfServiceService.getAttendanceCalendar(user, month),
    [user, month],
  )

  const submitCorrection = async (values: {
    requestedStatus: AttendanceStatus
    requestedCheckIn: string
    requestedCheckOut: string
    reason: string
  }) => {
    if (!selectedDate) return
    setSubmitting(true)
    try {
      await employeeSelfServiceService.createAttendanceCorrection(user, {
        date: selectedDate,
        requestedStatus: values.requestedStatus,
        requestedCheckIn: values.requestedCheckIn,
        requestedCheckOut: values.requestedCheckOut,
        reason: values.reason,
      })
      showSuccess('Attendance correction request submitted.')
      correctionForm.reset({ requestedStatus: 'present', requestedCheckIn: '', requestedCheckOut: '', reason: '' })
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to submit correction.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EssPageShell
      title="Attendance Calendar"
      description="Select a day to inspect status and request a correction."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      actions={<Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}
    >
      {data ? (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardContent className="grid grid-cols-7 gap-2">
              {data.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    selectedDate === day.date
                      ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950'
                      : 'border-surface-200 hover:border-primary-300 dark:border-surface-800'
                  }`}
                >
                  <span className="font-medium">{day.date.slice(-2)}</span>
                  <span className="mt-2 block text-xs capitalize text-surface-500">
                    {(day.status ?? 'not_marked').replaceAll('_', ' ')}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{selectedDate ? formatDate(selectedDate) : 'Select a date'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <Form onSubmit={correctionForm.handleSubmit(submitCorrection)} className="space-y-4">
                  <Select
                    label="Requested status"
                    options={attendanceStatusOptions}
                    {...correctionForm.register('requestedStatus')}
                  />
                  <Input label="Requested check in" type="time" {...correctionForm.register('requestedCheckIn')} />
                  <Input label="Requested check out" type="time" {...correctionForm.register('requestedCheckOut')} />
                  <Textarea label="Reason" requiredMark {...correctionForm.register('reason', { required: true })} />
                  <Button type="submit" isLoading={submitting} leftIcon={<CalendarPlus className="h-4 w-4" />}>
                    Request correction
                  </Button>
                </Form>
              ) : (
                <EmptyState title="No date selected" description="Choose a day in the calendar." />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </EssPageShell>
  )
}

export function EssLeavePage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource(
    async () => {
      const [balances, history] = await Promise.all([
        employeeSelfServiceService.getLeaveBalance(user),
        employeeSelfServiceService.getLeaveHistory(user),
      ])
      return { balances, history: history.data }
    },
    [user],
  )

  return (
    <EssPageShell
      title="My Leave"
      description="Track balances and submitted leave requests."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      actions={<Link to="/employee/leave/apply"><Button>Apply leave</Button></Link>}
    >
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent><FieldValue label="Available" value={data.balances.reduce((sum, item) => sum + item.available, 0)} /></CardContent></Card>
            <Card><CardContent><FieldValue label="Used" value={data.balances.reduce((sum, item) => sum + item.used, 0)} /></CardContent></Card>
            <Card><CardContent><FieldValue label="Pending" value={data.balances.reduce((sum, item) => sum + item.pending, 0)} /></CardContent></Card>
          </div>
          <DataTable isEmpty={data.history.length === 0} emptyTitle="No leave requests" columnCount={6}>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.leaveTypeName}</TableCell>
                  <TableCell>{row.startDate} to {row.endDate}</TableCell>
                  <TableCell>{row.duration}</TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell>{formatDate(row.appliedAt)}</TableCell>
                  <TableCell><Link to={`/employee/leave/${row.id}`}><Button variant="ghost" size="sm">View</Button></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </>
      ) : null}
    </EssPageShell>
  )
}

export function EssLeaveApplyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      dayPortion: 'full_day' as const,
      halfDayType: undefined,
      reason: '',
    },
  })

  useEffect(() => {
    void leaveService.getLeaveTypes(false).then(setLeaveTypes)
  }, [])

  const submit = async (values: Parameters<typeof employeeSelfServiceService.applyLeave>[1]) => {
    setSubmitting(true)
    try {
      await employeeSelfServiceService.applyLeave(user, values)
      showSuccess('Leave request submitted.')
      navigate('/employee/leave')
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to apply leave.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EssPageShell title="Apply Leave" description="Submit a leave request for approval.">
      <Card>
        <CardContent>
          <Form onSubmit={form.handleSubmit(submit)} className="space-y-6">
            <FormGrid columns={2}>
              <Select
                label="Leave type"
                placeholder="Select leave type"
                requiredMark
                options={leaveTypes.map((type) => ({ label: type.name, value: type.id }))}
                {...form.register('leaveTypeId', { required: true })}
              />
              <Select
                label="Day portion"
                options={[
                  { label: 'Full day', value: 'full_day' },
                  { label: 'Half day', value: 'half_day' },
                ]}
                {...form.register('dayPortion')}
              />
              <Input label="Start date" type="date" requiredMark {...form.register('startDate', { required: true })} />
              <Input label="End date" type="date" requiredMark {...form.register('endDate', { required: true })} />
              <div className="md:col-span-2">
                <Textarea label="Reason" requiredMark {...form.register('reason', { required: true })} />
              </div>
            </FormGrid>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/employee/leave')}>Cancel</Button>
              <Button type="submit" isLoading={submitting}>Submit</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </EssPageShell>
  )
}

export function EssLeaveDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { data, isLoading, error, reload } = useEssResource<EssLeaveDetails>(
    () => employeeSelfServiceService.getLeaveDetails(user, id ?? ''),
    [user, id],
  )

  const cancelLeave = async () => {
    if (!id) return
    setCancelling(true)
    try {
      await employeeSelfServiceService.cancelLeave(user, id)
      showSuccess('Leave request cancelled.')
      setConfirmOpen(false)
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to cancel leave.'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <EssPageShell
      title="Leave Details"
      description="Review a submitted leave request."
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      actions={data?.status === 'pending' ? <Button variant="danger" onClick={() => setConfirmOpen(true)}>Cancel request</Button> : undefined}
    >
      {data ? (
        <>
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldValue label="Leave type" value={data.leaveTypeName} />
              <FieldValue label="Dates" value={`${data.startDate} to ${data.endDate}`} />
              <FieldValue label="Duration" value={data.duration} />
              <FieldValue label="Status" value={data.status} />
              <FieldValue label="Reason" value={data.reason} />
              <FieldValue label="Applied" value={formatDate(data.appliedAt)} />
            </CardContent>
          </Card>
          <ConfirmDialog
            open={confirmOpen}
            title="Cancel leave request?"
            description="Pending requests will be withdrawn. Approved future requests will be cancelled if policy allows it."
            confirmLabel="Cancel request"
            tone="danger"
            isLoading={cancelling}
            onClose={() => setConfirmOpen(false)}
            onConfirm={cancelLeave}
          />
        </>
      ) : null}
    </EssPageShell>
  )
}

export function EssSalaryPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssSalaryData>(
    async () => ({
      current: await employeeSelfServiceService.getCurrentSalary(user),
      history: await employeeSelfServiceService.getSalaryHistory(user),
    }),
    [user],
  )

  return (
    <EssPageShell title="My Salary" description="View your current salary snapshot and revision history." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <>
          {data.current ? (
            <Card>
              <CardHeader><CardTitle>{data.current.structureName}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FieldValue label="Monthly gross" value={formatSalaryAmount(data.current.monthlyGross, data.current.currency)} />
                  <FieldValue label="Monthly net" value={formatSalaryAmount(data.current.monthlyNet, data.current.currency)} />
                  <FieldValue label="Annual gross" value={formatSalaryAmount(data.current.annualGross, data.current.currency)} />
                  <FieldValue label="Annual CTC" value={formatSalaryAmount(data.current.annualCTC, data.current.currency)} />
                </div>
                <DataTable isEmpty={data.current.components.length === 0} columnCount={4}>
                  <TableHeader>
                    <TableRow><TableHead>Component</TableHead><TableHead>Category</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.current.components.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.componentName}</TableCell>
                        <TableCell>{line.category.replaceAll('_', ' ')}</TableCell>
                        <TableCell>{line.calculationMethod.replaceAll('_', ' ')}</TableCell>
                        <TableCell>{formatSalaryAmount(line.amount, data.current!.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          ) : <EmptyState title="No salary assigned" description="Your current salary assignment is not available." />}
          <DataTable isEmpty={data.history.length === 0} emptyTitle="No salary history" columnCount={5}>
            <TableHeader><TableRow><TableHead>Structure</TableHead><TableHead>Effective from</TableHead><TableHead>Status</TableHead><TableHead>Monthly net</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.structureName}</TableCell>
                  <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                  <TableCell><Badge variant="neutral">{row.status}</Badge></TableCell>
                  <TableCell>{formatSalaryAmount(row.monthlyNet, row.currency)}</TableCell>
                  <TableCell>{row.revisionReason ?? row.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </>
      ) : null}
    </EssPageShell>
  )
}

export function EssPayslipsPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource(
    () => employeeSelfServiceService.getPayslips(user),
    [user],
  )

  return (
    <EssPageShell title="My Payslips" description="View generated payroll salary documents." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <DataTable isEmpty={data.length === 0} emptyTitle="No payslips available" columnCount={6}>
          <TableHeader><TableRow><TableHead>Payslip</TableHead><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.payslipNumber}</TableCell>
                <TableCell>{row.monthKey}</TableCell>
                <TableCell>{formatSalaryAmount(row.grossEarnings, row.currency)}</TableCell>
                <TableCell>{formatSalaryAmount(row.totalDeductions, row.currency)}</TableCell>
                <TableCell>{formatSalaryAmount(row.netSalary, row.currency)}</TableCell>
                <TableCell><Link to={`/employee/payslips/${row.id}`}><Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />}>View</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      ) : null}
    </EssPageShell>
  )
}

export function EssPayslipDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, reload } = useEssResource(
    () => employeeSelfServiceService.getPayslipById(user, id ?? ''),
    [user, id],
  )

  return (
    <EssPageShell
      title={data?.payslipNumber ?? 'Payslip'}
      description={data ? `Salary document for ${data.monthKey}.` : undefined}
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      actions={data ? <Link to={`/employee/payslips/${data.id}/print`}><Button leftIcon={<Printer className="h-4 w-4" />}>Print</Button></Link> : undefined}
    >
      {data ? (
        <Card>
          <CardContent className="overflow-x-auto bg-surface-100 dark:bg-surface-950">
            <PayslipTemplate payslip={data} viewerRole="employee" />
          </CardContent>
        </Card>
      ) : null}
    </EssPageShell>
  )
}

export function EssDocumentsPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EmployeeDocument[]>(
    () => employeeSelfServiceService.getDocuments(user),
    [user],
  )

  return (
    <EssPageShell title="My Documents" description="Employment and HR documents available to you." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <DataTable isEmpty={data.length === 0} emptyTitle="No documents" columnCount={5}>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>File</TableHead><TableHead>Issued</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}<p className="text-xs text-surface-500">{row.description}</p></TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.fileName}</TableCell>
                <TableCell>{formatDate(row.issuedAt)}</TableCell>
                <TableCell>{row.href ? <Link to={row.href}><Button variant="ghost" size="sm">Open</Button></Link> : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      ) : null}
    </EssPageShell>
  )
}

export function EssRequestsPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssRequest[]>(
    () => employeeSelfServiceService.getRequests(user),
    [user],
  )

  return (
    <EssPageShell title="My Requests" description="Unified leave, attendance, document, and profile requests." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <DataTable isEmpty={data.length === 0} emptyTitle="No requests" columnCount={5}>
          <TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}<p className="text-xs text-surface-500">{row.description}</p></TableCell>
                <TableCell>{row.type.replaceAll('_', ' ')}</TableCell>
                <TableCell><StatusBadge status={row.status} /></TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell><Link to={`/employee/requests/${row.id}`}><Button variant="ghost" size="sm">View</Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      ) : null}
    </EssPageShell>
  )
}

export function EssRequestDetailPage() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, reload } = useEssResource<EssRequest>(
    () => employeeSelfServiceService.getRequestById(user, id ?? ''),
    [user, id],
  )

  return (
    <EssPageShell title="Request Details" description="Details for your self-service request." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FieldValue label="Title" value={data.title} />
            <FieldValue label="Type" value={data.type.replaceAll('_', ' ')} />
            <FieldValue label="Status" value={data.status} />
            <FieldValue label="Created" value={formatDateTime(data.createdAt)} />
            <div className="sm:col-span-2"><FieldValue label="Description" value={data.description} /></div>
          </CardContent>
        </Card>
      ) : null}
    </EssPageShell>
  )
}

export function EssNotificationsPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssNotification[]>(
    () => employeeSelfServiceService.getNotifications(user),
    [user],
  )

  const markAll = async () => {
    try {
      await employeeSelfServiceService.markAllNotificationsAsRead(user)
      showSuccess('All notifications marked as read.')
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to update notifications.'))
    }
  }

  const markOne = async (id: string) => {
    try {
      await employeeSelfServiceService.markNotificationAsRead(user, id)
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to update notification.'))
    }
  }

  return (
    <EssPageShell title="Notifications" description="HR, attendance, leave, and payslip updates." isLoading={isLoading} error={error} onRetry={reload} actions={<Button variant="outline" onClick={markAll} leftIcon={<CheckCheck className="h-4 w-4" />}>Mark all read</Button>}>
      {data ? (
        <div className="space-y-3">
          {data.length === 0 ? <EmptyState title="No notifications" description="You are all caught up." /> : null}
          {data.map((row) => (
            <Card key={row.id} className={!row.isRead ? 'border-primary-300' : undefined}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">{row.title}</p>
                  <p className="text-sm text-surface-500">{row.message}</p>
                  <p className="mt-1 text-xs text-surface-400">{formatDateTime(row.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {row.href ? <Link to={row.href}><Button variant="ghost" size="sm">Open</Button></Link> : null}
                  {!row.isRead ? <Button variant="outline" size="sm" onClick={() => markOne(row.id)}>Mark read</Button> : <Badge variant="neutral">Read</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </EssPageShell>
  )
}

export function EssSettingsPage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useEssResource<EssAccountPreferences>(
    () => employeeSelfServiceService.getPreferences(user),
    [user],
  )
  const [saving, setSaving] = useState(false)
  const [changing, setChanging] = useState(false)
  const passwordForm = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>()

  const updatePref = async (patch: Partial<EssAccountPreferences>) => {
    setSaving(true)
    try {
      await employeeSelfServiceService.updatePreferences(user, patch)
      reload()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to update preferences.'))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      showError('New password and confirmation do not match.')
      return
    }
    setChanging(true)
    try {
      await employeeSelfServiceService.changePassword(user, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      showSuccess('Password changed successfully.')
      passwordForm.reset()
    } catch (error) {
      showError(getEssErrorMessage(error, 'Unable to change password.'))
    } finally {
      setChanging(false)
    }
  }

  return (
    <EssPageShell title="Settings" description="Manage ESS preferences and account security." isLoading={isLoading} error={error} onRetry={reload}>
      {data ? (
        <>
          <Card>
            <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                ['emailNotifications', 'Email notifications'],
                ['payslipAlerts', 'Payslip alerts'],
                ['leaveAlerts', 'Leave alerts'],
                ['attendanceReminders', 'Attendance reminders'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 p-3 dark:border-surface-800">
                  <span className="text-sm font-medium">{label}</span>
                  <Switch
                    checked={Boolean(data[key as keyof EssAccountPreferences])}
                    disabled={saving}
                    onCheckedChange={(checked) => updatePref({ [key]: checked })}
                  />
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
            <CardContent>
              <Form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                <FormGrid columns={2}>
                  <Input label="Current password" type="password" requiredMark {...passwordForm.register('currentPassword', { required: true })} />
                  <Input label="New password" type="password" requiredMark {...passwordForm.register('newPassword', { required: true, minLength: 8 })} />
                  <Input label="Confirm new password" type="password" requiredMark {...passwordForm.register('confirmPassword', { required: true })} />
                </FormGrid>
                <Button type="submit" isLoading={changing}>Change password</Button>
              </Form>
            </CardContent>
          </Card>
        </>
      ) : null}
    </EssPageShell>
  )
}
