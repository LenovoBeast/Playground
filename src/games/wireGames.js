import * as THREE from 'three'

// Load each game only when it is first opened. Vite emits one lazy chunk
// per module, so the rest of the bundle stays light until it is needed.
const gameLoaders = {
  snake: () => import('./snake.js').then(({ createSnake }) => createSnake(
    document.getElementById('snakeCanvas'),
    document.getElementById('snakeScore'),
    document.getElementById('snakeStatus')
  )),
  breakout: () => import('./breakout.js').then(({ createBreakout }) => createBreakout(
    document.getElementById('breakoutCanvas'),
    document.getElementById('breakoutScore'),
    document.getElementById('breakoutStatus')
  )),
  racer: () => import('./racer.js').then(({ createRacer }) => createRacer(
    document.getElementById('racerCanvas'),
    document.getElementById('racerScore'),
    document.getElementById('racerStatus')
  )),
  match3: () => import('./match3.js').then(({ createMatch3 }) => createMatch3(
    document.getElementById('match3Canvas'),
    document.getElementById('match3Score'),
    document.getElementById('match3Status')
  )),
  launch: () => import('./launch.js').then(({ createLaunch }) => createLaunch(
    document.getElementById('launchCanvas'),
    document.getElementById('launchScore'),
    document.getElementById('launchStatus')
  ))
}

// Cache successful engines, share concurrent downloads, and allow failed loads to retry.
export function createGameLoaders(loaders = gameLoaders) {
  const games = new Map()
  const gameLoads = new Map()

  function loadGame(name) {
    if (!Object.hasOwn(loaders, name)) return Promise.reject(new Error(`Unknown game: ${name}`))
    if (games.has(name)) return Promise.resolve(games.get(name))
    if (!gameLoads.has(name)) {
      gameLoads.set(name, Promise.resolve().then(() => loaders[name]()).then(game => {
        games.set(name, game)
        return game
      }).catch(error => {
        gameLoads.delete(name)
        throw error
      }))
    }
    return gameLoads.get(name)
  }

  return { loadGame, games }
}

// A single owner prevents duplicate loops and invalidates downloads on close.
export function createGameSession(loaders = createGameLoaders()) {
  let active = null
  let generation = 0
  function close() {
    generation++
    active?.stop()
    active = null
  }
  async function play(name) {
    close()
    const request = generation
    const engine = await loaders.loadGame(name)
    if (request !== generation) return false
    active = engine
    try {
      engine.start()
    } catch (error) {
      close()
      throw error
    }
    return true
  }
  return { play, close }
}

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