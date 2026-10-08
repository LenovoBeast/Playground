import * as THREE from 'three'

// Shared, bounded-cost lighting/rendering for the three 3D games.
export function upgradeScene(renderer, scene) {
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  scene.background = new THREE.Color(0x080e1c)
  scene.add(new THREE.HemisphereLight(0x91cfff, 0x241236, 1.4))
  const rim = new THREE.DirectionalLight(0x4fdfff, 2)
  rim.position.set(-6, 8, -4)
  scene.add(rim)
}

// Fit the entire board on narrow/mobile canvases as well as desktop.
export function resizeGame(renderer, camera, canvas, minAspect) {
  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  const baseFov = camera.userData.baseFov ?? camera.fov
  camera.userData.baseFov = baseFov
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(
    Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) * Math.max(1, minAspect / camera.aspect)
  ))
  camera.updateProjectionMatrix()
}
