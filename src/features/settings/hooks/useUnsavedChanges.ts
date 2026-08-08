import { useCallback, useEffect, useState } from 'react'

/**
 * Detect dirty forms and warn before leaving.
 * Uses beforeunload for browser navigation.
 * In-app leave confirmation is exposed via requestLeave() for Cancel actions.
 * (useBlocker requires a data router; this app uses BrowserRouter.)
 */
export function useUnsavedChanges(isDirty: boolean) {
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const [leaveAction, setLeaveAction] = useState<null | (() => void)>(null)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const requestLeave = useCallback(
    (action?: () => void) => {
      if (!isDirty) {
        action?.()
        return
      }
      setLeaveAction(() => action ?? null)
      setPendingConfirm(true)
    },
    [isDirty],
  )

  const confirmLeave = useCallback(() => {
    setPendingConfirm(false)
    const action = leaveAction
    setLeaveAction(null)
    action?.()
  }, [leaveAction])

  const cancelLeave = useCallback(() => {
    setPendingConfirm(false)
    setLeaveAction(null)
  }, [])

  return { pendingConfirm, confirmLeave, cancelLeave, requestLeave, isDirty }
}
