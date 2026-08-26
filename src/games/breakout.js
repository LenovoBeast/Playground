// 3D Breakout — paddle + ball shatter crystalline bricks in 3D space
import * as THREE from 'three'

export function createBreakout(canvas, scoreEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 12)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene.add(new THREE.AmbientLight(0x6b4d8a, 0.6))
  const key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(5, 5, 8); scene.add(key)
  const point = new THREE.PointLight(0xff6bcf, 0.6, 20); scene.add(point)

  const W = 12, H = 8
  const paddle = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xc47fff, emissive: 0xc47fff, emissiveIntensity: 0.5 })
  )
  paddle.position.set(0, -H / 2 + 0.5, 0)
  scene.add(paddle)

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 })
  )
  scene.add(ball)

  let bricks = []
  let ballVel = new THREE.Vector3()
  let score = 0, frame, ro, alive = true, mouseX = 0
  const bounds = { left: -W / 2, right: W / 2, top: H / 2 - 2, bottom: -H / 2 + 1 }

  function buildBricks() {
    bricks.forEach(b => scene.remove(b.mesh))
    bricks = []
    const colors = [0xc47fff, 0xff6bcf, 0x4fdfff, 0xffaa44, 0x88ff66]
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.4, 0.6),
          new THREE.MeshStandardMaterial({ color: colors[row], emissive: colors[row], emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.2 })
        )
        m.position.set(-W / 2 + 0.7 + col * 1.15, H / 2 - 1 - row * 0.5, 0)
        scene.add(m)
        bricks.push({ mesh: m, x: m.position.x, y: m.position.y, alive: true })
      }
    }
  }

  function reset() {
    score = 0
    scoreEl.textContent = `SCORE: ${score}`
    paddle.position.x = 0
    ball.position.set(0, -H / 2 + 1, 0)
    ballVel.set((Math.random() - 0.5) * 3, 5, 0)
    alive = true
    buildBricks()
  }

  function loop() {
    if (alive) {
      ball.position.addScaledVector(ballVel, 1 / 60)
      if (ball.position.x < bounds.left + 0.2) { ball.position.x = bounds.left + 0.2; ballVel.x *= -1 }
      if (ball.position.x > bounds.right - 0.2) { ball.position.x = bounds.right - 0.2; ballVel.x *= -1 }
      if (ball.position.y > bounds.top + 0.2) { ball.position.y = bounds.top + 0.2; ballVel.y *= -1 }
      if (ball.position.y < -H / 2 - 0.5) alive = false
      if (Math.abs(ball.position.y - paddle.position.y) < 0.3 &&
          Math.abs(ball.position.x - paddle.position.x) < 0.95 &&
          ballVel.y < 0) {
        ballVel.y *= -1
        ballVel.x += (ball.position.x - paddle.position.x) * 1.5
        ballVel.clampLength(2, 9)
      }
      for (const b of bricks) {
        if (!b.alive) continue
        if (Math.abs(ball.position.x - b.x) < 0.6 && Math.abs(ball.position.y - b.y) < 0.22) {
          b.alive = false
          scene.remove(b.mesh)
          ballVel.y *= -1
          score += 10
          scoreEl.textContent = `SCORE: ${score}`
          break
        }
      }
    }
    // Track paddle with mouse
    paddle.position.x = THREE.MathUtils.clamp(mouseX * (W / 2), bounds.left + 0.95, bounds.right - 0.95)
    point.position.copy(ball.position)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect()
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
  }
  function onKey(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') paddle.position.x = Math.max(bounds.left, paddle.position.x - 0.5)
    if (e.key === 'ArrowRight' || e.key === 'd') paddle.position.x = Math.min(bounds.right, paddle.position.x + 0.5)
    if (e.key === ' ' && !alive) reset()
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
  }

  function start() {
    reset()
    ro = new ResizeObserver(resize); ro.observe(canvas)
    resize()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('keydown', onKey)
    loop()
  }
  function stop() {
    cancelAnimationFrame(frame)
    ro?.disconnect()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('keydown', onKey)
  }
  return { start, stop }
}