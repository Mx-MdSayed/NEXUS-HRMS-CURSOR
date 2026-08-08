import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

/** Detect dirty forms and confirm before leaving. */
export function useUnsavedChanges(isDirty: boolean) {
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const proceedRef = useRef<null | (() => void)>(null)

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setPendingConfirm(true)
      proceedRef.current = () => blocker.proceed()
    }
  }, [blocker])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const confirmLeave = useCallback(() => {
    setPendingConfirm(false)
    proceedRef.current?.()
    proceedRef.current = null
  }, [])

  const cancelLeave = useCallback(() => {
    setPendingConfirm(false)
    proceedRef.current = null
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  return { pendingConfirm, confirmLeave, cancelLeave }
}
