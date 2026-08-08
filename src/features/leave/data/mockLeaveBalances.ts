import { computeAvailableBalance } from '../utils/calculations'
import type { LeaveBalance } from '../types'
import { LEAVE_DEMO_YEAR } from '../constants'

const now = '2026-08-07T10:00:00.000Z'

function bal(
  employeeId: string,
  leaveTypeId: string,
  allocated: number,
  used: number,
  pending: number,
  carryForward = 0,
  openingBalance = 0,
  adjustment = 0,
): LeaveBalance {
  const base = {
    id: `lb-${employeeId}-${leaveTypeId}-${LEAVE_DEMO_YEAR}`,
    employeeId,
    leaveTypeId,
    year: LEAVE_DEMO_YEAR,
    openingBalance,
    allocated,
    carryForward,
    used,
    pending,
    adjustment,
    available: 0,
    updatedAt: now,
    updatedBy: 'System',
  }
  return { ...base, available: computeAvailableBalance(base) }
}

/** Paid leave types only for balance seeding (CL, SL, EL, COMP, PL for males, ML for females). */
export const initialLeaveBalances: LeaveBalance[] = [
  // Eden Employee
  bal('emp-1003', 'lt-cl', 12, 2, 1),
  bal('emp-1003', 'lt-sl', 10, 1, 0),
  bal('emp-1003', 'lt-el', 18, 3, 0, 3),
  bal('emp-1003', 'lt-comp', 5, 0, 0),
  // Rahul Sharma
  bal('emp-2041', 'lt-cl', 12, 1, 2),
  bal('emp-2041', 'lt-sl', 10, 0, 0),
  bal('emp-2041', 'lt-el', 18, 5, 0, 2),
  bal('emp-2041', 'lt-pl', 10, 0, 0),
  // Priya Nair
  bal('emp-1988', 'lt-cl', 12, 3, 0),
  bal('emp-1988', 'lt-sl', 10, 2, 0),
  bal('emp-1988', 'lt-el', 18, 4, 0, 3),
  bal('emp-1988', 'lt-ml', 90, 0, 0),
  // Daniel Okonkwo
  bal('emp-2110', 'lt-cl', 12, 0, 0),
  bal('emp-2110', 'lt-sl', 10, 0, 0),
  bal('emp-2110', 'lt-el', 18, 0, 5, 1),
  bal('emp-2110', 'lt-pl', 10, 0, 0),
  // Mei Chen
  bal('emp-1875', 'lt-cl', 12, 4, 0),
  bal('emp-1875', 'lt-sl', 10, 1, 0),
  bal('emp-1875', 'lt-el', 18, 6, 0, 3),
  bal('emp-1875', 'lt-ml', 90, 0, 0),
  // Harper HR
  bal('emp-1002', 'lt-cl', 12, 1, 0),
  bal('emp-1002', 'lt-sl', 10, 0, 0),
  bal('emp-1002', 'lt-el', 18, 2, 0, 2),
  // Ava Admin
  bal('emp-1001', 'lt-cl', 12, 0, 0),
  bal('emp-1001', 'lt-sl', 10, 0, 0),
  bal('emp-1001', 'lt-el', 18, 1, 0, 3),
  // Additional employees
  bal('emp-2201', 'lt-cl', 12, 2, 0),
  bal('emp-2201', 'lt-sl', 10, 0, 1),
  bal('emp-2201', 'lt-el', 18, 0, 0),
  bal('emp-2202', 'lt-cl', 12, 0, 0),
  bal('emp-2202', 'lt-sl', 10, 3, 0),
  bal('emp-2202', 'lt-el', 18, 2, 0, 1),
  bal('emp-2198', 'lt-cl', 12, 1, 0),
  bal('emp-2198', 'lt-sl', 10, 0, 0),
  bal('emp-2198', 'lt-el', 18, 8, 0, 3),
  bal('emp-2195', 'lt-cl', 12, 0, 0),
  bal('emp-2195', 'lt-sl', 10, 0, 0),
  bal('emp-2195', 'lt-el', 18, 0, 0),
]
