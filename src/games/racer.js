// Micro Racer — toy car on a 3D track loop
import * as THREE from 'three'
import { createRacerState, resetRacerState } from './gameLogic.js'

export function createRacer(canvas, scoreEl, statusEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
  camera.position.set(0, 6, 12)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  scene.add(new THREE.AmbientLight(0x6b4d8a, 0.5))
  const dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(5, 10, 5); scene.add(dir)
  const glow = new THREE.PointLight(0xff6bcf, 0.8, 15); glow.position.set(0, 1, 0); scene.add(glow)

  // Track — closed loop in 3D
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, 0, 1),
    new THREE.Vector3(-3, 0, -2),
    new THREE.Vector3(-1, 0, -3),
    new THREE.Vector3(1, 0, -3),
    new THREE.Vector3(3, 0, -2),
    new THREE.Vector3(4, 0, 1),
    new THREE.Vector3(3, 1.5, 3),
    new THREE.Vector3(0, 2.5, 4),
    new THREE.Vector3(-3, 1.5, 3)
  ], true)

  const trackMesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 200, 0.08, 8, true),
    new THREE.MeshStandardMaterial({ color: 0x4fdfff, emissive: 0x4fdfff, emissiveIntensity: 0.6 })
  )
  scene.add(trackMesh)

  // Floor grid
  const floor = new THREE.GridHelper(20, 20, 0xc47fff, 0x1a1525)
  floor.position.y = -0.5
  scene.add(floor)

  // Car
  const car = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xff6bcf, emissive: 0xff6bcf, emissiveIntensity: 0.4 })
  )
  car.add(body)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.1, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xc47fff, emissive: 0xc47fff, emissiveIntensity: 0.3 })
  )
  cabin.position.set(-0.02, 0.1, 0)
  car.add(cabin)
  scene.add(car)

  let { t, speed, lap, prevPos, running } = createRacerState()
  let targetSpeed = 0, frame, ro
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false }

  function update(dt) {
    targetSpeed = keys.ArrowUp || keys.w ? 0.3 : keys.ArrowDown || keys.s ? -0.15 : 0
    speed += (targetSpeed - speed) * 0.05
    t = (t + speed * dt + 1) % 1
    const pos = curve.getPointAt(t)
    const ahead = curve.getPointAt((t + 0.01) % 1)
    car.position.copy(pos)
    car.position.y += 0.12
    car.lookAt(ahead.x, ahead.y + 0.12, ahead.z)
    if (prevPos && pos.distanceTo(prevPos) > 3) lap++
    prevPos = pos.clone()
    camera.position.lerp(new THREE.Vector3(pos.x * 0.6, pos.y + 4, pos.z + 8), 0.05)
    camera.lookAt(car.position)
  }

  function loop() {
    if (running) {
      scoreEl.textContent = `LAP: ${Math.min(lap, 3)} / 3`
      update(0.016)
    }
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }

  function onKey(e) {
    if (e.key in keys) { keys[e.key] = true; e.preventDefault() }
  }
  function onKeyUp(e) { if (e.key in keys) keys[e.key] = false }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
  }
  function start() {
    ({ t, speed, lap, prevPos, running } = resetRacerState())
    Object.keys(keys).forEach(key => { keys[key] = false })
    statusEl.textContent = 'Hold Up or W to drive · Down or S to reverse'
    ro = new ResizeObserver(resize); ro.observe(canvas)
    resize()
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    loop()
  }
  function stop() {
    running = false
    cancelAnimationFrame(frame)
    ro?.disconnect()
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKeyUp)
  }
  return { start, stop }
}