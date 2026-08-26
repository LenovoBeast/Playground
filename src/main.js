import * as THREE from 'three'
import { setupScene, buildWorld, clickObjects } from './world.js'
import { createSnake } from './games/snake.js'
import { createBreakout } from './games/breakout.js'
import { createRacer } from './games/racer.js'

const { scene, camera, renderer, controls, update, dispose } = setupScene(document.getElementById('canvas'))
const world = buildWorld(scene)

// Pause heavy animations while a game overlay is open
let worldRunning = true
let worldTime = 0

const worldTick = (t) => {
  if (!worldRunning) return
  worldTime = t * 0.001
  world.tick(worldTime)
  controls.update()
  update()
  renderer.render(scene, camera)
  requestAnimationFrame(worldTick)
}
requestAnimationFrame(worldTick)

// Game launchers — wire each overlay to its module
const games = {
  snake: createSnake(document.getElementById('snakeCanvas'), document.getElementById('snakeScore')),
  breakout: createBreakout(document.getElementById('breakoutCanvas'), document.getElementById('breakoutScore')),
  racer: createRacer(document.getElementById('racerCanvas'), document.getElementById('racerScore'))
}

document.querySelectorAll('.game-card').forEach(card => {
  const name = card.dataset.game
  const overlay = document.getElementById(`${name}Overlay`)
  const open = () => {
    worldRunning = false
    overlay.classList.add('active')
    games[name].start()
  }
  const close = () => {
    overlay.classList.remove('active')
    games[name].stop()
    worldRunning = true
    requestAnimationFrame(worldTick)
  }
  card.addEventListener('click', open)
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } })
  overlay.querySelector('.close-btn').addEventListener('click', close)
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
})

// Click 3D objects in the world to launch their matching game
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', e => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(clickObjects, true)
  if (hits.length && hits[0].object.userData.game) {
    document.querySelector(`[data-game="${hits[0].object.userData.game}"]`).click()
  }
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

if (import.meta.hot) import.meta.hot.dispose(dispose)