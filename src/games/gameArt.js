// Shared game art + HUD. Two jobs:
//
// 1. A DOM HUD layer that sits over any canvas (2D or WebGL) so all six games
//    present score/progress/state the same way, with crisp text instead of
//    low-res canvas glyphs. The accessible score/status rows under the canvas
//    remain the screen-reader surface, so this layer is aria-hidden.
// 2. Procedural texture and shape helpers. The site self-hosts every asset and
//    its CSP forbids remote images, so "better images" here means real generated
//    textures (beveled bricks, faceted orbs, lane markings, starfields) drawn to
//    offscreen canvases and reused — no binary assets, no network cost.
//
// Nothing here touches the DOM at import time: the Node test suite imports it.

// ---------------------------------------------------------------- HUD layer
const CHIP = 'rounded-lg border border-white/12 bg-[#050a18]/78 px-2.5 py-1.5 backdrop-blur-[2px]'
const LABEL = 'font-mono text-[9px] uppercase leading-none tracking-[0.18em] text-zinc-400'
const VALUE = 'mt-0.5 font-mono text-[13px] font-bold leading-none text-white tabular-nums'

/**
 * Overlay a HUD on top of a canvas. `items` is a list of { key, label, align }
 * where align is 'left' | 'center' | 'right'. Returns { set, destroy }.
 * The layer is absolutely positioned inside the canvas's nearest positioned
 * ancestor (the game panel), so the caller must not rely on the canvas being
 * the offset parent.
 */
export function createHudLayer(canvas, items = []) {
  if (!canvas || !canvas.parentElement || typeof document === 'undefined') {
    return { set() {}, destroy() {} }
  }

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.dataset.gameHud = 'true'
  layer.className = 'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5'

  const groups = { left: [], center: [], right: [] }
  const nodes = new Map()

  for (const item of items) {
    const chip = document.createElement('div')
    chip.className = CHIP
    const label = document.createElement('div')
    label.className = LABEL
    label.textContent = item.label
    const value = document.createElement('div')
    value.className = VALUE
    value.textContent = item.initial ?? '—'
    chip.append(label, value)
    nodes.set(item.key, value)
    groups[item.align ?? 'left'].push(chip)
  }

  const wrap = (children, justify) => {
    const box = document.createElement('div')
    box.className = `flex gap-1.5 ${justify}`
    box.append(...children)
    return box
  }
  layer.append(
    wrap(groups.left, 'justify-start'),
    wrap(groups.center, 'justify-center'),
    wrap(groups.right, 'justify-end'),
  )

  const host = canvas.parentElement
  host.append(layer)
  // Keep the HUD aligned with the canvas box even if the canvas is not at 0,0.
  const sync = () => {
    const hostRect = host.getBoundingClientRect()
    const rect = canvas.getBoundingClientRect()
    layer.style.top = `${rect.top - hostRect.top}px`
    layer.style.left = `${rect.left - hostRect.left}px`
    layer.style.width = `${rect.width}px`
    layer.style.right = 'auto'
  }
  sync()
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
  observer?.observe(canvas)
  window.addEventListener('resize', sync)

  return {
    set(values = {}) {
      for (const [key, node] of nodes) {
        if (!(key in values)) continue
        const next = values[key]
        if (node.textContent !== String(next)) node.textContent = String(next)
      }
    },
    destroy() {
      observer?.disconnect()
      window.removeEventListener('resize', sync)
      layer.remove()
    },
  }
}

// ---------------------------------------------------------------- canvas shapes
export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius)
    return
  }
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// A bevelled panel, used for in-world signs, banners and gauges.
export function drawPanel(ctx, x, y, w, h, { radius = 10, fill = 'rgba(5,10,24,0.82)', stroke = 'rgba(255,255,255,0.16)', accent } = {}) {
  roundRect(ctx, x, y, w, h, radius)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.lineWidth = 1
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
  if (accent) {
    roundRect(ctx, x, y, w, Math.max(2, h * 0.06), radius)
    ctx.fillStyle = accent
    ctx.fill()
  }
}

export function drawVignette(ctx, width, height, strength = 0.5) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.32,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, `rgba(2,4,10,${strength})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function drawInnerFrame(ctx, width, height, { radius = 14, color = 'rgba(255,255,255,0.10)' } = {}) {
  roundRect(ctx, 1.5, 1.5, width - 3, height - 3, radius)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
}

// A soft shadow ellipse, so characters read as standing on a surface.
export function drawGroundShadow(ctx, x, y, radiusX, radiusY = radiusX * 0.32, alpha = 0.32) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radiusX)
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, radiusY / radiusX)
  ctx.beginPath()
  ctx.arc(0, 0, radiusX, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()
}

// ---------------------------------------------------------------- textures
function makeCanvas(size) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

// A crystalline brick: flat face, bevelled edges, a highlight facet. Replaces
// the old plain colour box, which read as a flat rectangle at any angle.
export function makeBrickTexture({ color, accent, size = 128, seed = 1 } = {}) {
  const canvas = makeCanvas(size)
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  const pad = size * 0.06
  const inner = size - pad * 2

  ctx.fillStyle = 'rgba(4,8,20,0.9)'
  ctx.fillRect(0, 0, size, size)

  const face = ctx.createLinearGradient(0, pad, 0, size - pad)
  face.addColorStop(0, accent ?? color)
  face.addColorStop(0.55, color)
  face.addColorStop(1, 'rgba(6,10,24,0.92)')
  roundRect(ctx, pad, pad, inner, inner, size * 0.14)
  ctx.fillStyle = face
  ctx.fill()

  // facet highlight
  ctx.save()
  roundRect(ctx, pad, pad, inner, inner, size * 0.14)
  ctx.clip()
  ctx.beginPath()
  ctx.moveTo(pad, size - pad)
  ctx.lineTo(size - pad, pad)
  ctx.lineTo(size - pad, pad + inner * 0.28)
  ctx.lineTo(pad + inner * 0.28, size - pad)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fill()
  ctx.restore()

  // rim
  roundRect(ctx, pad, pad, inner, inner, size * 0.14)
  ctx.lineWidth = Math.max(1, size * 0.02)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.stroke()

  // rivets in the corners
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  const r = size * 0.022
  for (const [cx, cy] of [[pad * 1.9, pad * 1.9], [size - pad * 1.9, pad * 1.9], [pad * 1.9, size - pad * 1.9], [size - pad * 1.9, size - pad * 1.9]]) {
    ctx.beginPath()
    ctx.arc(cx + (seed % 2), cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

// A holographic orb: bright core, latitude bands, rim light.
export function makeOrbTexture({ core = '#4fdfff', glow = '#138aa3', size = 256 } = {}) {
  const canvas = makeCanvas(size)
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  const mid = size / 2

  const body = ctx.createRadialGradient(mid * 0.72, mid * 0.66, size * 0.04, mid, mid, mid)
  body.addColorStop(0, '#ffffff')
  body.addColorStop(0.28, core)
  body.addColorStop(1, glow)
  ctx.beginPath()
  ctx.arc(mid, mid, mid, 0, Math.PI * 2)
  ctx.fillStyle = body
  ctx.fill()

  // latitude bands give the sphere a holographic read
  ctx.save()
  ctx.beginPath()
  ctx.arc(mid, mid, mid * 0.98, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = size * 0.012
  for (let i = 1; i <= 4; i++) {
    const y = mid + (i - 2.5) * size * 0.18
    ctx.beginPath()
    ctx.ellipse(mid, y, mid * 0.96, size * 0.05, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.beginPath()
  ctx.arc(mid, mid, mid * 0.97, 0, Math.PI * 2)
  ctx.lineWidth = size * 0.02
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.stroke()
  return canvas
}

// Track surface: dark rail with a repeating lane stripe and edge glow.
export function makeTrackTexture({ base = '#22304d', stripe = 'rgba(79,223,255,0.5)', size = 128 } = {}) {
  const canvas = makeCanvas(size)
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = stripe
  ctx.fillRect(0, size * 0.46, size, size * 0.08)
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  for (let i = 0; i < 4; i++) ctx.fillRect(i * size * 0.25, 0, size * 0.03, size)
  return canvas
}

// Circuit-board ground tile for Bytefall: hatched traces plus a node pad.
export function makeCircuitTexture({ base = '#1b2440', trace = 'rgba(79,223,255,0.16)', size = 128 } = {}) {
  const canvas = makeCanvas(size)
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = trace
  ctx.lineWidth = Math.max(1, size * 0.012)
  ctx.beginPath()
  ctx.moveTo(size * 0.5, 0); ctx.lineTo(size * 0.5, size * 0.35)
  ctx.moveTo(size * 0.5, size * 0.65); ctx.lineTo(size * 0.5, size)
  ctx.moveTo(0, size * 0.5); ctx.lineTo(size * 0.35, size * 0.5)
  ctx.moveTo(size * 0.65, size * 0.5); ctx.lineTo(size, size * 0.5)
  ctx.stroke()
  ctx.fillStyle = 'rgba(79,223,255,0.22)'
  ctx.beginPath()
  ctx.arc(size * 0.5, size * 0.5, size * 0.055, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

// A starfield tile for backgrounds, deterministic so it never flickers.
export function makeStarTexture({ size = 512, count = 90, tint = 'rgba(180,220,255,0.9)' } = {}) {
  const canvas = makeCanvas(size)
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  for (let i = 0; i < count; i++) {
    const seed = Math.sin(i * 12.9898) * 43758.5453
    const seed2 = Math.sin(i * 78.233) * 12345.6789
    const x = Math.abs(seed % 1) * size
    const y = Math.abs(seed2 % 1) * size
    const r = 0.6 + Math.abs((seed * seed2) % 1) * 1.6
    ctx.globalAlpha = 0.35 + Math.abs((seed + seed2) % 1) * 0.55
    ctx.fillStyle = tint
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return canvas
}

// Distinct candy silhouettes. Matching by SHAPE as well as colour means the
// board stays readable for colour-blind players.
export const CANDY_SHAPES = ['circle', 'diamond', 'hex', 'triangle', 'square', 'star']

export function drawCandyShape(ctx, shape, x, y, radius) {
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(x, y, radius, 0, Math.PI * 2)
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - radius)
    ctx.lineTo(x + radius, y)
    ctx.lineTo(x, y + radius)
    ctx.lineTo(x - radius, y)
    ctx.closePath()
  } else if (shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - radius)
    ctx.lineTo(x + radius * 0.92, y + radius * 0.72)
    ctx.lineTo(x - radius * 0.92, y + radius * 0.72)
    ctx.closePath()
  } else if (shape === 'square') {
    const s = radius * 0.82
    roundRect(ctx, x - s, y - s, s * 2, s * 2, radius * 0.34)
  } else {
    // star
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2
      const r = i % 2 ? radius * 0.48 : radius
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
  }
  ctx.closePath()
}
