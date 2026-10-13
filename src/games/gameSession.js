// Game session management. Deliberately free of any `three` import: the game
// catalog, lazy loaders, and single-owner session must stay in the light
// entry chunk so `three` can be deferred with the 3D scenes that actually
// need it (Playroom + World backdrop).
//
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
