// Bytefall — canvas engine. Drawing, input, and the frame loop only; all rules
// live in bytefallLogic.js. Same contract as the other games:
//   createBytefall(canvas, scoreEl, statusEl) -> { start, stop }
// Art is entirely procedural: Bit is a cube-bot, mites are glitch-cubes, cache
// blocks are amber tiles, the goal is a terminal flag. No external assets.
import {
  createBytefallState,
  stepBytefall,
  LEVELS,
  T,
  VIEW_W,
  PLAYER_W,
  PLAYER_H,
  MAX_LIVES,
} from './bytefallLogic.js'
import { playBeep } from './sound.js'

const PALETTE = {
  skyTop: '#0a1024',
  skyBottom: '#050810',
  grid: 'rgba(79, 223, 255, 0.07)',
  cityNear: '#1e2b4d',
  cityFar: '#141d38',
  ground: '#1b2440',
  groundEdge: '#4fdfff',
  block: '#ef9f27',
  blockDark: '#8a5a12',
  power: '#22d3ee',
  oneway: '#5b6b8f',
  platform: '#6d5bd0',
  bit: '#378add',
  bitLight: '#85b7eb',
  mite: '#d4537e',
  miteDark: '#7a2144',
  packet: '#efc94c',
  flag: '#e24b4a',
  pole: '#b4b2a9',
}

const BEST_KEY = 'bytefall-best'

export function createBytefall(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot create a 2D game canvas.')

  let state = createBytefallState(0)
  let frame = 0
  let resizeObserver = null
  let lastTime = 0
  let paused = false
  let best = 0
  let touchMode = false
  let hud = { score: -1, lives: -1, level: -1, time: -1 }

  try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    best = 0
  }

  // ---------------------------------------------------------------- input
  const held = { left: false, right: false, jump: false }
  const pointers = new Map()
  let padRects = { left: null, right: null, jump: null }

  const isTouchDevice = () =>
    (typeof window !== 'undefined' && 'ontouchstart' in window) ||
    (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)

  function setKey(event, down) {
    const k = event.key
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { held.left = down; return true }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { held.right = down; return true }
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { held.jump = down; return true }
    return false
  }

  function onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      restart()
      return
    }
    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault()
      paused = !paused
      announce()
      return
    }
    if (setKey(event, true)) event.preventDefault()
  }

  function onKeyUp(event) {
    if (setKey(event, false)) event.preventDefault()
  }

  function onPointerDown(event) {
    if (!touchMode) return
    canvas.setPointerCapture?.(event.pointerId)
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    applyTouch()
  }

  function onPointerMove(event) {
    if (!touchMode || !pointers.has(event.pointerId)) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    applyTouch()
  }

  function onPointerUp(event) {
    if (!touchMode) return
    pointers.delete(event.pointerId)
    applyTouch()
  }

  // Touch pad hit-testing: the pad is drawn on the canvas, so the buttons are
  // plain rectangles in canvas space.
  function applyTouch() {
    const rect = canvas.getBoundingClientRect()
    let left = false
    let right = false
    let jump = false
    for (const point of pointers.values()) {
      const x = point.x - rect.left
      const y = point.y - rect.top
      for (const [name, box] of Object.entries(padRects)) {
        if (!box) continue
        if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
          if (name === 'left') left = true
          if (name === 'right') right = true
          if (name === 'jump') jump = true
        }
      }
    }
    held.left = left
    held.right = right
    held.jump = jump
  }

  // ---------------------------------------------------------------- sizing
  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(canvas.clientWidth, 1) * pixelRatio
    canvas.height = Math.max(canvas.clientHeight, 1) * pixelRatio
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    buildSkyCache()
  }

  // The parallax skyline is static art: baking it once per resize turns ~1200
  // fillRect calls per frame into two drawImage tiles.
  const SKY_TILE = 1600
  let skyCache = null

  function buildSkyCache() {
    if (typeof document === 'undefined') return
    const height = Math.max(canvas.clientHeight, 1)
    const make = (layer) => {
      const tile = document.createElement('canvas')
      tile.width = SKY_TILE
      tile.height = height
      const g = tile.getContext('2d')
      const base = height - 34 - 6 + layer * 8
      g.fillStyle = layer ? PALETTE.cityNear : PALETTE.cityFar
      for (let i = 0; i * 58 < SKY_TILE; i++) {
        const seed = Math.sin(i * 12.9898 + layer * 78.233) * 43758.5453
        const h = 26 + (Math.abs(seed) % 1) * 64
        const w = 26 + (Math.abs(seed * 1.7) % 1) * 34
        const x = i * 58
        g.fillRect(x, base - h, w, h)
        if (layer) {
          g.fillStyle = 'rgba(79,223,255,0.16)'
          for (let wy = base - h + 8; wy < base - 6; wy += 12) {
            for (let wx = x + 5; wx < x + w - 6; wx += 11) {
              if (Math.abs(Math.sin(wx * 3.1 + wy * 1.7)) > 0.62) g.fillRect(wx, wy, 3, 4)
            }
          }
          g.fillStyle = PALETTE.cityNear
        }
      }
      return tile
    }
    skyCache = { far: make(0), near: make(1) }
  }

  function view() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const scale = Math.max(width / VIEW_W, 1)
    return { width, height, scale, groundY: height - 34 }
  }

  // ---------------------------------------------------------------- state
  function restart() {
    state = createBytefallState(0)
    paused = false
    hud = { score: -1, lives: -1, level: -1, time: -1 }
    playBeep(330, 0.08)
    announce()
  }

  function statusFor() {
    if (paused) return 'Paused · press P to resume'
    if (state.phase === 'won') return `All levels cleared · score ${state.score} · R to run it again`
    if (state.phase === 'gameover') return `Game over · score ${state.score} · R to try again`
    if (state.phase === 'dead') return `Life lost · ${state.player.lives} left`
    if (state.phase === 'clear') return 'Level clear · bonus banked'
    if (state.player.turbo) return 'Turbo online · double jump ready'
    // The controls are already listed under the canvas; keep this line about
    // state instead of repeating them.
    return `World 1-${state.levelIndex + 1} · reach the terminal flag · ${state.packets} packets`
  }

  function announce() {
    statusEl.textContent = statusFor()
  }

  function syncHud() {
    // Compact state mirror for the smoke check and for debugging: the canvas
    // pixels alone can't prove the player is actually moving.
    canvas.dataset.bfState = [
      state.score,
      state.player.lives,
      state.levelIndex + 1,
      state.player.x.toFixed(2),
      state.phase,
    ].join('|')
    if (hud.score !== state.score) {
      hud.score = state.score
      scoreEl.textContent = `SCORE ${String(state.score).padStart(6, '0')} · BEST ${String(
        Math.max(best, state.score)
      ).padStart(6, '0')}`
    }
    if (
      hud.lives !== state.player.lives ||
      hud.level !== state.levelIndex ||
      hud.time !== Math.ceil(state.time)
    ) {
      hud.lives = state.player.lives
      hud.level = state.levelIndex
      hud.time = Math.ceil(state.time)
      announce()
    }
  }

  // ---------------------------------------------------------------- drawing
  function drawBackground(v) {
    const gradient = context.createLinearGradient(0, 0, 0, v.height)
    gradient.addColorStop(0, PALETTE.skyTop)
    gradient.addColorStop(1, PALETTE.skyBottom)
    context.fillStyle = gradient
    context.fillRect(0, 0, v.width, v.height)

    // parallax skyline from the cached tiles (rebuilt on resize)
    if (skyCache) {
      const camPx = state.camera.x * v.scale
      for (const [layer, factor] of [[skyCache.far, 0.18], [skyCache.near, 0.34]]) {
        const offset = -((camPx * factor) % SKY_TILE)
        for (let x = offset - SKY_TILE; x < v.width; x += SKY_TILE) {
          context.drawImage(layer, x, 0)
        }
      }
    }

    // circuit grid
    context.strokeStyle = PALETTE.grid
    context.lineWidth = 1
    const step = v.scale
    const gridOffset = -((state.camera.x * v.scale) % step)
    for (let x = gridOffset; x < v.width; x += step) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, v.groundY)
      context.stroke()
    }
    for (let y = v.groundY; y > 0; y -= step) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(v.width, y)
      context.stroke()
    }
  }

  function drawTiles(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    const first = Math.max(0, Math.floor(state.camera.x) - 1)
    const last = Math.min(parsed.cols, Math.ceil(state.camera.x + VIEW_W) + 1)
    for (let r = 0; r < parsed.rows; r++) {
      for (let c = first; c < last; c++) {
        const code = parsed.tiles[r][c]
        if (code === T.EMPTY) continue
        const x = Math.round(c * s - camPx)
        const y = Math.round(v.groundY - (parsed.rows - r) * s)
        if (code === T.GROUND) {
          context.fillStyle = PALETTE.ground
          context.fillRect(x, y, s + 1, s + 1)
          // inner circuit hatch so the ground slab isn't a flat block
          context.strokeStyle = 'rgba(79,223,255,0.09)'
          context.lineWidth = 1
          context.beginPath()
          context.moveTo(x + s * 0.5, y)
          context.lineTo(x + s * 0.5, y + s)
          context.moveTo(x, y + s * 0.5)
          context.lineTo(x + s, y + s * 0.5)
          context.stroke()
          context.fillStyle = PALETTE.groundEdge
          context.globalAlpha = r === parsed.rows - 3 ? 0.5 : 0.12
          context.fillRect(x, y, s + 1, 2)
          context.globalAlpha = 1
        } else if (code === T.BLOCK) {
          context.fillStyle = PALETTE.block
          context.fillRect(x + 1, y + 1, s - 2, s - 2)
          context.fillStyle = PALETTE.blockDark
          context.fillRect(x + 1, y + s * 0.62, s - 2, 3)
          context.fillStyle = 'rgba(255,255,255,0.25)'
          context.fillRect(x + 4, y + 4, 3, 3)
        } else if (code === T.POWER) {
          context.fillStyle = PALETTE.power
          context.fillRect(x + 1, y + 1, s - 2, s - 2)
          context.fillStyle = '#04222b'
          context.font = `700 ${Math.round(s * 0.62)}px ui-monospace, monospace`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('?', x + s / 2, y + s / 2 + 1)
        } else if (code === T.ONEWAY) {
          context.fillStyle = PALETTE.oneway
          context.fillRect(x, y + 2, s + 1, 5)
        }
      }
    }
  }

  function drawPlatforms(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    for (const plat of parsed.platforms) {
      const x = (plat.x - plat.w / 2) * s - camPx
      const y = v.groundY - (parsed.rows - plat.y) * s
      context.fillStyle = PALETTE.platform
      context.fillRect(x, y, plat.w * s, 8)
      context.fillStyle = 'rgba(255,255,255,0.35)'
      context.fillRect(x, y, plat.w * s, 2)
    }
  }

  function drawPackets(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    const t = performance.now() * 0.004
    for (const packet of parsed.packets) {
      if (packet.taken) continue
      const x = packet.x * s - camPx
      const y = v.groundY - (parsed.rows - packet.y) * s + Math.sin(t + packet.x) * 2
      context.save()
      context.translate(x, y)
      context.rotate(Math.PI / 4)
      context.fillStyle = PALETTE.packet
      context.fillRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36)
      context.restore()
    }
  }

  function drawMites(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    for (const mite of parsed.mites) {
      if (!mite.alive) continue
      const w = s * 0.78
      const h = s * 0.6
      const x = mite.x * s - camPx - w / 2
      const y = v.groundY - (parsed.rows - mite.y) * s - h / 2
      context.fillStyle = PALETTE.miteDark
      context.fillRect(x, y + h * 0.45, w, h * 0.55)
      context.fillStyle = PALETTE.mite
      context.fillRect(x, y, w, h * 0.62)
      context.fillStyle = '#ffffff'
      const eye = Math.max(2, s * 0.09)
      context.fillRect(x + w * 0.24, y + h * 0.2, eye, eye)
      context.fillRect(x + w * 0.62, y + h * 0.2, eye, eye)
    }
  }

  function drawPlayer(v) {
    const s = v.scale
    const p = state.player
    const camPx = state.camera.x * s
    const w = PLAYER_W * s
    const h = PLAYER_H * s
    const x = p.x * s - camPx - w / 2
    const y = v.groundY - (state.parsed.rows - p.y) * s - h / 2
    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0

    context.globalAlpha = blink ? 0.4 : 1
    if (p.turbo) {
      context.fillStyle = 'rgba(34,211,238,0.28)'
      context.fillRect(x - 3, y - 3, w + 6, h + 6)
    }
    context.fillStyle = PALETTE.bit
    context.fillRect(x, y, w, h)
    context.fillStyle = PALETTE.bitLight
    context.fillRect(x, y, w, Math.max(2, h * 0.18))
    context.fillStyle = '#ffffff'
    const eye = Math.max(2, s * 0.12)
    const eyeX = p.facing > 0 ? x + w * 0.55 : x + w * 0.2
    context.fillRect(eyeX, y + h * 0.34, eye, eye)
    // feet: little animated treads
    context.fillStyle = PALETTE.bitLight
    const stride = Math.sin(p.walkCycle * 3) * (p.onGround ? s * 0.06 : 0)
    context.fillRect(x + stride, y + h, w * 0.38, 3)
    context.fillRect(x + w * 0.62 - stride, y + h, w * 0.38, 3)
    context.globalAlpha = 1
  }

  function drawFlag(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    const x = parsed.flag.x * s - camPx
    const baseY = v.groundY - (parsed.rows - parsed.flag.y) * s + s * 0.5
    context.fillStyle = PALETTE.pole
    context.fillRect(x - 2, baseY - s * 2.4, 4, s * 2.4)
    const wave = Math.sin(performance.now() * 0.006) * s * 0.08
    context.fillStyle = PALETTE.flag
    context.beginPath()
    context.moveTo(x + 2, baseY - s * 2.4)
    context.lineTo(x + 2 + s * 0.95, baseY - s * 2.15 + wave)
    context.lineTo(x + 2, baseY - s * 1.9)
    context.closePath()
    context.fill()
  }

  function drawTouchPad(v) {
    if (!touchMode) {
      padRects = { left: null, right: null, jump: null }
      return
    }
    const size = Math.min(64, v.width * 0.12)
    const padY = v.height - size - 14
    const boxes = {
      left: { x: 16, y: padY, w: size, h: size },
      right: { x: 16 + size + 12, y: padY, w: size, h: size },
      jump: { x: v.width - size - 16, y: padY, w: size, h: size },
    }
    padRects = boxes
    for (const [name, box] of Object.entries(boxes)) {
      const active = (name === 'left' && held.left) || (name === 'right' && held.right) || (name === 'jump' && held.jump)
      context.fillStyle = active ? 'rgba(133,183,235,0.42)' : 'rgba(255,255,255,0.10)'
      context.strokeStyle = 'rgba(255,255,255,0.32)'
      context.lineWidth = 1
      context.beginPath()
      context.roundRect(box.x, box.y, box.w, box.h, 12)
      context.fill()
      context.stroke()
      context.fillStyle = '#cfe3ff'
      context.font = `600 ${Math.round(size * 0.36)}px ui-monospace, monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      const glyph = name === 'left' ? '\u25C0' : name === 'right' ? '\u25B6' : 'JUMP'
      context.fillText(glyph, box.x + box.w / 2, box.y + box.h / 2)
    }
  }

  function drawOverlayText(v) {
    const messages = {
      dead: 'LIFE LOST',
      clear: 'LEVEL CLEAR',
      gameover: 'GAME OVER · R TO RETRY',
      won: 'ALL LEVELS CLEARED',
    }
    const text = paused ? 'PAUSED' : messages[state.phase]
    if (!text) return
    context.fillStyle = 'rgba(3,7,18,0.66)'
    context.fillRect(0, v.groundY - v.scale * 3.2, v.width, v.scale * 3.2)
    context.fillStyle = state.phase === 'gameover' ? PALETTE.mite : '#e8f1ff'
    context.font = `700 ${Math.round(Math.min(v.width * 0.055, 30))}px ui-monospace, monospace`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, v.width / 2, v.groundY - v.scale * 1.6)
  }

  function drawHud(v) {
    context.font = `600 ${Math.round(Math.min(v.width * 0.026, 14))}px ui-monospace, monospace`
    context.textAlign = 'left'
    context.textBaseline = 'top'
    context.fillStyle = '#85b7eb'
    const bits = '■'.repeat(Math.max(0, state.player.lives))
    context.fillText(`BIT ${bits}`, 12, 10)
    context.textAlign = 'center'
    context.fillStyle = '#a1a1aa'
    context.fillText(`WORLD 1-${state.levelIndex + 1}`, v.width / 2, 10)
    context.textAlign = 'right'
    context.fillStyle = state.time < 20 ? PALETTE.mite : '#a1a1aa'
    context.fillText(`TIME ${String(Math.ceil(state.time)).padStart(3, '0')}`, v.width - 12, 10)
  }

  function draw() {
    const v = view()
    drawBackground(v)
    drawTiles(v, state.parsed)
    drawPlatforms(v, state.parsed)
    drawPackets(v, state.parsed)
    drawFlag(v, state.parsed)
    drawMites(v, state.parsed)
    drawPlayer(v)
    drawHud(v)
    drawTouchPad(v)
    drawOverlayText(v)
  }

  // ---------------------------------------------------------------- loop
  function loop(time) {
    const dt = lastTime ? Math.min(0.032, (time - lastTime) / 1000) : 1 / 60
    lastTime = time

    if (!paused) {
      state.input = held
      stepBytefall(state, dt)
      for (const event of state.events) {
        if (event === 'jump') playBeep(520, 0.05)
        else if (event === 'stomp') playBeep(180, 0.09)
        else if (event === 'packet') playBeep(880, 0.06)
        else if (event === 'power') playBeep(1040, 0.12)
        else if (event === 'death' || event === 'gameover') playBeep(140, 0.22)
        else if (event === 'clear') playBeep(760, 0.16)
        else if (event === 'won') playBeep(980, 0.3)
      }
      state.events.length = 0

      if (state.phase === 'gameover' || state.phase === 'won') {
        if (state.score > best) {
          best = state.score
          try {
            localStorage.setItem(BEST_KEY, String(best))
          } catch {
            /* storage disabled: the best score just won't persist */
          }
        }
      }
    }

    syncHud()
    draw()
    frame = requestAnimationFrame(loop)
  }

  // ---------------------------------------------------------------- lifecycle
  function start() {
    stop()
    state = createBytefallState(0)
    paused = false
    lastTime = 0
    touchMode = Boolean(isTouchDevice())
    held.left = false
    held.right = false
    held.jump = false
    hud = { score: -1, lives: -1, level: -1, time: -1 }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    announce()
    frame = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(frame)
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    pointers.clear()
  }

  return { start, stop }
}

export { LEVELS, MAX_LIVES }
