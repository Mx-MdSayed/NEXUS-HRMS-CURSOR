import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Select,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { ROLES } from '@/constants/roles'
import { useAuth } from '@/contexts/AuthContext'
import { employeeService } from '@/features/employees/services/employeeService'
import { attendanceService } from '../services/attendanceService'
import type { AttendanceFilters, AttendanceSummaryRow } from '../types'

export function AttendanceSummaryPage() {
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const isEmployee = hasRole(ROLES.EMPLOYEE)

  const [filters, setFilters] = useState<AttendanceFilters>({
    month: '2026-08',
    departmentId: '',
    employeeId: '',
    search: '',
  })
  const [rows, setRows] = useState<AttendanceSummaryRow[]>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [employees, setEmployees] = useState<Array<{ id: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)

  useEffect(() => {
    void employeeService.getDepartments().then((items) =>
      setDepartments(items.map((item) => ({ id: item.id, name: item.name }))),
    )
    void employeeService.getEmployees({ page: 1, pageSize: 200 }).then((result) =>
      setEmployees(
        result.data.map((item) => ({
          id: item.id,
          label: `${item.fullName} (${item.employeeCode})`,
        })),
      ),
    )
  }, [])

  useEffect(() => {
    if (isEmployee && user) {
      void attendanceService.resolveLinkedEmployeeId(user).then((id) => {
        setSelfId(id)
        if (id) setFilters((prev) => ({ ...prev, employeeId: id }))
      })
    }
  }, [isEmployee, user])

  const load = useCallback(async () => {
    if (isEmployee && !selfId) return
    setIsLoading(true)
    setHasError(false)
    try {
      const scopedFilters =
        isEmployee && selfId ? { ...filters, employeeId: selfId } : filters
      const result = await attendanceService.getAttendanceSummary(scopedFilters)
      setRows(result.rows)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [filters, isEmployee, selfId])

  useEffect(() => {
    if (isEmployee && !selfId) return
    void load()
  }, [isEmployee, load, selfId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Attendance Summary"
        description="Working days, status totals and attendance percentage."
        breadcrumbs={[{ label: 'Home' }, { label: 'Attendance' }, { label: 'Summary' }]}
        actions={
          <Button variant="outline" onClick={() => navigate('/attendance/today')}>
            Today
          </Button>
        }
      />

      <FilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search employee…"
        onReset={() =>
          setFilters({
            month: '2026-08',
            departmentId: '',
            employeeId: isEmployee ? selfId ?? '' : '',
            search: '',
          })
        }
        filters={
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Month</label>
              <input
                type="month"
                className="field-control"
                value={filters.month ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, month: event.target.value }))
                }
              />
            </div>
            {!isEmployee ? (
              <>
                <Select
                  label="Department"
                  value={filters.departmentId ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, departmentId: event.target.value }))
                  }
                  options={[
                    { value: '', label: 'All departments' },
                    ...departments.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
                <Select
                  label="Employee"
                  value={filters.employeeId ?? ''}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, employeeId: event.target.value }))
                  }
                  options={[
                    { value: '', label: 'All employees' },
                    ...employees.map((item) => ({ value: item.id, label: item.label })),
                  ]}
                />
              </>
            ) : null}
          </>
        }
      />

      {hasError ? (
        <ErrorState title="Unable to load summary" message="Please try again." onRetry={() => void load()} />
      ) : (
        <DataTable
          isLoading={isLoading}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No attendance records found"
          emptyDescription="No summary data for the selected filters."
          columnCount={10}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Half Day</TableHead>
              <TableHead>Leave</TableHead>
              <TableHead>Holiday</TableHead>
              <TableHead>Week Off</TableHead>
              <TableHead>Total Work Hours</TableHead>
              <TableHead>Attendance %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.employeeId}
                className="cursor-pointer"
                onClick={() => navigate(`/attendance/${row.employeeId}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-surface-500">
                      {row.employeeCode} · {row.departmentName}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{row.workingDays}</TableCell>
                <TableCell>{row.present}</TableCell>
                <TableCell>{row.absent}</TableCell>
                <TableCell>{row.late}</TableCell>
                <TableCell>{row.halfDay}</TableCell>
                <TableCell>{row.onLeave}</TableCell>
                <TableCell>{row.holiday}</TableCell>
                <TableCell>{row.weekOff}</TableCell>
                <TableCell>{attendanceService.formatWorkHours(row.totalWorkMinutes)}</TableCell>
                <TableCell>{row.attendancePercentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <p className="text-xs text-surface-500">
        Month shown: {filters.month ? format(new Date(`${filters.month}-01`), 'MMMM yyyy') : '—'}. Half
        day counts as 0.5 toward attendance percentage.
      </p>
    </div>
  )
}
