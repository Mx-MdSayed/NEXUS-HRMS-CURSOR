import type { LeavePolicyConfig } from './types'

/**
 * Basic leave policy abstraction — expandable later without a full Policy module.
 * Do not hardcode these values inside page components.
 */
export const leavePolicy: LeavePolicyConfig = {
  excludeWeekends: true,
  excludeHolidays: true,
  allowHalfDay: true,
  allowNegativeBalanceForPaid: false,
  allowCancelApprovedFuture: true,
  countWeekendsAsLeave: false,
  countHolidaysAsLeave: false,
}
