import { useEffect } from 'react'

/**
 * Warns before browser navigation when a form has unsaved changes.
 * Pass `isDirty` from react-hook-form or local state.
 */
export function useUnsavedChangesWarning(isDirty: boolean, message = 'You have unsaved changes.') {
  useEffect(() => {
    if (!isDirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = message
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, message])
}
