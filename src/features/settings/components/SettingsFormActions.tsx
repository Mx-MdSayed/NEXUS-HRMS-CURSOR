import { ConfirmDialog } from '@/components/ui'
import { Button } from '@/components/ui'

interface SettingsFormActionsProps {
  canSave: boolean
  isSubmitting?: boolean
  isDirty?: boolean
  onCancel: () => void
  onReset?: () => void
  resetLabel?: string
  saveLabel?: string
  warning?: string | null
  pendingLeave?: boolean
  onConfirmLeave?: () => void
  onCancelLeave?: () => void
}

export function SettingsFormActions({
  canSave,
  isSubmitting,
  isDirty,
  onCancel,
  onReset,
  resetLabel = 'Reset',
  saveLabel = 'Save changes',
  warning,
  pendingLeave,
  onConfirmLeave,
  onCancelLeave,
}: SettingsFormActionsProps) {
  return (
    <>
      {warning ? (
        <div
          role="note"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {warning}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
        {canSave ? (
          <Button type="submit" isLoading={isSubmitting} disabled={!isDirty && !isSubmitting}>
            {saveLabel}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        {onReset && canSave ? (
          <Button type="button" variant="ghost" onClick={onReset} disabled={isSubmitting}>
            {resetLabel}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingLeave)}
        onClose={() => onCancelLeave?.()}
        onConfirm={() => onConfirmLeave?.()}
        title="Unsaved changes"
        description="You have unsaved settings. Leave this page and discard changes?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
      />
    </>
  )
}
