import { Select, Input } from '@/components/ui'
import type { ReportDatePreset } from '../types'

const PRESET_OPTIONS: Array<{ label: string; value: ReportDatePreset }> = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This quarter', value: 'this_quarter' },
  { label: 'This year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
]

interface ReportDateFilterProps {
  preset: ReportDatePreset
  startDate?: string
  endDate?: string
  onPresetChange: (value: ReportDatePreset) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

export function ReportDateFilter({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
}: ReportDateFilterProps) {
  return (
    <>
      <Select
        label="Date range"
        value={preset}
        onChange={(event) => onPresetChange(event.target.value as ReportDatePreset)}
        options={PRESET_OPTIONS}
      />
      {preset === 'custom' ? (
        <>
          <Input
            label="From"
            type="date"
            value={startDate ?? ''}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate ?? ''}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </>
      ) : null}
    </>
  )
}
