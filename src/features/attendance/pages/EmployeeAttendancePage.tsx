import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  ErrorState,
  PageHeader,
  PageLoader,
  StatusBadge,
  StatCard,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees/services/employeeService'
import {
  getDepartmentNameById,
  getDesignationNameById,
} from '@/features/organization/data/orgDb'
import { formatDate, formatDateTime } from '@/utils/date'
import { attendanceService } from '../services/attendanceService'
import type { AttendanceRecord, EmployeeAttendanceStats } from '../types'
import type { EmployeeListItem } from '@/features/employees/types'
import { getAttendanceErrorMessage } from '../utils/errors'

export function EmployeeAttendancePage() {
  const { employeeId = '' } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const isEmployee = hasRole(ROLES.EMPLOYEE)

  const [monthKey, setMonthKey] = useState('2026-08')
  const [employee, setEmployee] = useState<EmployeeListItem | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<EmployeeAttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selfId, setSelfId] = useState<string | null>(null)

  useEffect(() => {
    if (isEmployee && user) {
      void attendanceService.resolveLinkedEmployeeId(user).then(setSelfId)
    }
  }, [isEmployee, user])

  useEffect(() => {
    if (!employeeId) return
    if (isEmployee && !selfId) return
    let active = true
    setIsLoading(true)
    setHasError(false)
    void attendanceService
      .getEmployeeAttendancePage(employeeId, monthKey, {
        role: user?.role,
        employeeId: selfId ?? undefined,
      })
      .then(async (result) => {
        if (!active) return
        let emp = result.employee
        if (emp.departmentName === emp.departmentId || emp.designationName === emp.designationId) {
          try {
            const full = await employeeService.getEmployeeById(emp.id)
            emp = {
              ...emp,
              departmentName: getDepartmentNameById(full.departmentId),
              designationName: getDesignationNameById(full.designationId),
            }
          } catch {
            emp = {
              ...emp,
              departmentName: getDepartmentNameById(emp.departmentId),
              designationName: getDesignationNameById(emp.designationId),
            }
          }
        }
        setEmployee(emp)
        setRecords(result.records)
        setStats(result.stats)
      })
      .catch((error) => {
        if (!active) return
        setHasError(true)
        setErrorMessage(getAttendanceErrorMessage(error, 'Unable to load employee attendance.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [employeeId, monthKey, selfId, user?.role])

  if (isEmployee && selfId && employeeId !== selfId) {
    return <Navigate to={`/attendance/${selfId}`} replace />
  }

  if (isLoading) return <PageLoader label="Loading employee attendance" />
  if (hasError || !employee || !stats) {
    return (
      <ErrorState
        title="Unable to load attendance"
        message={errorMessage || 'Please try again.'}
        onRetry={() => navigate(0)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        description={`${employee.employeeCode} · ${employee.departmentName} · ${employee.designationName}`}
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Attendance', href: '/attendance' },
          { label: employee.fullName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              type="month"
              className="field-control w-auto"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              aria-label="Select month"
            />
            <Button variant="outline" onClick={() => navigate('/attendance/calendar')}>
              Calendar
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <Avatar name={employee.fullName} src={employee.profilePhoto} size="lg" />
          <div>
            <p className="font-display text-xl font-semibold">{employee.fullName}</p>
            <p className="text-sm text-surface-500">
              {employee.employeeCode} · Joined {formatDate(employee.joiningDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Present Days" value={String(stats.presentDays)} />
        <StatCard title="Absent Days" value={String(stats.absentDays)} />
        <StatCard title="Late Days" value={String(stats.lateDays)} />
        <StatCard title="Half Days" value={String(stats.halfDays)} />
        <StatCard title="Leave Days" value={String(stats.leaveDays)} />
        <StatCard
          title="Average Work Hours"
          value={attendanceService.formatWorkHours(stats.averageWorkMinutes)}
          description={`Attendance ${stats.attendancePercentage}% · ${format(new Date(`${monthKey}-01`), 'MMM yyyy')}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            isEmpty={records.length === 0}
            emptyTitle="No attendance records found"
            emptyDescription="No attendance data available for this month."
          >
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>
                    {record.checkIn ? formatDateTime(record.checkIn) : '—'}
                  </TableCell>
                  <TableCell>
                    {record.checkOut ? formatDateTime(record.checkOut) : '—'}
                  </TableCell>
                  <TableCell>{attendanceService.formatWorkHours(record.workMinutes)}</TableCell>
                  <TableCell>{record.lateMinutes ? `${record.lateMinutes} min` : '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>{record.remarks || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
