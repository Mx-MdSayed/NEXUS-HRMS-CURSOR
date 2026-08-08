import { AuthServiceError } from '@/services/auth'
import { AttendanceServiceError } from '@/features/attendance/services/errors'
import { EmployeeServiceError } from '@/features/employees/services/employeeService'
import { LeaveServiceError } from '@/features/leave/services/errors'
import { PayslipServiceError } from '@/features/payslip/services/errors'
import { SalaryServiceError } from '@/features/salary/services/errors'
import { EssServiceError } from '../services/errors'

export function getEssErrorMessage(error: unknown, fallback = 'Unable to complete the request.'): string {
  if (
    error instanceof EssServiceError ||
    error instanceof AttendanceServiceError ||
    error instanceof EmployeeServiceError ||
    error instanceof LeaveServiceError ||
    error instanceof PayslipServiceError ||
    error instanceof SalaryServiceError ||
    error instanceof AuthServiceError
  ) {
    return error.message
  }

  return fallback
}
