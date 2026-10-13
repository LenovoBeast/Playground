// Micro Racer — toy car on a 3D track loop
import * as THREE from 'three'
import { upgradeScene, resizeGame } from './graphics.js'
import { advanceRacer, createRacerState, formatLapTime, RACER_LAPS, racerLapTime } from './gameLogic.js'
import {
  createClock,
  createKeyState,
  createPauseState,
  mirrorState,
  readBest,
  withHints,
  writeBest,
  isPauseKey,
  isRestartKey,
} from './gameKit.js'
import { createHudLayer, makeTrackTexture } from './gameArt.js'
import { playBeep } from './sound.js'

const GAME_NAME = 'racer-bestlap'
const cameraTarget = new THREE.Vector3()

// Generated lane markings: a plain emissive tube gave no sense of speed.
function trackTexture(THREE) {
  const canvas = makeTrackTexture({ size: 128 })
  if (!canvas) return null
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 60)
  return texture
}

export function createRacer(canvas, scoreEl, statusEl) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
  camera.position.set(0, 6, 12)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  upgradeScene(renderer, scene)

  scene.add(new THREE.AmbientLight(0x6b4d8a, 0.5))
  const dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(5, 10, 5); scene.add(dir)
  const glow = new THREE.PointLight(0xff6bcf, 0.8, 15); glow.position.set(0, 1, 0); scene.add(glow)

  const clock = createClock()
  const pause = createPauseState()

  // Built in start(): start() calls stop() first for cleanup.
  let hudLayer = { set() {}, destroy() {} }

  function buildHud() {
    return createHudLayer(canvas, [
      { key: 'lap', label: 'lap', align: 'left', initial: '0/3' },
      { key: 'time', label: 'lap time', align: 'left', initial: '00:00.00' },
      { key: 'speed', label: 'speed', align: 'center', initial: '0%' },
      { key: 'best', label: 'best lap', align: 'right', initial: '--:--' },
    ])
  }
  // Left/right never did anything (the car follows the track), so they are gone
  // rather than advertised as controls.
  const keys = createKeyState({ ArrowUp: true, ArrowDown: true, w: true, s: true, W: true, S: true })

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
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: trackTexture(THREE),
      emissive: 0x2a7f9c,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.3,
    })
  )
  scene.add(trackMesh)
  const sleeperGeometry = new THREE.BoxGeometry(0.5, 0.035, 0.16)
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x344c68, metalness: 0.65, roughness: 0.3 })
  for (let i = 0; i < 96; i++) {
    const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial)
    const position = curve.getPointAt(i / 96)
    sleeper.position.copy(position)
    sleeper.position.y -= 0.06
    sleeper.lookAt(curve.getPointAt((i / 96 + 0.01) % 1))
    scene.add(sleeper)
  }

  // Start/finish line marker so the lap rule is visible
  const startLine = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.02, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xfff06b, emissive: 0xfff06b, emissiveIntensity: 0.6 })
  )
  const startPoint = curve.getPointAt(0)
  startLine.position.set(startPoint.x, startPoint.y - 0.05, startPoint.z)
  startLine.lookAt(curve.getPointAt(0.01))
  scene.add(startLine)

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
  const wheelGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.035, 16)
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x121c2c, metalness: 0.5, roughness: 0.4 })
  const wheels = []
  for (const x of [-0.1, 0.1]) for (const z of [-0.11, 0.11]) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(x, -0.04, z)
    car.add(wheel)
    wheels.push(wheel)
  }
  // Headlights so the car has a front, plus a dark windscreen.
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff6c9 })
  for (const z of [-0.05, 0.05]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), headlightMaterial)
    light.position.set(0.16, 0.01, z)
    car.add(light)
  }
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x0a1424, metalness: 0.6, roughness: 0.15 })
  )
  screen.position.set(0.06, 0.09, 0)
  car.add(screen)
  scene.add(car)

  let state = createRacerState()
  let bestLap = 0
  let frame, ro

  function syncHud() {
    // Racer is time-based, so it shows lap time where the other games show a
    // score — but through the same formatting helpers.
    scoreEl.textContent = `LAP ${Math.min(state.lap, RACER_LAPS)}/${RACER_LAPS} · ${formatLapTime(racerLapTime(state))} · BEST ${formatLapTime(bestLap || null)}`
  }

  function placeCar() {
    const pos = curve.getPointAt(state.t)
    const ahead = curve.getPointAt((state.t + 0.01) % 1)
    car.position.copy(pos)
    car.position.y += 0.12
    car.lookAt(ahead.x, ahead.y + 0.12, ahead.z)
    for (const wheel of wheels) wheel.rotation.z -= state.speed * 0.6
    cameraTarget.set(pos.x * 0.6, pos.y + 4, pos.z + 8)
    camera.position.lerp(cameraTarget, 0.08)
    camera.lookAt(car.position)
  }

  function update(dt) {
    const next = advanceRacer(state, {
      accelerate: keys.held.ArrowUp || keys.held.w || keys.held.W,
      reverse: keys.held.ArrowDown || keys.held.s || keys.held.S,
    }, dt, { laps: RACER_LAPS })
    state = next
    for (const event of next.events) {
      if (event === 'lap') {
        playBeep(660, 0.08)
        statusEl.textContent = withHints(`Lap ${Math.min(state.lap, RACER_LAPS)} of ${RACER_LAPS} · last ${formatLapTime(racerLapTime(state))}`)
      } else if (event === 'lap-lost') {
        statusEl.textContent = withHints(`Lap ${state.lap} of ${RACER_LAPS} · crossed the line backwards`)
      } else if (event === 'finish') {
        const lap = state.bestLap ?? racerLapTime(state)
        if (lap < bestLap || bestLap === 0) {
          bestLap = lap
          writeBest(GAME_NAME, Math.round(lap * 1000))
        }
        playBeep(980, 0.3)
        statusEl.textContent = withHints(
          `Finished! Best lap ${formatLapTime(bestLap)} · R to race again`,
          { pause: false }
        )
      }
    }
    placeCar()
  }

  function loop() {
    const dt = clock.tick(performance.now())
    if (!pause.paused) update(dt)
    syncHud()
    hudLayer.set({
      lap: `${Math.min(state.lap, RACER_LAPS)}/${RACER_LAPS}`,
      time: formatLapTime(racerLapTime(state)),
      speed: `${Math.round(Math.min(1, Math.abs(state.speed) / 0.3) * 100)}%`,
      best: formatLapTime(bestLap || null),
    })
    mirrorState(canvas, [Math.round(state.t * 100), state.lap, pause.paused ? 'paused' : state.finished ? 'finished' : 'racing'])
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }

  function onKey(e) {
    if (keys.down(e.key)) { e.preventDefault(); return }
    if (isRestartKey(e.key)) {
      e.preventDefault()
      start()
      return
    }
    if (isPauseKey(e.key)) {
      e.preventDefault()
      if (!state.finished) {
        const paused = pause.toggle()
        statusEl.textContent = paused ? withHints('Paused') : withHints('Back on the track')
      }
    }
  }

  function onKeyUp(e) {
    keys.up(e.key)
  }

  function resize() {
    resizeGame(renderer, camera, canvas, 1.4)
  }

  function start() {
    stop()
    state = createRacerState()
    clock.reset()
    pause.set(false)
    keys.clear()
    const stored = readBest(GAME_NAME)
    bestLap = stored ? stored / 1000 : 0
    hudLayer = buildHud()
    statusEl.textContent = withHints(
      `Hold ↑ or W to drive · ${RACER_LAPS} laps${bestLap ? ` · best ${formatLapTime(bestLap)}` : ''}`
    )
    ro = new ResizeObserver(resize); ro.observe(canvas)
    resize()
    placeCar()
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    loop()
  }

  function stop() {
    cancelAnimationFrame(frame)
    hudLayer.destroy()
    hudLayer = { set() {}, destroy() {} }
    ro?.disconnect()
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('keyup', onKeyUp)
    keys.clear()
  }

  return { start, stop }
}
