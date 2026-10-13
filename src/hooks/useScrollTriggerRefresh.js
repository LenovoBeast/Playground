import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Recomputes every ScrollTrigger start/end position when the page layout
// changes. Without this, triggers keep the coordinates from mount and fire at
// the wrong scroll offsets — e.g. after the project filter adds/removes cards
// and the document gets taller, or a tab swap replaces panel content.
//
// Call it with the state that mutates layout (filter value, active tab, route).
export function useScrollTriggerRefresh(dep) {
  useEffect(() => {
    // Defer a frame: the DOM has to finish its layout mutation (AnimatePresence
    // exits, image decode) before measurements mean anything.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(raf)
  }, [dep])
}
