// 3D Breakout — paddle + ball shatter crystalline bricks in 3D space
import * as THREE from 'three'
import { upgradeScene, resizeGame } from './graphics.js'
import {
  BREAKOUT_BOUNDS,
  BREAKOUT_LIVES,
  BREAKOUT_PADDLE_Y,
  createBreakoutState,
  movePaddleAxis,
  stepBreakout,
} from './gameLogic.js'
import {
  createClock,
  createKeyState,
  createPauseState,
  formatScore,
  mirrorState,
  readBest,
  withHints,
  writeBest,
  isPauseKey,
  isRestartKey,
  isConfirmKey,
} from './gameKit.js'
import { createHudLayer, makeBrickTexture } from './gameArt.js'
import { playBeep } from './sound.js'

const GAME_NAME = 'breakout'
const BRICK_ROWS = 5
const BRICK_COLS = 10
const BRICK_COLORS = ['#c47fff', '#ff6bcf', '#4fdfff', '#ffaa44', '#88ff66']
const BRICK_ACCENTS = ['#e6ccff', '#ffc2e6', '#bff2ff', '#ffdca8', '#d6ffc2']

// Each row gets a generated crystal face: flat colour boxes read as rectangles
// no matter how the lights hit them.
function brickTexture(THREE, row) {
  const canvas = makeBrickTexture({
    color: BRICK_COLORS[row],
    accent: BRICK_ACCENTS[row],
    seed: row,
  })
  if (!canvas) return null
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function createBreakout(canvas, scoreEl, statusEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 12)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  upgradeScene(renderer, scene)

  scene.add(new THREE.AmbientLight(0x6b4d8a, 0.6))
  const key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(5, 5, 8); scene.add(key)
  const point = new THREE.PointLight(0xff6bcf, 0.6, 20); scene.add(point)

  const W = 12, H = 8
  const clock = createClock()
  const pause = createPauseState()

  // Built in start(): start() calls stop() first for cleanup.
  let hudLayer = { set() {}, destroy() {} }

  function buildHud() {
    return createHudLayer(canvas, [
      { key: 'score', label: 'score', align: 'left', initial: '000000' },
      { key: 'lives', label: 'lives', align: 'left', initial: '●●●' },
      { key: 'bricks', label: 'bricks', align: 'center', initial: '50' },
      { key: 'best', label: 'best', align: 'right', initial: '000000' },
    ])
  }
  const keys = createKeyState({
    ArrowLeft: true, ArrowRight: true, a: true, d: true, A: true, D: true,
  })

  const paddle = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xc47fff, emissive: 0xc47fff, emissiveIntensity: 0.5 })
  )
  paddle.position.set(0, BREAKOUT_PADDLE_Y, 0)
  scene.add(paddle)

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 })
  )
  scene.add(ball)

  const trailGeometry = new THREE.SphereGeometry(0.17, 12, 12)
  const trail = Array.from({ length: 10 }, (_, i) => {
    const mesh = new THREE.Mesh(trailGeometry, new THREE.MeshBasicMaterial({ color: 0x4fdfff, transparent: true, opacity: (1 - i / 10) * 0.35, depthWrite: false }))
    scene.add(mesh)
    return mesh
  })
  let bricks = []
  let state = createBreakoutState()
  let best = 0
  let frame, ro
  let mouseX = 0, mouseActive = false
  const bounds = BREAKOUT_BOUNDS

  function syncScore() {
    scoreEl.textContent = formatScore(state.score, best)
  }

  function buildBricks() {
    if (bricks.length) {
      bricks.forEach(brick => { brick.alive = true; scene.add(brick.mesh) })
      return
    }
    const colors = BRICK_COLORS
    for (let row = 0; row < BRICK_ROWS; row++) {
      const texture = brickTexture(THREE, row)
      for (let col = 0; col < BRICK_COLS; col++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.4, 0.6),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: texture,
            emissive: colors[row],
            emissiveIntensity: 0.35,
            roughness: 0.28,
            metalness: 0.35,
          })
        )
        m.position.set(-W / 2 + 0.7 + col * 1.15, H / 2 - 1 - row * 0.5, 0)
        scene.add(m)
        bricks.push({ mesh: m, x: m.position.x, y: m.position.y, alive: true })
      }
    }
  }

  function reset() {
    state = createBreakoutState()
    clock.reset()
    pause.set(false)
    mouseActive = false
    paddle.position.x = state.paddleX
    ball.position.set(state.ball.x, state.ball.y, 0)
    trail.forEach(mesh => mesh.position.copy(ball.position))
    buildBricks()
    syncScore()
    statusEl.textContent = withHints('Mouse or ← → to move · clear every brick')
  }

  function livesLabel() {
    return '●'.repeat(Math.max(0, state.lives)) + '○'.repeat(Math.max(0, BREAKOUT_LIVES - state.lives))
  }

  function loop() {
    const dt = clock.tick(performance.now())

    if (state.alive && !pause.paused) {
      // Keyboard input is integrated over time; the old code moved the paddle a
      // fixed amount per keydown event, so its speed depended on the OS repeat rate.
      const axis = keys.axis(['ArrowRight', 'd', 'D'], ['ArrowLeft', 'a', 'A'])
      if (axis !== 0) {
        mouseActive = false
        paddle.position.x = movePaddleAxis(paddle.position.x, axis, dt, bounds)
      }

      const next = stepBreakout(state, dt, { paddleX: paddle.position.x, bricks })
      state = next

      // Reflect the simulation into the scene: the physics is pure and reports
      // what changed instead of touching three.js objects itself.
      ball.position.set(state.ball.x, state.ball.y, 0)
      for (const brick of next.destroyed) {
        scene.remove(brick.mesh)
        playBeep()
      }
      for (const event of next.events) {
        if (event === 'paddle') playBeep(520, 0.05)
        else if (event === 'serve') statusEl.textContent = withHints(`${livesLabel()} · ${state.lives} left`)
        else if (event === 'gameover') {
          best = writeBest(GAME_NAME, state.score)
          syncScore()
          statusEl.textContent = withHints(`Game over at ${state.score}`, { pause: false })
          playBeep(140, 0.25)
        } else if (event === 'won') {
          best = writeBest(GAME_NAME, state.score)
          syncScore()
          statusEl.textContent = withHints('Wall cleared!', { pause: false })
          playBeep(980, 0.3)
        }
      }
      if (next.events.includes('brick')) syncScore()
    }

    // Keep keyboard control from being overwritten until the pointer moves again.
    if (mouseActive) {
      paddle.position.x = THREE.MathUtils.clamp(mouseX * (W / 2), bounds.left + 0.95, bounds.right - 0.95)
    }
    for (let i = trail.length - 1; i > 0; i--) trail[i].position.copy(trail[i - 1].position)
    trail[0].position.copy(ball.position)
    point.position.copy(ball.position)

    hudLayer.set({
      score: String(state.score).padStart(6, '0'),
      lives: '●'.repeat(Math.max(0, state.lives)) + '○'.repeat(Math.max(0, BREAKOUT_LIVES - state.lives)),
      bricks: String(bricks.filter((brick) => brick.alive).length),
      best: String(Math.max(best, state.score)).padStart(6, '0'),
    })
    mirrorState(canvas, [
      state.score,
      // progress = ball x, which moves continuously, so the mirror proves the
      // simulation is live even before the first brick breaks
      state.ball.x,
      pause.paused ? 'paused' : state.won ? 'won' : state.alive ? 'playing' : 'over',
    ])
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect()
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouseActive = true
  }

  function onKey(e) {
    if (keys.down(e.key)) {
      mouseActive = false
      e.preventDefault()
      return
    }
    if (isRestartKey(e.key) || (isConfirmKey(e.key) && !state.alive)) {
      e.preventDefault()
      reset()
      return
    }
    if (isPauseKey(e.key)) {
      e.preventDefault()
      if (state.alive) {
        const paused = pause.toggle()
        statusEl.textContent = paused ? withHints('Paused') : withHints('Back in — watch the ball')
      }
    }
  }

  function onKeyUp(e) {
    keys.up(e.key)
  }

  function resize() {
    resizeGame(renderer, camera, canvas, 1.1)
  }

  function start() {
    stop()
    best = readBest(GAME_NAME)
    reset()
    hudLayer = buildHud()
    ro = new ResizeObserver(resize); ro.observe(canvas)
    resize()
    canvas.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    loop()
  }

  function stop() {
    cancelAnimationFrame(frame)
    hudLayer.destroy()
    hudLayer = { set() {}, destroy() {} }
    ro?.disconnect()
    canvas.removeEventListener('pointermove', onMove)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKeyUp)
    keys.clear()
  }

  return { start, stop }
}
