import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Traps Tab focus inside `ref` while `active`, closes on Escape, and restores
// focus to whatever was focused before activation. The game overlay has done
// this inline for a while; this is that logic, shared.
export function useFocusTrap(ref, active, { onEscape } = {}) {
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    restoreRef.current = document.activeElement
    const focusable = () => Array.from(container.querySelectorAll(FOCUSABLE))
    focusable()[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      // Return focus where the user left it (the toggle button).
      restoreRef.current?.focus?.()
    }
  }, [ref, active, onEscape])
}
