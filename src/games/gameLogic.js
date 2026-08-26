export const SNAKE_GRID = 16
export const BREAKOUT_BOUNDS = Object.freeze({ left: -6, right: 6, top: 2, bottom: -3 })
export const MATCH3_SIZE = 8
export const MATCH3_COLORS = 6

export function createSnakeState() {
  return {
    snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    alive: true,
    stepMs: 140
  }
}

const snakeDirections = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 }
}

export function directionForKey(key, currentDirection) {
  const candidate = snakeDirections[key] ?? snakeDirections[key?.toLowerCase()]
  if (!candidate) return currentDirection
  if (candidate.x === -currentDirection.x && candidate.y === -currentDirection.y) return currentDirection
  return candidate
}

export function spawnSnakeFood(snake, grid = SNAKE_GRID, random = Math.random) {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`))
  const available = []
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y })
    }
  }
  if (available.length === 0) return null
  const index = Math.min(available.length - 1, Math.floor(random() * available.length))
  return available[index]
}

export function advanceSnake({ snake, direction, food, grid = SNAKE_GRID }) {
  const head = snake[0]
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y }
  const ateFood = food && nextHead.x === food.x && nextHead.y === food.y
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1)
  const collided = nextHead.x < 0 || nextHead.x >= grid ||
    nextHead.y < 0 || nextHead.y >= grid ||
    bodyToCheck.some(segment => segment.x === nextHead.x && segment.y === nextHead.y)

  if (collided) return { snake, alive: false, ateFood: false }

  const nextSnake = [nextHead, ...snake]
  if (!ateFood) nextSnake.pop()
  return { snake: nextSnake, alive: true, ateFood }
}

export function createBreakoutState(random = Math.random) {
  return {
    score: 0,
    paddleX: 0,
    ball: { x: 0, y: -3 },
    ballVelocity: { x: (random() - 0.5) * 3, y: 5, z: 0 },
    alive: true
  }
}

export function movePaddle(paddleX, key, bounds = BREAKOUT_BOUNDS) {
  const delta = key === 'ArrowLeft' || key === 'a' ? -0.5 :
    key === 'ArrowRight' || key === 'd' ? 0.5 : 0
  return Math.max(bounds.left + 0.95, Math.min(bounds.right - 0.95, paddleX + delta))
}

export function hitsPaddle(ball, paddle, ballVelocity) {
  return Math.abs(ball.y - paddle.y) < 0.3 &&
    Math.abs(ball.x - paddle.x) < 0.95 &&
    ballVelocity.y < 0
}

export function hitsBrick(ball, brick) {
  return brick.alive && Math.abs(ball.x - brick.x) < 0.6 && Math.abs(ball.y - brick.y) < 0.22
}

export function createRacerState() {
  return { t: 0, speed: 0, lap: 0, prevPos: null, running: true }
}

export function resetRacerState() {
  return createRacerState()
}

function cloneBoard(board) {
  return board.map(row => [...row])
}

function createsMatch(board, row, col, value) {
  return (col >= 2 && board[row][col - 1] === value && board[row][col - 2] === value) ||
    (row >= 2 && board[row - 1][col] === value && board[row - 2][col] === value)
}

export function createMatch3Board(size = MATCH3_SIZE, random = Math.random) {
  const board = Array.from({ length: size }, () => Array(size).fill(0))
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const choices = []
      for (let value = 0; value < MATCH3_COLORS; value++) {
        if (!createsMatch(board, row, col, value)) choices.push(value)
      }
      board[row][col] = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]
    }
  }
  return board
}

export function findMatch3Cells(board) {
  const size = board.length
  const matches = new Set()
  const addRun = run => {
    if (run.length >= 3) run.forEach(([row, col]) => matches.add(`${row},${col}`))
  }

  for (let row = 0; row < size; row++) {
    let run = []
    for (let col = 0; col <= size; col++) {
      if (col < size && (run.length === 0 || board[row][col] === board[row][run[0][1]])) {
        run.push([row, col])
      } else {
        addRun(run)
        run = col < size ? [[row, col]] : []
      }
    }
  }
  for (let col = 0; col < size; col++) {
    let run = []
    for (let row = 0; row <= size; row++) {
      if (row < size && (run.length === 0 || board[row][col] === board[run[0][0]][col])) {
        run.push([row, col])
      } else {
        addRun(run)
        run = row < size ? [[row, col]] : []
      }
    }
  }

  return [...matches].map(key => key.split(',').map(Number)).map(([row, col]) => ({ row, col }))
}

export function swapMatch3Cells(board, first, second) {
  const adjacent = Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1
  const validCell = cell => cell.row >= 0 && cell.row < board.length && cell.col >= 0 && cell.col < board.length
  if (!adjacent || !validCell(first) || !validCell(second)) return { board, valid: false, matches: [] }
  const nextBoard = cloneBoard(board)
  const value = nextBoard[first.row][first.col]
  nextBoard[first.row][first.col] = nextBoard[second.row][second.col]
  nextBoard[second.row][second.col] = value
  return { board: nextBoard, valid: true, matches: findMatch3Cells(nextBoard) }
}

export function resolveMatch3Board(board, random = Math.random) {
  const nextBoard = cloneBoard(board)
  let cleared = 0
  for (let round = 0; round < 100; round++) {
    const matches = findMatch3Cells(nextBoard)
    if (matches.length === 0) break
    cleared += matches.length
    const matched = new Set(matches.map(({ row, col }) => `${row},${col}`))
    for (let col = 0; col < nextBoard.length; col++) {
      const survivors = []
      for (let row = nextBoard.length - 1; row >= 0; row--) {
        if (!matched.has(`${row},${col}`)) survivors.push(nextBoard[row][col])
      }
      for (let row = nextBoard.length - 1, index = 0; row >= 0; row--, index++) {
        nextBoard[row][col] = index < survivors.length
          ? survivors[index]
          : Math.floor(random() * MATCH3_COLORS)
      }
    }
  }
  return { board: nextBoard, cleared }
}

export function createMatch3State(random = Math.random) {
  return {
    board: createMatch3Board(MATCH3_SIZE, random),
    score: 0,
    moves: 30,
    selected: null,
    alive: true,
    won: false
  }
}

export function playMatch3Turn(state, first, second, random = Math.random) {
  if (!state.alive || state.won) return state
  const swapped = swapMatch3Cells(state.board, first, second)
  if (!swapped.valid || swapped.matches.length === 0) return { ...state, selected: first }
  const resolved = resolveMatch3Board(swapped.board, random)
  const score = state.score + resolved.cleared * 10
  const moves = state.moves - 1
  return {
    ...state,
    board: resolved.board,
    score,
    moves,
    selected: null,
    alive: moves > 0 && score < 300,
    won: score >= 300
  }
}

export function createLaunchState() {
  return {
    angle: 0.72,
    power: 0.78,
    projectile: null,
    targets: [
      { x: 8.2, y: 4.55, radius: 0.42, alive: true },
      { x: 9.2, y: 4.55, radius: 0.42, alive: true },
      { x: 8.7, y: 3.65, radius: 0.42, alive: true }
    ],
    score: 0,
    shots: 0,
    alive: true,
    won: false
  }
}

export function adjustLaunchAim(state, angleDelta = 0, powerDelta = 0) {
  return {
    ...state,
    angle: Math.max(0.25, Math.min(1.25, state.angle + angleDelta)),
    power: Math.max(0.35, Math.min(1, state.power + powerDelta))
  }
}

export function launchProjectile(state) {
  if (!state.alive || state.won || state.projectile) return state
  const speed = 3 + state.power * 7
  return {
    ...state,
    projectile: {
      x: 1.35,
      y: 4.65,
      vx: Math.cos(state.angle) * speed,
      vy: -Math.sin(state.angle) * speed,
      radius: 0.28
    },
    shots: state.shots + 1
  }
}

export function stepLaunch(state, dt = 1 / 60) {
  if (!state.projectile || !state.alive || state.won) return state
  const projectile = { ...state.projectile }
  projectile.x += projectile.vx * dt
  projectile.y += projectile.vy * dt
  projectile.vy += 7.5 * dt
  const targets = state.targets.map(target => {
    if (!target.alive) return target
    const distance = Math.hypot(projectile.x - target.x, projectile.y - target.y)
    if (distance > projectile.radius + target.radius) return target
    projectile.vx *= 0.72
    projectile.vy *= -0.62
    return { ...target, alive: false }
  })
  const hitCount = state.targets.filter((target, index) => target.alive && !targets[index].alive).length
  const score = state.score + hitCount * 100
  const cleared = targets.every(target => !target.alive)
  const outOfBounds = projectile.y > 5.4 || projectile.x > 12.5 || projectile.x < -1
  return {
    ...state,
    projectile: outOfBounds ? null : projectile,
    targets,
    score,
    alive: !cleared,
    won: cleared
  }
}
