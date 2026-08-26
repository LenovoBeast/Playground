// Snake — rendered as 3D orbs on a holographic grid
import * as THREE from 'three'
import { advanceSnake, createSnakeState, directionForKey, spawnSnakeFood, SNAKE_GRID } from './gameLogic.js'

export function createSnake(canvas, scoreEl, statusEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 14, 6)
  camera.lookAt(0, 0, 0)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const GRID = SNAKE_GRID
  let snake, dir, nextDir, food, score, alive, frame, lastStep, basePositions = [], stepMs = 140
  let foodPulseUntil = 0

  const grid = new THREE.GridHelper(GRID, GRID, 0xc47fff, 0x2a1f3a)
  grid.position.y = -0.01
  scene.add(grid)

  const ambient = new THREE.AmbientLight(0x6b4d8a, 0.6)
  scene.add(ambient)
  const key = new THREE.DirectionalLight(0xc47fff, 0.8)
  key.position.set(0, 10, 5)
  scene.add(key)

  const trail = [] // {mesh, current, target, t}
  const foodMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6bcf, emissive: 0xff6bcf, emissiveIntensity: 0.7 })
  )
  scene.add(foodMesh)

  const glow = new THREE.PointLight(0xc47fff, 0.5, 6)
  scene.add(glow)

  function reset() {
    const state = createSnakeState()
    snake = state.snake
    dir = state.direction
    nextDir = state.nextDirection
    score = state.score
    alive = state.alive
    stepMs = state.stepMs
    placeFood()
    scoreEl.textContent = `SCORE: ${score}`
    statusEl.textContent = 'Use arrows or WASD · collect the pink orb'
    // Clear existing meshes
    trail.forEach(t => scene.remove(t.mesh))
    trail.length = 0
  }

  function placeFood() {
    food = spawnSnakeFood(snake, GRID)
    if (!food) {
      alive = false
      statusEl.textContent = 'YOU WIN · every cell collected · press Space to restart'
    }
  }

  function step() {
    dir = nextDir
    const result = advanceSnake({ snake, direction: dir, food, grid: GRID })
    snake = result.snake
    if (!result.alive) {
      alive = false
      statusEl.textContent = 'GAME OVER · press Space to restart'
      return
    }
    if (result.ateFood) {
      score += 10
      scoreEl.textContent = `SCORE: ${score}`
      statusEl.textContent = '+10 orb collected · keep going!'
      foodPulseUntil = performance.now() + 500
      placeFood()
      stepMs = Math.max(60, stepMs - 4)
    }
  }

  function render() {
    if (alive && performance.now() - lastStep > stepMs) {
      step()
      lastStep = performance.now()
    }
    // Rebuild meshes (small enough for snake length)
    if (alive || trail.length === 0) {
      trail.forEach(t => scene.remove(t.mesh))
      trail.length = 0
      snake.forEach((s, i) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(i === 0 ? 0.45 : 0.38, 16, 16),
          new THREE.MeshStandardMaterial({ color: i === 0 ? 0xc47fff : 0x4fdfff, emissive: i === 0 ? 0xc47fff : 0x4fdfff, emissiveIntensity: 0.6 })
        )
        m.position.set(s.x - GRID / 2 + 0.5, 0.3, s.y - GRID / 2 + 0.5)
        scene.add(m)
        trail.push({ mesh: m })
      })
    }
    foodMesh.visible = Boolean(food)
    if (food) {
      foodMesh.position.set(food.x - GRID / 2 + 0.5, 0.3 + Math.sin(performance.now() * 0.005) * 0.1, food.y - GRID / 2 + 0.5)
      foodMesh.rotation.y += 0.03
      glow.position.copy(foodMesh.position)
      foodMesh.scale.setScalar(performance.now() < foodPulseUntil ? 1.35 : 1)
      foodMesh.material.color.setHex(alive ? 0xff6bcf : 0xff3333)
    }

    renderer.render(scene, camera)
    frame = requestAnimationFrame(render)
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
  }

  let ro
  function start() {
    reset()
    lastStep = performance.now()
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
    if (e.key === ' ' && !alive) {
      e.preventDefault()
      reset()
      lastStep = performance.now()
      return
    }
    nextDir = directionForKey(e.key, dir)
  }

  return { start, stop }
}