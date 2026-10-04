// Game orchestration, extracted from main.js so it can run inside the React
// app (World.jsx) as well as standalone. It owns: lazy game loading, the
// card/overlay open-close logic, and raycasting the 3D world objects.
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

// Owns the lazy game loaders and their cached instances. The overlay in
// Games.jsx calls loadGame(name).then(game => game.start()); the returned
// engine exposes start/stop so the parent can tear it down on close.
export function createGameLoaders() {
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

  return { loadGame, games }
}

export function wireGames({ renderer, camera, pause, resume, clickObjects }) {
  // Click 3D objects in the world to launch their matching game
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  renderer.domElement.addEventListener('pointerdown', e => {
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
      document.querySelector(`[data-game="${game}"]`)?.click()
    }
  })

  return { dispose: () => {} }
}