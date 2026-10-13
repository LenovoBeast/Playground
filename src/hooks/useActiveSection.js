import { useEffect, useState } from 'react'
import { subscribeScroll } from './scrollSignal.js'

// Returns the id of the section currently occupying the reader's attention.
// Used by the sticky header for scroll-spy and by the 3D constellation to
// light up the matching node.
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] ?? '')
  const key = ids.join(',')

  useEffect(() => {
    const list = key.split(',').filter(Boolean)
    if (!list.length) return

    const measure = () => {
      const marker = window.scrollY + window.innerHeight * 0.38
      let current = list[0]
      for (const id of list) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= marker) current = id
      }
      // At the very bottom of the page the last section always wins.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = list[list.length - 1]
      }
      setActive(current)
    }

    // Shared scroll signal: one listener + one rAF for the whole page.
    return subscribeScroll(measure)
  }, [key])

  return [active, setActive]
}

// Smooth, easing-aware scroll that accounts for the sticky header height.
export function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const offset = window.innerWidth < 768 ? 72 : 92
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: Math.max(top, 0), behavior: reduced ? 'auto' : 'smooth' })
}
