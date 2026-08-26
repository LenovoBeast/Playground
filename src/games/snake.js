// Snake — rendered as 3D orbs on a holographic grid
import * as THREE from 'three'

export function createSnake(canvas, scoreEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 14, 6)
  camera.lookAt(0, 0, 0)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const GRID = 16
  let snake, dir, nextDir, food, score, alive, frame, lastStep, basePositions = [], stepMs = 140

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
    snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]
    dir = { x: 1, y: 0 }
    nextDir = dir
    score = 0
    alive = true
    stepMs = 140
    placeFood()
    scoreEl.textContent = `SCORE: ${score}`
    // Clear existing meshes
    trail.forEach(t => scene.remove(t.mesh))
    trail.length = 0
  }

  function placeFood() {
    while (true) {
      const x = Math.floor(Math.random() * GRID)
      const y = Math.floor(Math.random() * GRID)
      if (!snake.some(s => s.x === x && s.y === y)) {
        food = { x, y }
        break
      }
    }
  }

  function step() {
    dir = nextDir
    const head = snake[0]
    const nh = { x: head.x + dir.x, y: head.y + dir.y }
    if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID || snake.some(s => s.x === nh.x && s.y === nh.y)) {
      alive = false
      return
    }
    snake.unshift(nh)
    if (nh.x === food.x && nh.y === food.y) {
      score += 10
      scoreEl.textContent = `SCORE: ${score}`
      placeFood()
      stepMs = Math.max(60, stepMs - 4)
    } else {
      snake.pop()
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
    foodMesh.position.set(food.x - GRID / 2 + 0.5, 0.3 + Math.sin(performance.now() * 0.005) * 0.1, food.y - GRID / 2 + 0.5)
    foodMesh.rotation.y += 0.03
    glow.position.copy(foodMesh.position)
    if (!alive) foodMesh.material.color.setHex(0xff3333)
    else foodMesh.material.color.setHex(0xff6bcf)

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
    const k = e.key
    if ((k === 'ArrowUp' || k === 'w') && dir.y === 0) nextDir = { x: 0, y: -1 }
    else if ((k === 'ArrowDown' || k === 's') && dir.y === 0) nextDir = { x: 0, y: 1 }
    else if ((k === 'ArrowLeft' || k === 'a') && dir.x === 0) nextDir = { x: -1, y: 0 }
    else if ((k === 'ArrowRight' || k === 'd') && dir.x === 0) nextDir = { x: 1, y: 0 }
  }

  return { start, stop }
}