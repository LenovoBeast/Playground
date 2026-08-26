import * as THREE from 'three'

// Export clickable meshes so main.js can raycast them
export const clickObjects = []

export function setupScene(canvas) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a080c)
  scene.fog = new THREE.FogExp2(0x0a080c, 0.025)

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 4, 12)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Orbit controls — custom minimal impl (no extra dep)
  const controls = createOrbitControls(camera, canvas)

  // Lighting — dreamy: violet key + cyan rim + ambient
  const ambient = new THREE.AmbientLight(0x6b4d8a, 0.4)
  scene.add(ambient)

  const key = new THREE.DirectionalLight(0xc47fff, 1.2)
  key.position.set(8, 10, 6)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 50
  key.shadow.camera.left = -15
  key.shadow.camera.right = 15
  key.shadow.camera.top = 15
  key.shadow.camera.bottom = -15
  scene.add(key)

  const rim = new THREE.DirectionalLight(0x4fdfff, 0.6)
  rim.position.set(-6, 3, -8)
  scene.add(rim)

  const fill = new THREE.PointLight(0xff6bcf, 0.8, 20)
  fill.position.set(-4, 2, 4)
  scene.add(fill)

  const dispose = () => {
    renderer.dispose()
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, renderer, controls, update: () => {}, dispose }
}

function createOrbitControls(camera, dom) {
  const target = new THREE.Vector3(0, 1, 0)
  const minDist = 6, maxDist = 24
  let radius = camera.position.length(), theta = Math.atan2(camera.position.x, camera.position.z), phi = Math.acos(camera.position.y / radius)
  let dragging = false, lastX = 0, lastY = 0
  const update = () => {
    camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta)
    camera.position.y = target.y + radius * Math.cos(phi)
    camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta)
    camera.lookAt(target)
  }
  dom.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; dom.setPointerCapture(e.pointerId) })
  dom.addEventListener('pointerup', e => { dragging = false; dom.releasePointerCapture(e.pointerId) })
  dom.addEventListener('pointermove', e => {
    if (!dragging) return
    const dx = e.clientX - lastX, dy = e.clientY - lastY
    lastX = e.clientX; lastY = e.clientY
    theta -= dx * 0.005
    phi = Math.max(0.2, Math.min(Math.PI - 0.2, phi - dy * 0.005))
  })
  dom.addEventListener('wheel', e => {
    e.preventDefault()
    radius = Math.max(minDist, Math.min(maxDist, radius + e.deltaY * 0.01))
  }, { passive: false })
  update()
  return { update, target: { set: (x, y, z) => target.set(x, y, z) } }
}

export function buildWorld(scene) {
  const group = new THREE.Group()
  scene.add(group)

  // Floating desk — a slab that defies gravity
  const deskGeom = new THREE.BoxGeometry(10, 0.4, 6)
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a1f3a, roughness: 0.6, metalness: 0.1 })
  const desk = new THREE.Mesh(deskGeom, deskMat)
  desk.position.set(0, -0.2, 0)
  desk.castShadow = true
  desk.receiveShadow = true
  group.add(desk)

  // Glowing edge under the desk (the "impossible" element)
  const edgeGeom = new THREE.BoxGeometry(10.2, 0.05, 6.2)
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xc47fff, transparent: true, opacity: 0.8 })
  const edge = new THREE.Mesh(edgeGeom, edgeMat)
  edge.position.set(0, -0.5, 0)
  group.add(edge)

  // Floating particles around the desk
  const particleCount = 400
  const pGeom = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const phases = new Float32Array(particleCount)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    phases[i] = Math.random() * Math.PI * 2
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pMat = new THREE.PointsMaterial({ color: 0xc47fff, size: 0.04, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
  const particles = new THREE.Points(pGeom, pMat)
  group.add(particles)

  // The three "game artifacts" — surreal objects hovering above the desk
  const monitor = buildMonitor()
  monitor.position.set(-3.5, 1.8, -0.5)
  monitor.userData.game = 'snake'
  group.add(monitor)
  clickObjects.push(monitor)

  const brickWall = buildBrickWall()
  brickWall.position.set(3.5, 1.5, -1)
  brickWall.userData.game = 'breakout'
  group.add(brickWall)
  clickObjects.push(brickWall)

  const track = buildTrack()
  track.position.set(0, 0.4, 1.5)
  track.userData.game = 'racer'
  group.add(track)
  clickObjects.push(track)

  // Floating books, candles, glasses — props
  group.add(...buildProps())

  return {
    tick(t) {
      // Float desk gently
      desk.position.y = -0.2 + Math.sin(t * 0.5) * 0.08
      edge.position.y = -0.5 + Math.sin(t * 0.5) * 0.08
      edge.material.opacity = 0.6 + Math.sin(t * 2) * 0.2

      // Rotate artifacts
      monitor.rotation.y = Math.sin(t * 0.3) * 0.15
      brickWall.rotation.y = Math.sin(t * 0.3 + 1) * 0.1
      track.rotation.y = Math.sin(t * 0.3 + 2) * 0.1

      // Drift particles upward
      const pos = particles.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += 0.005
        if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5
      }
      particles.geometry.attributes.position.needsUpdate = true
      particles.rotation.y = t * 0.02
    }
  }
}

function buildMonitor() {
  const group = new THREE.Group()
  // Screen frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.6, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x1a1525, roughness: 0.4, metalness: 0.6 })
  )
  group.add(frame)
  // Screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.4),
    new THREE.MeshBasicMaterial({ color: 0x0a080c })
  )
  screen.position.z = 0.06
  group.add(screen)
  // Snake preview dots
  for (let i = 0; i < 6; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0xc47fff : 0x4fdfff })
    )
    dot.position.set(-0.8 + i * 0.3, -0.3, 0.07)
    group.add(dot)
  }
  // Stand — impossible, just floats
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xc47fff, emissive: 0xc47fff, emissiveIntensity: 0.3 })
  )
  stand.position.y = -1.2
  group.add(stand)
  return group
}

function buildBrickWall() {
  const group = new THREE.Group()
  const colors = [0xc47fff, 0xff6bcf, 0x4fdfff, 0xc47fff, 0xff6bcf]
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const brick = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.15, 0.15),
        new THREE.MeshStandardMaterial({ color: colors[row], emissive: colors[row], emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.2 })
      )
      brick.position.set(-0.9 + col * 0.26, 0.4 - row * 0.17, 0)
      group.add(brick)
    }
  }
  // Ball
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
  )
  ball.position.set(0, -0.5, 0.3)
  group.add(ball)
  return group
}

function buildTrack() {
  const group = new THREE.Group()
  // Loop the impossible loop
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(-1, 0, -1),
    new THREE.Vector3(0, 0, -1.5),
    new THREE.Vector3(1, 0, -1),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(1, 0.5, 1),
    new THREE.Vector3(0, 0.8, 1.5),
    new THREE.Vector3(-1, 0.5, 1)
  ], true)
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 100, 0.05, 8, true),
    new THREE.MeshStandardMaterial({ color: 0x4fdfff, emissive: 0x4fdfff, emissiveIntensity: 0.4 })
  )
  group.add(tube)
  // Toy car
  const car = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xff6bcf, emissive: 0xff6bcf, emissiveIntensity: 0.3 })
  )
  car.add(body)
  car.position.set(-2, 0, 0)
  group.add(car)
  return group
}

function buildProps() {
  const props = []
  // Floating candle
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8e4ec })
  )
  candle.position.set(2.5, 1.2, 1.5)
  props.push(candle)
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff6bcf })
  )
  flame.position.set(2.5, 1.45, 1.5)
  props.push(flame)
  // Floating book
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x4fdfff, emissive: 0x4fdfff, emissiveIntensity: 0.2 })
  )
  book.position.set(-2.5, 1.5, 1.8)
  book.rotation.y = 0.3
  props.push(book)
  // Holographic ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.02, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xc47fff, transparent: true, opacity: 0.6 })
  )
  ring.position.set(0, 3.5, -2)
  ring.rotation.x = Math.PI / 2
  ring.userData.isRing = true
  props.push(ring)
  return props
}