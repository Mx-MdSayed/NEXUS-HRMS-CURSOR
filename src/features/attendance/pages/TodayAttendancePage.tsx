import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Avatar,
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Select,
  StatusBadge,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { PERMISSIONS } from '@/constants/permissions'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees/services/employeeService'
import { formatDateTime } from '@/utils/date'
import { showError, showSuccess } from '@/utils/toast'
import { AttendanceFormModal } from '../components/AttendanceFormModal'
import { AttendanceStatCards } from '../components/AttendanceStatCards'
import { CheckInOutPanel } from '../components/CheckInOutPanel'
import { TODAY_STATUS_FILTER_OPTIONS } from '../constants'
import { attendanceService } from '../services/attendanceService'
import type {
  AttendanceFilters,
  AttendanceFormValues,
  AttendanceRecord,
  TodayAttendanceRow,
  TodayAttendanceStats,
} from '../types'
import { getAttendanceErrorMessage } from '../utils/errors'

const emptyStats: TodayAttendanceStats = {
  totalEmployees: 0,
  present: 0,
  absent: 0,
  late: 0,
  halfDay: 0,
  onLeave: 0,
  notMarked: 0,
  holiday: 0,
  weekOff: 0,
}

export function TodayAttendancePage() {
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const isEmployee = hasRole(ROLES.EMPLOYEE)
  const canManage =
    hasPermission(PERMISSIONS.ATTENDANCE_MANAGE) ||
    hasPermission(PERMISSIONS.ATTENDANCE_CREATE) ||
    hasPermission(PERMISSIONS.ATTENDANCE_EDIT)
  const canCorrect = hasPermission(PERMISSIONS.ATTENDANCE_CORRECT)

  const [filters, setFilters] = useState<AttendanceFilters>({
    search: '',
    departmentId: '',
    designationId: '',
    status: '',
    date: attendanceService.getSettingsToday(),
  })
  const [rows, setRows] = useState<TodayAttendanceRow[]>([])
  const [stats, setStats] = useState<TodayAttendanceStats>(emptyStats)
  const [date, setDate] = useState(attendanceService.getSettingsToday())
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [designations, setDesignations] = useState<Array<{ id: string; name: string }>>([])
  const [employees, setEmployees] = useState<Array<{ id: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TodayAttendanceRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [selfEmployeeId, setSelfEmployeeId] = useState<string | null>(null)
  const [selfRecord, setSelfRecord] = useState<AttendanceRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const result = await attendanceService.getTodayAttendance(filters)
      setRows(result.rows)
      setStats(result.stats)
      setDate(result.date)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void employeeService.getDepartments().then((items) =>
      setDepartments(items.map((item) => ({ id: item.id, name: item.name }))),
    )
    void employeeService
      .getEmployees({ page: 1, pageSize: 200, sortBy: 'fullName' })
      .then((result) =>
        setEmployees(
          result.data.map((item) => ({
            id: item.id,
            label: `${item.fullName} (${item.employeeCode})`,
          })),
        ),
      )
  }, [])

  useEffect(() => {
    void employeeService.getDesignations(filters.departmentId || undefined).then((items) =>
      setDesignations(items.map((item) => ({ id: item.id, name: item.name }))),
    )
  }, [filters.departmentId])

  useEffect(() => {
    if (!isEmployee || !user) return
    void attendanceService.resolveLinkedEmployeeId(user).then(async (id) => {
      setSelfEmployeeId(id)
      if (!id) return
      const records = await attendanceService.getAttendanceByEmployee(
        id,
        attendanceService.getSettingsToday().slice(0, 7),
      )
      const today = attendanceService.getSettingsToday()
      setSelfRecord(records.find((item) => item.date === today) ?? null)
    })
  }, [isEmployee, user, rows])

  const initialFormValues = useMemo<Partial<AttendanceFormValues> | undefined>(() => {
    if (!editing) {
      return { date: filters.date || attendanceService.getSettingsToday(), status: 'present' }
    }
    const checkIn = editing.attendance?.checkIn
    const checkOut = editing.attendance?.checkOut
    return {
      employeeId: editing.employeeId,
      date: filters.date || attendanceService.getSettingsToday(),
      status: editing.attendance?.status ?? 'present',
      checkIn: checkIn ? format(new Date(checkIn), 'HH:mm') : '',
      checkOut: checkOut ? format(new Date(checkOut), 'HH:mm') : '',
      remarks: editing.attendance?.remarks ?? '',
    }
  }, [editing, filters.date])

  const onSave = async (values: AttendanceFormValues) => {
    setSaving(true)
    try {
      if (editing?.attendance && !editing.attendance.id.startsWith('virtual-')) {
        await attendanceService.updateAttendance(
          editing.attendance.id,
          values,
          user?.name ?? 'System',
        )
        showSuccess('Attendance updated successfully.')
      } else {
        await attendanceService.createAttendance(
          values,
          user?.name ?? 'System',
          'admin_entry',
        )
        showSuccess('Attendance marked successfully.')
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (error) {
      showError(getAttendanceErrorMessage(error, 'Unable to save attendance.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Attendance"
        description={`${format(new Date(date), 'EEEE, dd MMM yyyy')}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Attendance' }, { label: 'Today' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/attendance/calendar')}>
              Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate('/attendance/summary')}>
              Summary
            </Button>
            <Button variant="outline" onClick={() => navigate('/attendance/corrections')}>
              Corrections
            </Button>
            {canManage ? (
              <Button
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
              >
                Mark Attendance
              </Button>
            ) : null}
          </div>
        }
      />

      {isEmployee && selfEmployeeId ? (
        <CheckInOutPanel
          dateLabel={date}
          record={selfRecord}
          loading={actionLoading}
          onCheckIn={() => {
            setActionLoading(true)
            void attendanceService
              .checkIn(selfEmployeeId, user?.name ?? 'System')
              .then((record) => {
                setSelfRecord(record)
                showSuccess('Checked in successfully.')
                void load()
              })
              .catch((error) =>
                showError(getAttendanceErrorMessage(error, 'Unable to check in.')),
              )
              .finally(() => setActionLoading(false))
          }}
          onCheckOut={() => {
            setActionLoading(true)
            void attendanceService
              .checkOut(selfEmployeeId, user?.name ?? 'System')
              .then((record) => {
                setSelfRecord(record)
                showSuccess('Checked out successfully.')
                void load()
              })
              .catch((error) =>
                showError(getAttendanceErrorMessage(error, 'Unable to check out.')),
              )
              .finally(() => setActionLoading(false))
          }}
        />
      ) : null}

      {!isEmployee ? <AttendanceStatCards stats={stats} isLoading={isLoading} /> : null}

      {!isEmployee ? (
        <>
          <FilterBar
            searchValue={filters.search ?? ''}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search name, ID, department…"
            onReset={() =>
              setFilters({
                search: '',
                departmentId: '',
                designationId: '',
                status: '',
                date: attendanceService.getSettingsToday(),
              })
            }
            filters={
              <>
                <Select
                  label="Department"
                  value={filters.departmentId ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      departmentId: event.target.value,
                      designationId: '',
                    }))
                  }
                  options={[
                    { value: '', label: 'All departments' },
                    ...departments.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
                <Select
                  label="Designation"
                  value={filters.designationId ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, designationId: event.target.value }))
                  }
                  options={[
                    { value: '', label: 'All designations' },
                    ...designations.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
                <Select
                  label="Status"
                  value={filters.status ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: event.target.value as AttendanceFilters['status'],
                    }))
                  }
                  options={TODAY_STATUS_FILTER_OPTIONS}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-200">
                    Date
                  </label>
                  <input
                    type="date"
                    className="field-control"
                    value={filters.date ?? ''}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, date: event.target.value }))
                    }
                  />
                </div>
              </>
            }
          />

          {hasError ? (
            <ErrorState
              title="Unable to load attendance"
              message="Please try again."
              onRetry={() => void load()}
            />
          ) : (
            <DataTable
              isLoading={isLoading}
              isEmpty={!isLoading && rows.length === 0}
              emptyTitle="No attendance records found"
              emptyDescription="Try adjusting filters or mark attendance."
              columnCount={8}
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={row.fullName} src={row.profilePhoto} size="sm" />
                        <span className="font-medium">{row.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.employeeCode}</TableCell>
                    <TableCell>{row.departmentName}</TableCell>
                    <TableCell>
                      {row.attendance?.checkIn ? formatDateTime(row.attendance.checkIn) : '—'}
                    </TableCell>
                    <TableCell>
                      {row.attendance?.checkOut ? formatDateTime(row.attendance.checkOut) : '—'}
                    </TableCell>
                    <TableCell>
                      {attendanceService.formatWorkHours(row.attendance?.workMinutes ?? 0)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      {row.attendance?.lateMinutes
                        ? `${row.attendance.lateMinutes} min`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <TableActions
                        onView={() => navigate(`/attendance/${row.employeeId}`)}
                        onEdit={
                          canManage
                            ? () => {
                                setEditing(row)
                                setModalOpen(true)
                              }
                            : undefined
                        }
                        moreItems={[
                          ...(canManage
                            ? [
                                {
                                  id: 'mark',
                                  label: 'Mark Attendance',
                                  onClick: () => {
                                    setEditing(row)
                                    setModalOpen(true)
                                  },
                                },
                              ]
                            : []),
                          ...(canCorrect
                            ? [
                                {
                                  id: 'correct',
                                  label: 'Correct',
                                  onClick: () => navigate('/attendance/corrections'),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </>
      ) : (
        <p className="text-sm text-surface-500">
          View your{' '}
          <Link className="text-primary-700 underline" to={`/attendance/${selfEmployeeId ?? ''}`}>
            attendance history
          </Link>
          ,{' '}
          <Link className="text-primary-700 underline" to="/attendance/calendar">
            calendar
          </Link>
          , or{' '}
          <Link className="text-primary-700 underline" to="/attendance/corrections">
            correction requests
          </Link>
          .
        </p>
      )}

      <AttendanceFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={onSave}
        isSubmitting={saving}
        title={editing ? 'Edit Attendance' : 'Mark Attendance'}
        employees={employees}
        initialValues={initialFormValues}
        lockEmployee={Boolean(editing)}
      />
    </div>
  )
}
