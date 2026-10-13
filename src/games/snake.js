// Snake — rendered as 3D orbs on a holographic grid
import * as THREE from 'three'
import { upgradeScene, resizeGame } from './graphics.js'
import {
  advanceSnake,
  createSnakeState,
  queueSnakeDirection,
  spawnSnakeFood,
  snakeStepsDue,
  SNAKE_GRID,
} from './gameLogic.js'
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
  isConfirmKey,
} from './gameKit.js'
import { playBeep } from './sound.js'

const GAME_NAME = 'snake'

export function createSnake(canvas, scoreEl, statusEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 14, 6)
  camera.lookAt(0, 0, 0)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  upgradeScene(renderer, scene)

  const GRID = SNAKE_GRID
  const clock = createClock()
  const pause = createPauseState()

  let snake, dir, food, score, best, alive, won, frame, accumulator = 0
  let stepMs = 140
  let foodPulseUntil = 0
  let turns = []

  const grid = new THREE.GridHelper(GRID, GRID, 0xc47fff, 0x2a1f3a)
  grid.position.y = -0.01
  scene.add(grid)

  const ambient = new THREE.AmbientLight(0x6b4d8a, 0.6)
  scene.add(ambient)
  const key = new THREE.DirectionalLight(0xc47fff, 0.8)
  key.position.set(0, 10, 5)
  scene.add(key)

  const headGeometry = new THREE.SphereGeometry(0.45, 24, 24)
  const bodyGeometry = new THREE.SphereGeometry(0.38, 20, 20)
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xc47fff, emissive: 0x7842cc, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.45 })
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4fdfff, emissive: 0x138aa3, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.45 })
  const trail = [] // { mesh }
  const foodMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6bcf, emissive: 0xff6bcf, emissiveIntensity: 0.7 })
  )
  scene.add(foodMesh)

  const glow = new THREE.PointLight(0xc47fff, 0.5, 6)
  scene.add(glow)

  function syncScore() {
    scoreEl.textContent = formatScore(score, best)
  }

  function reset() {
    const state = createSnakeState()
    snake = state.snake
    dir = state.direction
    score = state.score
    alive = state.alive
    won = false
    stepMs = state.stepMs
    turns = []
    accumulator = 0
    pause.set(false)
    clock.reset()
    placeFood()
    syncScore()
    statusEl.textContent = withHints('Collect the pink orb — each one speeds you up')
    trail.forEach(t => scene.remove(t.mesh))
    trail.length = 0
  }

  function placeFood() {
    food = spawnSnakeFood(snake, GRID)
    if (!food) {
      // Board full: a legitimate win, not a crash.
      alive = false
      won = true
      best = writeBest(GAME_NAME, score)
      syncScore()
      statusEl.textContent = withHints('Board cleared — every cell collected!', { pause: false, extra: 'R restart' })
    }
  }

  function step() {
    if (turns.length) dir = turns.shift()
    const result = advanceSnake({ snake, direction: dir, food, grid: GRID })
    snake = result.snake
    if (!result.alive) {
      alive = false
      best = writeBest(GAME_NAME, score)
      syncScore()
      statusEl.textContent = withHints(`Crashed at ${score} points`, { pause: false })
      playBeep(150, 0.25)
      return
    }
    if (result.ateFood) {
      score += 10
      best = Math.max(best, score)
      foodPulseUntil = performance.now() + 500
      playBeep(720, 0.06)
      stepMs = Math.max(60, stepMs - 4)
      placeFood()
      syncScore()
      if (alive) statusEl.textContent = `+10 · length ${snake.length} · speed ${Math.round(60000 / stepMs / 10) / 10}/s`
    }
  }

  function render() {
    const dt = clock.tick(performance.now())
    if (alive && !pause.paused) {
      // Fixed cadence with a kept remainder: the old loop compared wall-clock
      // time and reset its timestamp, so the snake's speed drifted and only one
      // step could ever happen per frame.
      const due = snakeStepsDue(accumulator, dt * 1000, stepMs)
      accumulator = due.remainder
      for (let i = 0; i < due.steps && alive; i++) step()
    }

    while (trail.length < snake.length) {
      const head = trail.length === 0
      const mesh = new THREE.Mesh(head ? headGeometry : bodyGeometry, head ? headMaterial : bodyMaterial)
      scene.add(mesh)
      trail.push({ mesh })
    }
    // A shorter snake after a restart leaves orphan meshes behind.
    while (trail.length > snake.length) {
      scene.remove(trail.pop().mesh)
    }
    snake.forEach((segment, index) => {
      trail[index].mesh.position.set(segment.x - GRID / 2 + 0.5, 0.3, segment.y - GRID / 2 + 0.5)
    })
    foodMesh.visible = Boolean(food)
    if (food) {
      foodMesh.position.set(food.x - GRID / 2 + 0.5, 0.3 + Math.sin(performance.now() * 0.005) * 0.1, food.y - GRID / 2 + 0.5)
      foodMesh.rotation.y += 0.03
      glow.position.copy(foodMesh.position)
      foodMesh.scale.setScalar(performance.now() < foodPulseUntil ? 1.35 : 1)
      foodMesh.material.color.setHex(alive ? 0xff6bcf : 0xff3333)
    }

    // progress = head cell, so the mirror changes as the snake moves (its length
    // only changes when it eats, which a smoke test can't rely on).
    const head = snake[0]
    mirrorState(canvas, [score, head.x + head.y * GRID, pause.paused ? 'paused' : won ? 'won' : alive ? 'playing' : 'dead'])
    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }

  function resize() {
    resizeGame(renderer, camera, canvas, 1.8)
  }

  let ro
  function start() {
    stop()
    best = readBest(GAME_NAME)
    reset()
    ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    render()
    window.addEventListener('keydown', onKey)
  }

  function stop() {
    cancelAnimationFrame(frame)
    ro?.disconnect()
    window.removeEventListener('keydown', onKey)
  }

  function onKey(e) {
    if (isRestartKey(e.key) || (isConfirmKey(e.key) && !alive)) {
      e.preventDefault()
      reset()
      return
    }
    if (isPauseKey(e.key)) {
      e.preventDefault()
      if (alive) {
        const paused = pause.toggle()
        statusEl.textContent = paused
          ? withHints('Paused')
          : withHints('Back in — keep collecting')
      }
      return
    }
    if (e.key === ' ' || /^(Arrow(Up|Down|Left|Right)|[wasd])$/.test(e.key)) e.preventDefault()
    // Buffer the turn instead of overwriting it: two quick presses used to lose
    // the second one, which made fast cornering feel unresponsive.
    turns = queueSnakeDirection(turns, dir, e.key)
  }

  return { start, stop }
}
