import type { AttendanceSettings } from './types'

/** Centralized attendance configuration — do not hardcode these values in UI. */
export const attendanceSettings: AttendanceSettings = {
  standardStartTime: '09:30',
  standardEndTime: '18:00',
  gracePeriodMinutes: 15,
  halfDayThresholdHours: 4,
  fullDayHours: 8,
  weeklyOffDays: [0, 6], // Sunday, Saturday
  halfDayAttendanceValue: 0.5,
}
