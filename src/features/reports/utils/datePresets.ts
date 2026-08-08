import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
} from 'date-fns'
import type { ReportDatePreset, ReportFilters, ResolvedDateRange } from '../types'

const DATE_KEY = 'yyyy-MM-dd'

function toKey(date: Date): string {
  return format(date, DATE_KEY)
}

export function resolveDateRange(filters: ReportFilters = {}): ResolvedDateRange {
  const preset: ReportDatePreset = filters.preset ?? 'this_month'
  const today = new Date()

  if (preset === 'custom') {
    return {
      startDate: filters.startDate || toKey(startOfMonth(today)),
      endDate: filters.endDate || toKey(today),
      label: 'Custom range',
    }
  }

  if (preset === 'today') {
    return { startDate: toKey(today), endDate: toKey(today), label: 'Today' }
  }

  if (preset === 'this_week') {
    return {
      startDate: toKey(startOfWeek(today, { weekStartsOn: 1 })),
      endDate: toKey(endOfWeek(today, { weekStartsOn: 1 })),
      label: 'This week',
    }
  }

  if (preset === 'last_month') {
    const lastMonth = subMonths(today, 1)
    return {
      startDate: toKey(startOfMonth(lastMonth)),
      endDate: toKey(endOfMonth(lastMonth)),
      label: 'Last month',
    }
  }

  if (preset === 'this_quarter') {
    return {
      startDate: toKey(startOfQuarter(today)),
      endDate: toKey(endOfQuarter(today)),
      label: 'This quarter',
    }
  }

  if (preset === 'this_year') {
    return {
      startDate: toKey(startOfYear(today)),
      endDate: toKey(endOfYear(today)),
      label: 'This year',
    }
  }

  return {
    startDate: toKey(startOfMonth(today)),
    endDate: toKey(endOfMonth(today)),
    label: 'This month',
  }
}

export function rangeToMonthKey(range: ResolvedDateRange): string {
  return range.startDate.slice(0, 7)
}
