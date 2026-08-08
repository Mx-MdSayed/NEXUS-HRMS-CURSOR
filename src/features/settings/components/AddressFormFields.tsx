import { useFormContext } from 'react-hook-form'
import { Input, Select } from '@/components/ui'
import { TIMEZONE_OPTIONS } from '../utils/nav'

export interface AddressFields {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  timezone?: string
}

interface AddressFormProps {
  showTimezone?: boolean
  prefix?: string
}

/** Reusable address block for company / location forms. */
export function AddressFormFields({ showTimezone = false, prefix = '' }: AddressFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const key = (name: string) => (prefix ? `${prefix}.${name}` : name)
  const err = (name: string) => {
    const path = key(name).split('.')
    let cur: unknown = errors
    for (const part of path) {
      if (!cur || typeof cur !== 'object') return undefined
      cur = (cur as Record<string, unknown>)[part]
    }
    return (cur as { message?: string } | undefined)?.message
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Input label="Address line 1" error={err('addressLine1')} {...register(key('addressLine1'))} />
      </div>
      <div className="md:col-span-2">
        <Input label="Address line 2" error={err('addressLine2')} {...register(key('addressLine2'))} />
      </div>
      <Input label="City" error={err('city')} {...register(key('city'))} />
      <Input label="State / Province" error={err('state')} {...register(key('state'))} />
      <Input label="Country" error={err('country')} {...register(key('country'))} />
      <Input label="Postal code" error={err('postalCode')} {...register(key('postalCode'))} />
      {showTimezone ? (
        <Select
          label="Time zone"
          options={TIMEZONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          error={err('timezone')}
          {...register(key('timezone'))}
        />
      ) : null}
    </div>
  )
}
