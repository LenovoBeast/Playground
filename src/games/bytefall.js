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
import {
  createClock,
  createPauseState,
  formatScore,
  mirrorState,
  readBest,
  withHints,
  writeBest,
  isPauseKey,
  isRestartKey,
} from './gameKit.js'
import {
  createHudLayer,
  drawGroundShadow,
  drawInnerFrame,
  drawPanel,
  drawVignette,
  makeCircuitTexture,
  makeStarTexture,
  roundRect,
} from './gameArt.js'
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

const GAME_NAME = 'bytefall'

export function createBytefall(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot create a 2D game canvas.')

  let state = createBytefallState(0)
  let frame = 0
  let resizeObserver = null
  const clock = createClock({ maxStep: 0.032 })
  // HUD chips live in the DOM above the canvas: crisp text, one visual language
  // across all six games, and no per-frame text layout on the canvas.
  // Built in start() (not here): start() calls stop() first for cleanup, which
  // would destroy a layer created at construction time.
  let hudLayer = { set() {}, destroy() {} }

  function buildHud() {
    return createHudLayer(canvas, [
      { key: 'score', label: 'score', align: 'left', initial: '000000' },
      { key: 'lives', label: 'bit', align: 'left', initial: '●●●' },
      { key: 'world', label: 'world', align: 'center', initial: '1-1' },
      { key: 'time', label: 'time', align: 'right', initial: '100' },
      { key: 'packets', label: 'packets', align: 'right', initial: '0' },
    ])
  }
  const pause = createPauseState()
  let best = 0
  let touchMode = false
  let hud = { score: -1, lives: -1, level: -1, time: -1 }

  best = readBest(GAME_NAME)

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
    if (isPauseKey(event.key)) {
      event.preventDefault()
      pause.toggle()
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
    buildArtCaches()
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
    pause.set(false)
    hud = { score: -1, lives: -1, level: -1, time: -1 }
    playBeep(330, 0.08)
    announce()
  }

  function statusFor() {
    if (pause.paused) return withHints('Paused')
    if (state.phase === 'won') return withHints(`All levels cleared · score ${state.score}`, { pause: false })
    if (state.phase === 'gameover') return withHints(`Game over · score ${state.score}`, { pause: false })
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
    // Same mirror shape as every other game (score | progress | phase): the
    // smoke check reads `progress` to prove the player is actually moving,
    // which canvas pixels can't (they change on resize and CSS animation).
    mirrorState(canvas, [state.score, state.player.x, state.phase])
    if (hud.score !== state.score) {
      hud.score = state.score
      scoreEl.textContent = formatScore(state.score, best)
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

  // ---------------------------------------------------------------- art caches
  // Textures are generated once (and on resize) rather than per frame: a
  // repeating circuit pattern for the ground, a starfield, and a soft glow.
  let groundPattern = null
  let starTile = null
  let starOffset = 0

  function buildArtCaches() {
    const circuit = makeCircuitTexture({ size: 128 })
    if (circuit) {
      const pattern = context.createPattern(circuit, 'repeat')
      groundPattern = pattern
    }
    starTile = makeStarTexture({ size: 512, count: 110 })
  }

  // ---------------------------------------------------------------- drawing
  function drawBackground(v) {
    const gradient = context.createLinearGradient(0, 0, 0, v.height)
    gradient.addColorStop(0, PALETTE.skyTop)
    gradient.addColorStop(0.65, '#070c1c')
    gradient.addColorStop(1, PALETTE.skyBottom)
    context.fillStyle = gradient
    context.fillRect(0, 0, v.width, v.height)

    // starfield: drifts very slowly with the camera so the sky has depth
    if (starTile) {
      starOffset = -((state.camera.x * v.scale * 0.06) % 512)
      context.globalAlpha = 0.7
      for (let x = starOffset - 512; x < v.width; x += 512) {
        context.drawImage(starTile, x, 0)
      }
      context.globalAlpha = 1
    }

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

    // circuit grid: brighter near the ground so the play space reads as a board
    const step = v.scale
    const gridOffset = -((state.camera.x * v.scale) % step)
    for (let x = gridOffset; x < v.width; x += step) {
      const column = context.createLinearGradient(0, 0, 0, v.groundY)
      column.addColorStop(0, 'rgba(79,223,255,0.02)')
      column.addColorStop(1, 'rgba(79,223,255,0.10)')
      context.strokeStyle = column
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, v.groundY)
      context.stroke()
    }
    for (let y = v.groundY; y > 0; y -= step) {
      context.strokeStyle = PALETTE.grid
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
          if (groundPattern) {
            context.fillStyle = groundPattern
            context.fillRect(x, y, s + 1, s + 1)
          } else {
            context.fillStyle = PALETTE.ground
            context.fillRect(x, y, s + 1, s + 1)
          }
          // lit edge only where the surface is exposed to the sky
          const exposed = r === 0 || parsed.tiles[r - 1][c] === T.EMPTY
          if (exposed) {
            const lip = context.createLinearGradient(0, y, 0, y + s * 0.5)
            lip.addColorStop(0, 'rgba(79,223,255,0.55)')
            lip.addColorStop(1, 'rgba(79,223,255,0)')
            context.fillStyle = lip
            context.fillRect(x, y, s + 1, Math.max(3, s * 0.5))
            context.fillStyle = PALETTE.groundEdge
            context.fillRect(x, y, s + 1, 2)
          }
        } else if (code === T.BLOCK) {
          // cache chip: bevelled amber with a data glyph and a drop shadow
          context.fillStyle = 'rgba(0,0,0,0.35)'
          context.fillRect(x + 2, y + 3, s - 2, s - 2)
          const face = context.createLinearGradient(x, y, x, y + s)
          face.addColorStop(0, '#ffc46b')
          face.addColorStop(0.5, PALETTE.block)
          face.addColorStop(1, '#b9701a')
          roundRect(context, x + 1, y + 1, s - 2, s - 2, Math.max(2, s * 0.12))
          context.fillStyle = face
          context.fill()
          roundRect(context, x + 1, y + 1, s - 2, s - 2, Math.max(2, s * 0.12))
          context.lineWidth = 1
          context.strokeStyle = 'rgba(255,255,255,0.34)'
          context.stroke()
          // two solder pads so it reads as a chip, not a crate
          context.fillStyle = 'rgba(255,255,255,0.32)'
          const pad = Math.max(1.5, s * 0.06)
          context.fillRect(x + s * 0.22, y + s * 0.24, pad, pad)
          context.fillRect(x + s * 0.72 - pad, y + s * 0.24, pad, pad)
          context.fillRect(x + s * 0.22, y + s * 0.72 - pad, pad, pad)
          context.fillRect(x + s * 0.72 - pad, y + s * 0.72 - pad, pad, pad)
          context.fillStyle = PALETTE.blockDark
          context.fillRect(x + s * 0.28, y + s * 0.46, s * 0.44, Math.max(2, s * 0.08))
        } else if (code === T.POWER) {
          // power chip: pulses so it reads as interactive
          const pulse = 0.5 + Math.sin(performance.now() * 0.006) * 0.5
          context.save()
          context.shadowColor = 'rgba(34,211,238,0.8)'
          context.shadowBlur = 8 + pulse * 10
          roundRect(context, x + 1, y + 1, s - 2, s - 2, Math.max(2, s * 0.12))
          const face = context.createLinearGradient(x, y, x, y + s)
          face.addColorStop(0, '#7ff0ff')
          face.addColorStop(1, '#0e7490')
          context.fillStyle = face
          context.fill()
          context.restore()
          roundRect(context, x + 1, y + 1, s - 2, s - 2, Math.max(2, s * 0.12))
          context.lineWidth = 1
          context.strokeStyle = 'rgba(255,255,255,0.5)'
          context.stroke()
          context.fillStyle = '#04222b'
          context.font = `700 ${Math.round(s * 0.62)}px ui-monospace, monospace`
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText('?', x + s / 2, y + s / 2 + 1)
        } else if (code === T.ONEWAY) {
          const bar = context.createLinearGradient(0, y, 0, y + 7)
          bar.addColorStop(0, 'rgba(190,210,255,0.95)')
          bar.addColorStop(1, PALETTE.oneway)
          context.fillStyle = bar
          roundRect(context, x, y + 2, s + 1, 6, 3)
          context.fill()
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

      // glow so a dropped packet is easy to spot
      const glow = context.createRadialGradient(x, y, 0, x, y, s * 0.55)
      glow.addColorStop(0, 'rgba(239,201,76,0.5)')
      glow.addColorStop(1, 'rgba(239,201,76,0)')
      context.fillStyle = glow
      context.fillRect(x - s * 0.55, y - s * 0.55, s * 1.1, s * 1.1)

      context.save()
      context.translate(x, y)
      context.rotate(Math.PI / 4 + t * 0.6)
      const size = s * 0.2
      const face = context.createLinearGradient(-size, -size, size, size)
      face.addColorStop(0, '#fff4c2')
      face.addColorStop(1, '#d99a12')
      context.fillStyle = face
      roundRect(context, -size, -size, size * 2, size * 2, size * 0.3)
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = 'rgba(255,255,255,0.6)'
      context.stroke()
      context.restore()
    }
  }

  function drawMites(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    for (const mite of parsed.mites) {
      if (!mite.alive) continue
      const w = s * 0.78
      const h = s * 0.62
      const x = mite.x * s - camPx - w / 2
      const y = v.groundY - (parsed.rows - mite.y) * s - h / 2
      const bob = Math.sin(performance.now() * 0.008 + mite.x) * s * 0.03

      drawGroundShadow(context, x + w / 2, y + h + s * 0.06, w * 0.55, w * 0.18, 0.32)

      // legs
      context.strokeStyle = PALETTE.miteDark
      context.lineWidth = Math.max(1.5, s * 0.07)
      const legPhase = Math.sin(performance.now() * 0.012 + mite.x) * s * 0.06
      for (const side of [-1, 1]) {
        context.beginPath()
        context.moveTo(x + w * 0.3, y + h * 0.7)
        context.lineTo(x + w * 0.18 + side * legPhase, y + h + s * 0.1)
        context.moveTo(x + w * 0.7, y + h * 0.7)
        context.lineTo(x + w * 0.82 - side * legPhase, y + h + s * 0.1)
        context.stroke()
      }

      // body with a glitchy shell
      const shell = context.createLinearGradient(x, y + bob, x, y + h + bob)
      shell.addColorStop(0, '#ff8fb8')
      shell.addColorStop(0.5, PALETTE.mite)
      shell.addColorStop(1, PALETTE.miteDark)
      roundRect(context, x, y + bob, w, h, Math.max(2, w * 0.3))
      context.fillStyle = shell
      context.fill()
      roundRect(context, x, y + bob, w, h, Math.max(2, w * 0.3))
      context.lineWidth = 1
      context.strokeStyle = 'rgba(255,255,255,0.35)'
      context.stroke()

      // two bright eyes, offset in the direction of travel
      const eye = Math.max(2, s * 0.1)
      const eyeY = y + bob + h * 0.28
      context.fillStyle = '#ffffff'
      context.fillRect(x + w * 0.22 + mite.dir * s * 0.04, eyeY, eye, eye)
      context.fillRect(x + w * 0.6 + mite.dir * s * 0.04, eyeY, eye, eye)
      context.fillStyle = '#3b0d20'
      context.fillRect(x + w * 0.22 + mite.dir * s * 0.04, eyeY + eye * 0.5, eye, eye * 0.5)
      context.fillRect(x + w * 0.6 + mite.dir * s * 0.04, eyeY + eye * 0.5, eye, eye * 0.5)
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
    // squash on landing, stretch while rising — small thing, big feel difference
    const squash = p.onGround ? 1 : p.vy < 0 ? 0.94 : 1.04
    const drawH = h * squash
    const drawW = w * (2 - squash)
    const dx = x + (w - drawW) / 2
    const dy = y + (h - drawH)

    // shadow on the floor surface (ground top row), so Bit reads as grounded
    drawGroundShadow(context, x + w / 2, v.groundY - 3 * s + 2, w * 0.62, w * 0.2, 0.35)

    context.globalAlpha = blink ? 0.45 : 1
    if (p.turbo) {
      const aura = context.createRadialGradient(dx + drawW / 2, dy + drawH / 2, drawW * 0.2, dx + drawW / 2, dy + drawH / 2, drawW * 1.5)
      aura.addColorStop(0, 'rgba(34,211,238,0.45)')
      aura.addColorStop(1, 'rgba(34,211,238,0)')
      context.fillStyle = aura
      context.fillRect(dx - drawW, dy - drawH, drawW * 3, drawH * 3)
    }

    // body: rounded cube-bot with a gradient shell and a rim light
    const shell = context.createLinearGradient(dx, dy, dx, dy + drawH)
    shell.addColorStop(0, '#8fc6ff')
    shell.addColorStop(0.45, PALETTE.bit)
    shell.addColorStop(1, '#1d4f8f')
    roundRect(context, dx, dy, drawW, drawH, Math.max(2, drawW * 0.22))
    context.fillStyle = shell
    context.fill()
    roundRect(context, dx, dy, drawW, drawH, Math.max(2, drawW * 0.22))
    context.lineWidth = 1
    context.strokeStyle = 'rgba(255,255,255,0.45)'
    context.stroke()

    // visor
    const visorW = drawW * 0.62
    const visorH = Math.max(2, drawH * 0.2)
    const visorX = p.facing > 0 ? dx + drawW * 0.3 : dx + drawW * 0.08
    roundRect(context, visorX, dy + drawH * 0.26, visorW, visorH, visorH / 2)
    context.fillStyle = 'rgba(4,16,32,0.85)'
    context.fill()
    context.fillStyle = '#7df9ff'
    const eye = Math.max(1.5, visorH * 0.5)
    context.fillRect(visorX + (p.facing > 0 ? visorW * 0.55 : visorW * 0.25), dy + drawH * 0.26 + visorH * 0.25, eye, eye)

    // treads, animated by distance travelled
    const stride = Math.sin(p.walkCycle * 3) * (p.onGround ? drawW * 0.14 : 0)
    context.fillStyle = '#123a63'
    roundRect(context, dx + stride, dy + drawH, drawW * 0.4, Math.max(2, drawH * 0.12), 2)
    context.fill()
    roundRect(context, dx + drawW * 0.6 - stride, dy + drawH, drawW * 0.4, Math.max(2, drawH * 0.12), 2)
    context.fill()

    // turbo trail
    if (p.turbo && Math.abs(p.vx) > 1) {
      context.globalAlpha = 0.4
      for (let i = 1; i <= 3; i++) {
        context.fillStyle = i % 2 ? '#22d3ee' : '#378add'
        roundRect(context, dx - i * drawW * 0.35 * Math.sign(p.facing || 1), dy + drawH * 0.3, drawW * 0.3, drawH * 0.4, 3)
        context.fill()
      }
      context.globalAlpha = 1
    }
    context.globalAlpha = 1
  }

  function drawFlag(v, parsed) {
    const s = v.scale
    const camPx = state.camera.x * s
    const x = parsed.flag.x * s - camPx
    const baseY = v.groundY - (parsed.rows - parsed.flag.y) * s + s * 0.5
    const poleH = s * 2.6

    // base plinth
    roundRect(context, x - s * 0.42, baseY - s * 0.16, s * 0.84, s * 0.3, s * 0.08)
    context.fillStyle = '#2b3556'
    context.fill()

    // light beam marking the goal
    const beam = context.createLinearGradient(x, baseY - poleH, x, baseY)
    beam.addColorStop(0, 'rgba(226,75,74,0)')
    beam.addColorStop(1, 'rgba(226,75,74,0.16)')
    context.fillStyle = beam
    context.fillRect(x - s * 0.5, baseY - poleH, s, poleH)

    context.fillStyle = PALETTE.pole
    roundRect(context, x - 2, baseY - poleH, 4, poleH, 2)
    context.fill()

    // pennant, waving
    const wave = Math.sin(performance.now() * 0.006) * s * 0.1
    context.beginPath()
    context.moveTo(x + 2, baseY - poleH)
    context.quadraticCurveTo(x + s * 0.5, baseY - poleH + s * 0.2 + wave, x + s * 0.98, baseY - poleH + s * 0.32)
    context.lineTo(x + 2, baseY - poleH + s * 0.62)
    context.closePath()
    const flagFill = context.createLinearGradient(x, baseY - poleH, x + s, baseY - poleH + s * 0.6)
    flagFill.addColorStop(0, '#ff7a72')
    flagFill.addColorStop(1, PALETTE.flag)
    context.fillStyle = flagFill
    context.fill()

    // terminal prompt glyph on the pennant
    context.fillStyle = 'rgba(255,255,255,0.9)'
    context.font = `700 ${Math.round(s * 0.28)}px ui-monospace, monospace`
    context.textAlign = 'left'
    context.textBaseline = 'middle'
    context.fillText('>_', x + s * 0.14, baseY - poleH + s * 0.34)
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
      dead: ['LIFE LOST', 'Bit respawns at the start of the level'],
      clear: ['LEVEL CLEAR', 'Time bonus banked — next level loading'],
      gameover: ['GAME OVER', 'Press R to run it again'],
      won: ['ALL LEVELS CLEARED', 'Press R to run it again'],
    }
    const entry = pause.paused ? ['PAUSED', 'Press P to resume'] : messages[state.phase]
    if (!entry) return

    const [title, subtitle] = entry
    const panelW = Math.min(v.width * 0.72, 420)
    const panelH = Math.max(64, v.scale * 2.1)
    const px = (v.width - panelW) / 2
    const py = v.groundY - v.scale * 4.2

    context.fillStyle = 'rgba(3,7,18,0.55)'
    context.fillRect(0, 0, v.width, v.height)
    drawPanel(context, px, py, panelW, panelH, {
      radius: 12,
      accent: state.phase === 'gameover' ? PALETTE.mite : '#22d3ee',
    })

    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = state.phase === 'gameover' ? '#ff9db5' : '#e8f1ff'
    context.font = `700 ${Math.round(Math.min(v.width * 0.045, 24))}px ui-monospace, monospace`
    context.fillText(title, v.width / 2, py + panelH * 0.4)
    context.fillStyle = 'rgba(161,161,170,1)'
    context.font = `500 ${Math.round(Math.min(v.width * 0.026, 13))}px ui-monospace, monospace`
    context.fillText(subtitle, v.width / 2, py + panelH * 0.72)
  }

  function drawHud() {
    // The HUD is a DOM layer (gameArt.createHudLayer) so its text is crisp and
    // identical across all six games; only the touch pad is drawn on canvas.
    hudLayer.set({
      score: String(state.score).padStart(6, '0'),
      lives: '●'.repeat(Math.max(0, state.player.lives)) + '○'.repeat(Math.max(0, MAX_LIVES - state.player.lives)),
      world: `1-${state.levelIndex + 1}`,
      time: String(Math.ceil(state.time)).padStart(3, '0'),
      packets: String(state.packets),
    })
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
    drawHud()
    drawVignette(context, v.width, v.height, 0.45)
    drawInnerFrame(context, v.width, v.height, { radius: 14, color: 'rgba(255,255,255,0.09)' })
    drawTouchPad(v)
    drawOverlayText(v)
  }

  // ---------------------------------------------------------------- loop
  function loop(time) {
    const dt = clock.tick(time)

    if (!pause.paused) {
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
        best = writeBest(GAME_NAME, state.score)
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
    pause.set(false)
    clock.reset()
    touchMode = Boolean(isTouchDevice())
    held.left = false
    held.right = false
    held.jump = false
    hud = { score: -1, lives: -1, level: -1, time: -1 }
    hudLayer = buildHud()
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
    // The HUD is a DOM layer: remove it or it stacks up on every restart.
    hudLayer.destroy()
    hudLayer = { set() {}, destroy() {} }
  }

  return { start, stop }
}

export { LEVELS, MAX_LIVES }
