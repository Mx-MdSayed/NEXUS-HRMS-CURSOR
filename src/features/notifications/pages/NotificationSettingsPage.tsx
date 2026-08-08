import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Switch } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { showError, showSuccess } from '@/utils/toast'
import { notificationPreferenceService } from '../services/notificationPreferenceService'
import { notificationTriggerService } from '../services/notificationTriggerService'
import type { NotificationPreference } from '../types'

export function NotificationSettingsPage() {
  const { user } = useAuth()
  const [recipientId, setRecipientId] = useState('')
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])

  useEffect(() => {
    if (!user) return
    void notificationTriggerService.resolveLinkedEmployeeId(user).then(async (id) => {
      const resolved = id || user.id
      setRecipientId(resolved)
      setPreferences(await notificationPreferenceService.getPreferences(resolved))
    })
  }, [user])

  const update = async (eventCode: string, enabled: boolean) => {
    try {
      const next = await notificationPreferenceService.updatePreference(recipientId, eventCode, enabled)
      setPreferences((rows) => rows.map((row) => (row.eventCode === eventCode ? next : row)))
      showSuccess('Notification preference updated.')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unable to update preference.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-50">Notification Settings</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">Manage optional in-app notification preferences. Mandatory workflow alerts stay enabled.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {preferences.map((preference) => (
            <label key={preference.eventCode} className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 p-3 dark:border-surface-800">
              <span>
                <span className="block text-sm font-medium">{preference.eventCode.replaceAll('_', ' ')}</span>
                <span className="text-xs text-surface-500">{preference.mandatory ? 'Mandatory event' : 'Optional event'}</span>
              </span>
              <Switch
                checked={preference.enabled}
                disabled={preference.mandatory}
                onCheckedChange={(checked) => update(preference.eventCode, checked)}
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
