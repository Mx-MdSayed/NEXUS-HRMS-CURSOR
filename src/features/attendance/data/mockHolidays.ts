import type { Holiday } from '../types'

export const initialHolidays: Holiday[] = [
  {
    id: 'hol-1',
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'public',
    description: 'National public holiday',
  },
  {
    id: 'hol-2',
    name: 'Company Foundation Day',
    date: '2026-08-21',
    type: 'company',
    description: 'Company holiday',
  },
]
