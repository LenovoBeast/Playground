import * as THREE from 'three'

// Backward-compatible re-exports: the session/loaders used to live here, but
// they are three-free and moved to gameSession.js so importing them doesn't
// drag three.js into the entry chunk. Import them from there directly.
export { createGameLoaders, createGameSession } from './gameSession.js'

export function wireGames({ renderer, camera, clickObjects, onOpen }) {
  // Click 3D objects in the world to launch their matching game
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const onPointerDown = e => {
    // NDC must be derived from the canvas rect, not the window: the playroom
    // canvas is a bounded element inside the Games section.
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(clickObjects, true)
    // `userData.game` lives on the artifact *group*, while the raycast reports
    // the individual child mesh — walk up the parents to resolve it.
    let game = null
    let obj = hits.length ? hits[0].object : null
    while (obj && !game) {
      game = obj.userData?.game ?? null
      obj = obj.parent
    }
    if (game) {
      onOpen(game)
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown)

  return { dispose: () => renderer.domElement.removeEventListener('pointerdown', onPointerDown) }
}
