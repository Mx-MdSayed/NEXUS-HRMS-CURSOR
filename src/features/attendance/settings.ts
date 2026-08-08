import type { AttendanceSettings } from './types'

const defaults: AttendanceSettings = {
  standardStartTime: '09:30',
  standardEndTime: '18:00',
  gracePeriodMinutes: 15,
  halfDayThresholdHours: 4,
  fullDayHours: 8,
  weeklyOffDays: [0, 6],
  halfDayAttendanceValue: 0.5,
}

/** Mutable attendance configuration — update via settings module; do not hardcode in UI. */
export const attendanceSettings: AttendanceSettings = { ...defaults }

export function getAttendanceSettings(): AttendanceSettings {
  return { ...attendanceSettings }
}

export function updateAttendanceSettings(patch: Partial<AttendanceSettings>): AttendanceSettings {
  Object.assign(attendanceSettings, patch)
  return getAttendanceSettings()
}

export function resetAttendanceSettings(): AttendanceSettings {
  Object.assign(attendanceSettings, defaults)
  return getAttendanceSettings()
}
