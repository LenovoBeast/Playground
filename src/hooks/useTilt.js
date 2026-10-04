import { useCallback, useEffect, useRef } from 'react'

// Pointer-driven 3D tilt. Returns a ref for the tilting surface plus the
// handlers to spread onto its container. The surface needs
// `transform-style: preserve-3d` (Tailwind: preserve-3d) to read as 3D.
export function useTilt({ max = 10, scale = 1.015, lift = 0 } = {}) {
  const ref = useRef(null)
  const frame = useRef(0)

  // Tilt is a pointer-driven 3D transform; without this the browser
  // hijacks the first touch as a scroll on the tilting surface.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.touchAction = 'none'
  }, [])

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current)
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)'
  }, [])

  const onPointerMove = useCallback(
    (event) => {
      const el = ref.current
      if (!el) return
      const rect = event.currentTarget.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const rotateY = (px - 0.5) * 2 * max
        const rotateX = -(py - 0.5) * 2 * max
        el.style.transition = 'transform 0.08s linear'
        el.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(${lift}px) scale(${scale})`
        el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
      })
    },
    [max, scale, lift],
  )

  return { ref, onPointerMove, onPointerLeave: reset, onBlur: reset }
}
