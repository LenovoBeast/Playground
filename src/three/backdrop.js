import * as THREE from 'three'

// ============================================================================
// The Nexus backdrop.
//
// A real-time Three.js scene that lives behind the entire page:
//   • a crystalline core (the portfolio's "identity")
//   • one glowing node per site section, joined to the core by light lines
//   • a drifting dust field for depth
//
// It is genuinely interactive: drag to spin the constellation, hover a node to
// highlight it, click a node (or its projected DOM label) to fly to that
// section. Scroll depth dollies the camera, so the scene also acts as a
// physical metaphor for reading progress.
// ============================================================================

function makeGlowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.16)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const NOOP_RESULT = {
  update() {},
  resize() {},
  project: () => [],
  setInteractive() {},
  setActive() {},
  dispose() {},
  ok: false,
}

export function createBackdrop(canvas, options = {}) {
  const { nodes = [], onSelect, onHover, reducedMotion = false } = options
  if (!canvas) return NOOP_RESULT

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
  } catch (err) {
    console.warn('[nexus] WebGL unavailable, backdrop disabled', err)
    return NOOP_RESULT
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
  camera.position.set(0, 0, 16)

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.setClearColor(0x000000, 0)

  const glow = makeGlowTexture()
  const root = new THREE.Group()
  scene.add(root)

  // ---------------------------------------------------------------- core ----
  const coreGroup = new THREE.Group()
  root.add(coreGroup)

  const coreGeo = new THREE.IcosahedronGeometry(1.85, 1)
  const coreWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.45 }),
  )
  coreGroup.add(coreWire)

  const coreSolid = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 2),
    new THREE.MeshBasicMaterial({ color: 0x1b0f33, transparent: true, opacity: 0.9 }),
  )
  coreGroup.add(coreSolid)

  const coreShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 3),
    new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  )
  coreGroup.add(coreShell)

  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  coreGlow.scale.setScalar(9)
  coreGroup.add(coreGlow)

  // Decorative containment rings
  const ringMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.16 })
  const ring1 = new THREE.LineLoop(circleGeometry(8.8, 128), ringMat)
  ring1.rotation.x = Math.PI / 2
  root.add(ring1)
  const ring2 = new THREE.LineLoop(circleGeometry(6.4, 128), ringMat.clone())
  ring2.rotation.x = Math.PI / 2.6
  ring2.rotation.z = 0.4
  root.add(ring2)

  // --------------------------------------------------------------- nodes ----
  const nodeMeshes = []
  const nodeSprites = []
  const nodeGroup = new THREE.Group()
  root.add(nodeGroup)

  const count = nodes.length || 1
  nodes.forEach((node, i) => {
    const angle = (i / count) * Math.PI * 2 + 0.55
    const radius = 7
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: node.color ?? 0x22d3ee, transparent: true, opacity: 0.95 }),
    )
    mesh.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * 3.4,
      Math.sin(angle * 2) * 1.5,
    )
    mesh.userData.id = node.id
    mesh.userData.baseScale = 1
    mesh.userData.phase = i * 1.3

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color: node.color ?? 0x22d3ee,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    halo.scale.setScalar(2.4)
    mesh.add(halo)
    nodeSprites.push(halo)

    nodeGroup.add(mesh)
    nodeMeshes.push(mesh)
  })

  // Light lines from the core out to each node
  const linkPositions = []
  nodeMeshes.forEach((mesh) => {
    linkPositions.push(0, 0, 0, mesh.position.x, mesh.position.y, mesh.position.z)
  })
  const linkGeo = new THREE.BufferGeometry()
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3))
  const links = new THREE.LineSegments(
    linkGeo,
    new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.2 }),
  )
  nodeGroup.add(links)

  // ---------------------------------------------------------------- dust ----
  const dustCount = reducedMotion ? 320 : 1100
  const dustPos = new Float32Array(dustCount * 3)
  const dustSeed = new Float32Array(dustCount)
  for (let i = 0; i < dustCount; i += 1) {
    const r = 6 + Math.random() * 16
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    dustPos[i * 3 + 1] = r * Math.cos(phi) * 0.55
    dustPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    dustSeed[i] = Math.random() * Math.PI * 2
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      map: glow,
      color: 0xb9a6ff,
      size: 0.42,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  scene.add(dust)

  // ------------------------------------------------------------- pointer ----
  const pointer = new THREE.Vector2(-2, -2)
  const raycaster = new THREE.Raycaster()
  let interactive = false
  let dragging = false
  let dragMoved = 0
  let lastX = 0
  let lastY = 0
  let hovered = null

  let spinY = 0
  let spinX = 0
  let velY = 0
  let velX = 0
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 }

  const setCursor = (cls) => {
    canvas.classList.toggle('is-dragging', cls)
  }

  const onPointerDown = (e) => {
    if (!interactive || e.pointerType !== 'mouse') return
    dragging = true
    dragMoved = 0
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture?.(e.pointerId)
    setCursor(true)
  }

  const onPointerUp = (e) => {
    if (!dragging) return
    dragging = false
    canvas.releasePointerCapture?.(e.pointerId)
    setCursor(false)
    if (dragMoved < 6 && hovered) {
      onSelect?.(hovered)
    }
  }

  let overCanvas = false

  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    // Parallax tracks the pointer everywhere; hit-testing only counts when the
    // pointer is genuinely over the canvas (not over a card stacked on top).
    overCanvas = e.target === canvas
    parallax.tx = pointer.x
    parallax.ty = pointer.y

    if (dragging) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      dragMoved += Math.abs(dx) + Math.abs(dy)
      velY += dx * 0.00035
      velX += dy * 0.00022
    }
  }

  const onPointerLeave = () => {
    pointer.set(-2, -2)
    overCanvas = false
    parallax.tx = 0
    parallax.ty = 0
    if (hovered) {
      hovered = null
      onHover?.(null)
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerLeave)
  // Tracked on window so parallax keeps responding even while the pointer
  // travels across foreground content.
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  // --------------------------------------------------------------- state ----
  let activeId = null
  let scrollProgress = 0
  let time = 0
  let width = window.innerWidth
  let height = window.innerHeight

  const tmpVec = new THREE.Vector3()
  const basePositions = nodeMeshes.map((m) => m.position.clone())

  function project() {
    const rect = canvas.getBoundingClientRect()
    return nodeMeshes.map((mesh, i) => {
      tmpVec.copy(mesh.position)
      nodeGroup.localToWorld(tmpVec)
      tmpVec.project(camera)
      const x = (tmpVec.x * 0.5 + 0.5) * (rect.width || width)
      const y = (-tmpVec.y * 0.5 + 0.5) * (rect.height || height)
      const depth = tmpVec.z
      return {
        id: mesh.userData.id,
        x,
        y,
        depth,
        scale: THREE.MathUtils.clamp(1.15 - depth * 0.22, 0.55, 1.2),
        visible: depth < 1 && depth > -1,
        hovered: hovered === mesh.userData.id,
        active: activeId === mesh.userData.id,
        index: i,
      }
    })
  }

  function update(dt) {
    time += dt

    // Inertia + auto drift
    spinY += velY
    spinX += velX
    velY *= 0.92
    velX *= 0.92
    if (!dragging && !reducedMotion) spinY += dt * 0.045
    spinX = THREE.MathUtils.clamp(spinX, -0.42, 0.42)

    root.rotation.y = spinY
    root.rotation.x = spinX

    // Parallax easing
    parallax.x += (parallax.tx - parallax.x) * Math.min(1, dt * 3)
    parallax.y += (parallax.ty - parallax.y) * Math.min(1, dt * 3)

    // Camera dolly tied to scroll depth + gentle parallax pan
    const radius = 16 - scrollProgress * 5.2
    camera.position.set(
      parallax.x * 1.1,
      parallax.y * 0.7 + scrollProgress * 1.4,
      radius,
    )
    camera.lookAt(0, -scrollProgress * 0.6, 0)
    camera.fov = 50 + Math.sin(time * 0.15) * 0.6
    camera.updateProjectionMatrix()

    // Core breathing
    const breathe = 1 + Math.sin(time * 0.8) * 0.03
    coreWire.scale.setScalar(breathe)
    coreWire.rotation.y += dt * 0.06
    coreWire.rotation.x += dt * 0.02
    coreSolid.rotation.y -= dt * 0.04
    coreShell.scale.setScalar(1 + Math.sin(time * 0.6) * 0.05)
    coreGlow.material.opacity = 0.42 + Math.sin(time * 1.4) * 0.12

    ring1.rotation.z += dt * 0.02
    ring2.rotation.z -= dt * 0.03

    // Node hover / active response
    nodeMeshes.forEach((mesh, i) => {
      const base = basePositions[i]
      const float = reducedMotion ? 0 : Math.sin(time * 0.7 + mesh.userData.phase) * 0.18
      mesh.position.y = base.y + float
      mesh.rotation.y += dt * 0.5
      mesh.rotation.x += dt * 0.22

      const isActive = activeId === mesh.userData.id
      const isHovered = hovered === mesh.userData.id
      const target = isHovered ? 1.9 : isActive ? 1.55 : 1
      mesh.scale.setScalar(mesh.scale.x + (target - mesh.scale.x) * Math.min(1, dt * 6))
      mesh.material.opacity = isHovered || isActive ? 1 : 0.8
      const sprite = nodeSprites[i]
      sprite.material.opacity = (isHovered ? 1 : isActive ? 0.8 : 0.42) * 0.9
      sprite.scale.setScalar((isHovered ? 4.4 : isActive ? 3.6 : 2.4) + Math.sin(time * 2 + i) * 0.12)
    })

    links.material.opacity = 0.14 + (hovered ? 0.12 : 0)

    // Dust drift
    if (!reducedMotion) {
      dust.rotation.y += dt * 0.012
      dust.rotation.x = Math.sin(time * 0.05) * 0.06
    }

    // Hover detection (only while the layer accepts pointer input)
    if (interactive && overCanvas && pointer.x > -1.5) {
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(nodeMeshes, false)
      const id = hits.length ? hits[0].object.userData.id : null
      if (id !== hovered) {
        hovered = id
        onHover?.(id)
      }
    } else if (hovered) {
      hovered = null
      onHover?.(null)
    }

    renderer.render(scene, camera)
  }

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
  }

  function dispose() {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('pointermove', onPointerMove)
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      const mat = obj.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else if (mat) mat.dispose()
    })
    glow.dispose()
    renderer.dispose()
  }

  return {
    update,
    resize,
    project,
    setInteractive(flag) {
      interactive = flag
      canvas.classList.toggle('is-interactive', flag)
      if (!flag) onPointerLeave()
    },
    setActive(id) {
      activeId = id
    },
    setScroll(p) {
      scrollProgress = THREE.MathUtils.clamp(p, 0, 1)
    },
    dispose,
    ok: true,
  }
}

function circleGeometry(radius, segments) {
  const points = []
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
  }
  return new THREE.BufferGeometry().setFromPoints(points)
}
