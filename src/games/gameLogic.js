import { substeps } from './gameKit.js'

export const SNAKE_GRID = 16
// `top` sits above the highest brick row (y=3.0, half-height 0.2). It used to be
// 2, which bounced the ball at y=2.2 — below rows 0 and 1 — so a fifth of the
// wall was unreachable and the "clear every brick" win could never trigger.
export const BREAKOUT_BOUNDS = Object.freeze({ left: -6, right: 6, top: 3.8, bottom: -4.6 })
export const BREAKOUT_BALL_RADIUS = 0.22
export const BREAKOUT_PADDLE_Y = -3.5
export const BREAKOUT_LIVES = 3
export const BREAKOUT_BRICK_POINTS = 10
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

// Direction inputs are buffered (up to two) and each is validated against the
// direction the snake will actually be travelling when it is applied. Without
// the buffer, a quick "up then left" while heading right silently dropped the
// second press; validating against the previous queued turn is what keeps the
// buffer from allowing a 180-degree reversal into the snake's own neck.
export const SNAKE_INPUT_BUFFER = 2

export function queueSnakeDirection(queue, currentDirection, key) {
  const candidate = snakeDirections[key] ?? snakeDirections[key?.toLowerCase()]
  if (!candidate) return queue
  const reference = queue.length ? queue[queue.length - 1] : currentDirection
  if (candidate.x === -reference.x && candidate.y === -reference.y) return queue
  if (candidate.x === reference.x && candidate.y === reference.y) return queue
  if (queue.length >= SNAKE_INPUT_BUFFER) return queue
  return [...queue, candidate]
}

// The snake advances on a fixed cadence, but the cadence must not be tied to the
// display refresh rate. The old loop compared wall-clock time and reset the
// timestamp to `now`, discarding the remainder — so the snake ran at a slightly
// different speed on every machine, and at most one step could happen per frame.
// This accumulator keeps the remainder and caps catch-up steps after a stall.
export const SNAKE_MAX_CATCHUP = 4

export function snakeStepsDue(accumulatorMs, dtMs, stepMs, maxSteps = SNAKE_MAX_CATCHUP) {
  const total = accumulatorMs + dtMs
  const steps = Math.min(maxSteps, Math.floor(total / stepMs))
  return { steps, remainder: total - steps * stepMs }
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
    lives: BREAKOUT_LIVES,
    paddleX: 0,
    ball: { x: 0, y: -3 },
    ballVelocity: { x: (random() - 0.5) * 3, y: 5, z: 0 },
    alive: true,
    won: false,
    events: []
  }
}

// Ball speed stays inside a range the paddle can react to.
export function clampBallSpeed(velocity, min = 2, max = 9) {
  const speed = Math.hypot(velocity.x, velocity.y)
  if (speed === 0) return { ...velocity, y: min }
  const clamped = Math.max(min, Math.min(max, speed))
  const scale = clamped / speed
  return { ...velocity, x: velocity.x * scale, y: velocity.y * scale }
}

// ---------------------------------------------------------------- breakout physics
// Pure simulation of the ball, walls, paddle and bricks, sub-stepped so a fast
// ball can't pass through a 0.4-tall brick between frames. `bricks` are the
// engine's plain records ({ x, y, alive }); the function flips `alive` on a hit
// and reports the destroyed bricks so the caller can drop their meshes.
export function stepBreakout(state, dt, { paddleX, bricks = [], bounds = BREAKOUT_BOUNDS } = {}) {
  if (!state.alive || state.won) {
    return { ...state, events: [], destroyed: [] }
  }
  const r = BREAKOUT_BALL_RADIUS
  const ball = { ...state.ball }
  let velocity = { ...state.ballVelocity }
  const destroyed = []
  const events = []
  let score = state.score
  let lives = state.lives
  let alive = true
  let won = false

  for (const step of substeps(dt, 1 / 240)) {
    ball.x += velocity.x * step
    ball.y += velocity.y * step

    // walls (reflect against the ball's edge, not its centre)
    if (ball.x - r < bounds.left) { ball.x = bounds.left + r; velocity.x = Math.abs(velocity.x) }
    if (ball.x + r > bounds.right) { ball.x = bounds.right - r; velocity.x = -Math.abs(velocity.x) }
    if (ball.y + r > bounds.top) { ball.y = bounds.top - r; velocity.y = -Math.abs(velocity.y) }

    if (hitsPaddle(ball, { x: paddleX, y: BREAKOUT_PADDLE_Y }, velocity)) {
      ball.y = BREAKOUT_PADDLE_Y + 0.32
      velocity.y = Math.abs(velocity.y)
      // Where the ball lands on the paddle steers it — the core of the game.
      velocity.x += (ball.x - paddleX) * 1.5
      velocity = ensureBallSpread(ensureBallDescent(clampBallSpeed(velocity)))
      events.push('paddle')
    }

    for (const brick of bricks) {
      if (!hitsBrick(ball, brick)) continue
      brick.alive = false
      destroyed.push(brick)
      velocity = ensureBallDescent(
        clampBallSpeed(resolveBrickBounce(velocity, brickBounceAxis(ball, brick, velocity)))
      )
      score += BREAKOUT_BRICK_POINTS
      events.push('brick')
      break
    }

    if (ball.y - r < bounds.bottom) {
      lives -= 1
      if (lives <= 0) {
        alive = false
        events.push('gameover')
      } else {
        ball.x = 0
        ball.y = -3
        velocity = { x: 0, y: 5, z: 0 }
        events.push('serve')
      }
      break
    }
  }

  if (bricks.length && bricks.every((brick) => !brick.alive)) {
    won = true
    alive = false
    events.push('won')
  }

  return { ...state, ball, ballVelocity: velocity, score, lives, alive, won, events, destroyed }
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

// A held key must move the paddle over TIME, not once per key-repeat event:
// the old implementation moved 0.5 units per keydown, so paddle speed depended
// on the operating system's repeat delay and rate.
export const PADDLE_SPEED = 7.5 // units per second

export function movePaddleAxis(paddleX, axis, dt, bounds = BREAKOUT_BOUNDS, speed = PADDLE_SPEED) {
  const next = paddleX + axis * speed * dt
  return Math.max(bounds.left + 0.95, Math.min(bounds.right - 0.95, next))
}

// Which axis a ball should bounce off when it hits a brick. The old code always
// flipped the vertical component, so a ball hitting a brick's side bounced
// upward — visibly wrong, and it could drive the ball into a neighbouring brick.
// The correct axis is the one the ball entered through: the smaller penetration
// depth. Bricks are wide and thin (0.6 x 0.22 half-extents).
export const BREAKOUT_BRICK_HALF = Object.freeze({ x: 0.6, y: 0.22 })

export function brickBounceAxis(ball, brick, velocity = { x: 0, y: 0 }) {
  const penX = BREAKOUT_BRICK_HALF.x - Math.abs(ball.x - brick.x)
  const penY = BREAKOUT_BRICK_HALF.y - Math.abs(ball.y - brick.y)
  if (penX < penY) return 'x'
  if (penY < penX) return 'y'
  // Dead-centre corner: fall back to the dominant direction of travel.
  return Math.abs(velocity.x) >= Math.abs(velocity.y) ? 'x' : 'y'
}

export function resolveBrickBounce(velocity, axis) {
  const next = { ...velocity }
  if (axis === 'x') next.x *= -1
  else next.y *= -1
  return next
}

// Keep the ball from settling into a flat horizontal path (vy ~ 0), which made
// rallies stall: it would bounce side to side forever and never come down.
export function ensureBallDescent(velocity, minimum = 1.6) {
  const next = { ...velocity }
  if (Math.abs(next.y) < minimum) next.y = next.y < 0 ? -minimum : minimum
  return next
}

// ...and the mirror problem: a dead-centre paddle hit produced a perfectly
// vertical ball, which then rallied up and down a single cleared column forever.
// A minimum sideways component guarantees the ball keeps finding new bricks.
export function ensureBallSpread(velocity, minimum = 1.2) {
  const next = { ...velocity }
  if (Math.abs(next.x) < minimum) {
    next.x = next.x < 0 ? -minimum : minimum
  }
  return next
}

// ---------------------------------------------------------------- racer
// Lap tracking is positional, not distance-based: the old check incremented the
// lap whenever the car moved more than 3 units in one frame, so a fast frame or
// a frame hitch added phantom laps and reversing never removed them.
export const RACER_LAPS = 3
export const RACER_MAX_SPEED = 0.3   // track fractions per second
export const RACER_REVERSE_SPEED = 0.15

export function createRacerState() {
  return {
    t: 0,
    speed: 0,
    lap: 0,
    lapStartAt: 0,
    bestLap: null,
    elapsed: 0,
    prevT: 0,
    running: true,
    finished: false,
  }
}

export function resetRacerState() {
  return createRacerState()
}

// Advance the car along the closed track. `input` is { accelerate, reverse }.
// Returns a new state plus one-shot events the engine can react to.
export function advanceRacer(state, input = {}, dt = 1 / 60, { laps = RACER_LAPS } = {}) {
  if (state.finished) return { ...state, events: [] }

  const target = input.accelerate
    ? RACER_MAX_SPEED
    : input.reverse
      ? -RACER_REVERSE_SPEED
      : 0
  // Frame-rate independent smoothing (the old code applied a fixed 0.05 per
  // frame, so acceleration differed between 30Hz and 144Hz displays).
  const blend = Math.min(1, dt * 3)
  const speed = state.speed + (target - state.speed) * blend
  const elapsed = state.elapsed + dt

  let t = state.t + speed * dt
  let lap = state.lap
  let lapStartAt = state.lapStartAt
  let bestLap = state.bestLap
  let finished = false
  const events = []

  // Crossing the start line forward completes a lap; crossing it backward
  // (reversing over the line) un-counts one.
  while (t >= 1) {
    t -= 1
    const lapTime = elapsed - lapStartAt
    if (lap > 0 || state.elapsed > 0) {
      bestLap = bestLap === null ? lapTime : Math.min(bestLap, lapTime)
    }
    lap += 1
    lapStartAt = elapsed
    events.push('lap')
    if (lap >= laps) {
      finished = true
      events.push('finish')
      break
    }
  }
  while (t < 0) {
    t += 1
    if (lap > 0) {
      lap -= 1
      events.push('lap-lost')
    }
  }

  return {
    ...state,
    t,
    speed: finished ? 0 : speed,
    lap,
    lapStartAt,
    bestLap,
    elapsed,
    prevT: state.t,
    running: !finished,
    finished,
    events,
  }
}

// Current lap time in seconds (frozen once the race is finished).
export function racerLapTime(state) {
  return state.finished ? state.lapStartAt : Math.max(0, state.elapsed - state.lapStartAt)
}

export function formatLapTime(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '--:--'
  const whole = Math.max(0, seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${rest.toFixed(2).padStart(5, '0')}`
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
  const cascadeClears = []
  for (let round = 0; round < 100; round++) {
    const matches = findMatch3Cells(nextBoard)
    if (matches.length === 0) break
    cleared += matches.length
    cascadeClears.push(matches.length)
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
  return { board: nextBoard, cleared, cascadeClears }
}

// Scoring rewards chain reactions: each successive cascade in one turn is worth
// more per candy than the last, so setting up a double or triple is worth doing.
export const MATCH3_BASE_POINTS = 10

export function scoreMatch3Cascades(cascadeClears) {
  return cascadeClears.reduce((total, count, index) =>
    total + count * MATCH3_BASE_POINTS * (index + 1), 0)
}

// A board can run out of legal swaps while the player still has moves left. The
// old build simply let them click forever with nothing happening.
export function hasMatch3Move(board) {
  const size = board.length
  const produces = (first, second) => {
    const swapped = swapMatch3Cells(board, first, second)
    return swapped.valid && swapped.matches.length > 0
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (col + 1 < size && produces({ row, col }, { row, col: col + 1 })) return true
      if (row + 1 < size && produces({ row, col }, { row: row + 1, col })) return true
    }
  }
  return false
}

// Reshuffle until the board has no pre-made matches AND at least one legal move.
export function shuffleMatch3Board(random = Math.random, size = MATCH3_SIZE) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const board = createMatch3Board(size, random)
    if (hasMatch3Move(board)) return { board, shuffled: true, attempts: attempt + 1 }
  }
  // Extremely unlikely: fall back to the last board so the game keeps running.
  return { board: createMatch3Board(size, random), shuffled: false, attempts: 40 }
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
  if (!swapped.valid || swapped.matches.length === 0) {
    // Report the failure explicitly; the engine used to infer it by comparing
    // scores, which breaks the moment scoring rules change.
    return { ...state, selected: first, lastTurnValid: false }
  }
  const resolved = resolveMatch3Board(swapped.board, random)
  const score = state.score + scoreMatch3Cascades(resolved.cascadeClears)
  const moves = state.moves - 1
  const board = resolved.board
  const deadlocked = moves > 0 && score < 300 && !hasMatch3Move(board)
  return {
    ...state,
    board,
    score,
    moves,
    selected: null,
    lastTurnValid: true,
    lastCascade: resolved.cascadeClears.length,
    deadlocked,
    alive: moves > 0 && score < 300,
    won: score >= 300
  }
}

// ---------------------------------------------------------------- launch
export const LAUNCH_MAX_SHOTS = 8
export const LAUNCH_TARGET_POINTS = 100
export const LAUNCH_SHOT_BONUS = 25

export function shotsLeft(state) {
  return Math.max(0, LAUNCH_MAX_SHOTS - state.shots)
}

// Bonus for finishing with shots to spare — turns the game from "poke at it"
// into a precision challenge, since every extra shot costs points.
export function launchAccuracyBonus(state) {
  return shotsLeft(state) * LAUNCH_SHOT_BONUS
}

export function createLaunchState() {
  return {
    angle: 0.72,
    power: 0.78,
    projectile: null,
    // Spread across the skyline: clustered targets let a single lucky arc clear
    // the whole board, which made the shot budget meaningless.
    targets: [
      { x: 7.2, y: 4.6, radius: 0.42, alive: true },
      { x: 9.4, y: 3.5, radius: 0.42, alive: true },
      { x: 10.9, y: 4.7, radius: 0.42, alive: true }
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
  if (shotsLeft(state) <= 0) return state
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
