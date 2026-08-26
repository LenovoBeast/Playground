import * as THREE from 'three'
import { setupScene, buildWorld, clickObjects } from './world.js'

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

// Load each game only when it is first opened. Vite emits one lazy chunk per module.
const gameLoaders = {
  snake: () => import('./games/snake.js').then(({ createSnake }) => createSnake(
    document.getElementById('snakeCanvas'),
    document.getElementById('snakeScore'),
    document.getElementById('snakeStatus')
  )),
  breakout: () => import('./games/breakout.js').then(({ createBreakout }) => createBreakout(
    document.getElementById('breakoutCanvas'),
    document.getElementById('breakoutScore'),
    document.getElementById('breakoutStatus')
  )),
  racer: () => import('./games/racer.js').then(({ createRacer }) => createRacer(
    document.getElementById('racerCanvas'),
    document.getElementById('racerScore'),
    document.getElementById('racerStatus')
  )),
  match3: () => import('./games/match3.js').then(({ createMatch3 }) => createMatch3(
    document.getElementById('match3Canvas'),
    document.getElementById('match3Score'),
    document.getElementById('match3Status')
  )),
  launch: () => import('./games/launch.js').then(({ createLaunch }) => createLaunch(
    document.getElementById('launchCanvas'),
    document.getElementById('launchScore'),
    document.getElementById('launchStatus')
  ))
}
const games = new Map()
const gameLoads = new Map()

function loadGame(name) {
  if (games.has(name)) return Promise.resolve(games.get(name))
  if (!gameLoads.has(name)) {
    gameLoads.set(name, gameLoaders[name]().then(game => {
      games.set(name, game)
      return game
    }))
  }
  return gameLoads.get(name)
}

document.querySelectorAll('.game-card').forEach(card => {
  const name = card.dataset.game
  const overlay = document.getElementById(`${name}Overlay`)
  const loading = overlay.querySelector('.game-loading')
  let openRequest = 0
  const open = async () => {
    if (overlay.classList.contains('active')) return
    const request = ++openRequest
    worldRunning = false
    overlay.classList.add('active')
    overlay.setAttribute('aria-busy', 'true')
    loading.textContent = 'Loading game…'
    try {
      const game = await loadGame(name)
      if (request !== openRequest || !overlay.classList.contains('active')) return
      loading.textContent = ''
      overlay.removeAttribute('aria-busy')
      game.start()
    } catch (error) {
      console.error(`Unable to load ${name}`, error)
      if (request === openRequest) loading.textContent = 'Unable to load game. Please try again.'
    }
  }
  const close = () => {
    openRequest++
    overlay.classList.remove('active')
    overlay.removeAttribute('aria-busy')
    games.get(name)?.stop()
    worldRunning = true
    requestAnimationFrame(worldTick)
  }
  const onKey = e => { if (e.key === 'Escape' && overlay.classList.contains('active')) close() }
  card.addEventListener('click', open)
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } })
  overlay.querySelector('.close-btn').addEventListener('click', close)
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  document.addEventListener('keydown', onKey)
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