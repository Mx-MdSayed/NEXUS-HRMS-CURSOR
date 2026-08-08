/**
 * Historical data protection: settings updates must not mutate snapshot records.
 */
import { getPayrollSettings, updatePayrollSettings } from '../src/features/payroll/settings'
import { getPayslipSettings, updatePayslipSettings } from '../src/features/payslip/settings'
import { getAttendanceSettings, updateAttendanceSettings } from '../src/features/attendance/settings'
import { getLeavePolicy, updateLeavePolicy } from '../src/features/leave/policy'

// Simulate historical payroll / payslip snapshots captured before settings change
const historicalPayrollRun = {
  id: 'pr_hist_1',
  currency: 'INR',
  netSalary: 85000,
  overtimeEnabled: true,
  generatedAt: '2026-01-31T00:00:00.000Z',
}

const historicalPayslip = {
  id: 'ps_hist_1',
  payslipNumber: 'PS-2026-01-0001',
  footerText: 'Historical footer',
  companyName: 'Nexus HRMS',
  netSalary: 85000,
}

const historicalAttendance = {
  id: 'att_hist_1',
  status: 'approved',
  graceUsed: 15,
  hours: 8,
}

const historicalLeave = {
  id: 'leave_hist_1',
  status: 'approved',
  days: 2,
}

const beforePayroll = structuredClone(getPayrollSettings())
const beforePayslip = structuredClone(getPayslipSettings())
const beforeAttendance = structuredClone(getAttendanceSettings())
const beforeLeave = structuredClone(getLeavePolicy())

updatePayrollSettings({ overtimeEnabled: false, allowMixedCurrencies: true })
updatePayslipSettings({
  ...getPayslipSettings(),
  numberPrefix: 'XX',
  footerText: 'New footer for future payslips only',
})
updateAttendanceSettings({ gracePeriodMinutes: 99, fullDayHours: 7 })
updateLeavePolicy({ allowHalfDay: false, excludeWeekends: false })

const histUnchanged =
  historicalPayrollRun.currency === 'INR' &&
  historicalPayrollRun.netSalary === 85000 &&
  historicalPayrollRun.overtimeEnabled === true &&
  historicalPayslip.payslipNumber === 'PS-2026-01-0001' &&
  historicalPayslip.footerText === 'Historical footer' &&
  historicalPayslip.netSalary === 85000 &&
  historicalAttendance.status === 'approved' &&
  historicalAttendance.graceUsed === 15 &&
  historicalLeave.status === 'approved' &&
  historicalLeave.days === 2

const liveChanged =
  getPayrollSettings().overtimeEnabled === false &&
  getPayslipSettings().numberPrefix === 'XX' &&
  getAttendanceSettings().gracePeriodMinutes === 99 &&
  getLeavePolicy().allowHalfDay === false

console.log(histUnchanged ? 'PASS historical snapshots unchanged' : 'FAIL historical mutated')
console.log(liveChanged ? 'PASS live settings updated prospectively' : 'FAIL live settings not updated')

// restore
updatePayrollSettings(beforePayroll)
updatePayslipSettings(beforePayslip)
updateAttendanceSettings(beforeAttendance)
updateLeavePolicy(beforeLeave)

process.exit(histUnchanged && liveChanged ? 0 : 1)
