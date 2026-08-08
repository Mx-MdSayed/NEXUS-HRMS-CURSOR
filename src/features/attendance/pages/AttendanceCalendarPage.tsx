import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  PageHeader,
  PageLoader,
  Select,
  StatusBadge,
} from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees/services/employeeService'
import { formatDateTime } from '@/utils/date'
import { AttendanceCalendarGrid } from '../components/AttendanceCalendarGrid'
import { attendanceService } from '../services/attendanceService'
import type { CalendarDayAttendance } from '../types'
import { getAttendanceErrorMessage } from '../utils/errors'
import { showError } from '@/utils/toast'

export function AttendanceCalendarPage() {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const isEmployee = hasRole(ROLES.EMPLOYEE)
  const [monthKey, setMonthKey] = useState(format(new Date('2026-08-08'), 'yyyy-MM'))
  const [employeeId, setEmployeeId] = useState('')
  const [selfId, setSelfId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: string; label: string }>>([])
  const [days, setDays] = useState<CalendarDayAttendance[]>([])
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isEmployee && user) {
      void attendanceService.resolveLinkedEmployeeId(user).then((id) => {
        setSelfId(id)
        if (id) setEmployeeId(id)
      })
      return
    }
    void employeeService.getEmployees({ page: 1, pageSize: 200, sortBy: 'fullName' }).then((result) => {
      const options = result.data.map((item) => ({
        id: item.id,
        label: `${item.fullName} (${item.employeeCode})`,
      }))
      setEmployees(options)
      if (!employeeId && options[0]) setEmployeeId(options[0].id)
    })
  }, [employeeId, isEmployee, user])

  useEffect(() => {
    if (!employeeId) return
    if (isEmployee && !selfId) return
    let active = true
    setIsLoading(true)
    setHasError(false)
    void attendanceService
      .getCalendarAttendance(employeeId, monthKey, {
        role: user?.role,
        employeeId: isEmployee ? selfId ?? undefined : undefined,
      })
      .then((result) => {
        if (!active) return
        setDays(result)
        setSelectedDate((prev) => prev ?? result.find((item) => item.date.endsWith('-08'))?.date)
      })
      .catch((error) => {
        if (!active) return
        setHasError(true)
        setErrorMessage(getAttendanceErrorMessage(error, 'Unable to load calendar.'))
        showError(getAttendanceErrorMessage(error, 'Unable to load calendar.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [employeeId, isEmployee, monthKey, selfId, user?.role])

  const selected = days.find((item) => item.date === selectedDate)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Calendar"
        description="Monthly attendance status with day-level details."
        breadcrumbs={[{ label: 'Home' }, { label: 'Attendance' }, { label: 'Calendar' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/attendance/today')}>
            Today
          </Button>
        }
      />

      {!isEmployee ? (
        <Select
          label="Employee"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          options={employees.map((item) => ({ value: item.id, label: item.label }))}
        />
      ) : null}

      {isLoading ? <PageLoader label="Loading calendar" /> : null}
      {hasError ? (
        <ErrorState title="Unable to load calendar" message={errorMessage} />
      ) : !isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardContent className="pt-6">
              {days.length === 0 ? (
                <p className="text-sm text-surface-500">No attendance data available for this month.</p>
              ) : (
                <AttendanceCalendarGrid
                  monthKey={monthKey}
                  days={days}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onMonthChange={setMonthKey}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Day details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Date</p>
                    <p className="font-medium">{selected.date}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={(selected.status ?? 'not_marked') as never} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Check In</p>
                    <p className="font-medium">
                      {selected.record?.checkIn ? formatDateTime(selected.record.checkIn) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Check Out</p>
                    <p className="font-medium">
                      {selected.record?.checkOut ? formatDateTime(selected.record.checkOut) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Work Hours</p>
                    <p className="font-medium">
                      {attendanceService.formatWorkHours(selected.record?.workMinutes ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Late Minutes</p>
                    <p className="font-medium">{selected.record?.lateMinutes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-surface-500">Remarks</p>
                    <p className="font-medium">
                      {selected.record?.remarks || selected.holidayName || '—'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-surface-500">Select a day to view details.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
