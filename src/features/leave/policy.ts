import type { LeavePolicyConfig } from './types'

/**
 * Basic leave policy abstraction — expandable later without a full Policy module.
 * Mutated by Module 16 settings; do not hardcode these values inside page components.
 */
const defaults: LeavePolicyConfig = {
  excludeWeekends: true,
  excludeHolidays: true,
  allowHalfDay: true,
  allowNegativeBalanceForPaid: false,
  allowCancelApprovedFuture: true,
  countWeekendsAsLeave: false,
  countHolidaysAsLeave: false,
}

export const leavePolicy: LeavePolicyConfig = { ...defaults }

export function getLeavePolicy(): LeavePolicyConfig {
  return { ...leavePolicy }
}

export function updateLeavePolicy(patch: Partial<LeavePolicyConfig>): LeavePolicyConfig {
  Object.assign(leavePolicy, patch)
  return getLeavePolicy()
}

export function resetLeavePolicy(): LeavePolicyConfig {
  Object.assign(leavePolicy, defaults)
  return getLeavePolicy()
}
