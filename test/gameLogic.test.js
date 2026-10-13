import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BREAKOUT_BOUNDS,
  BREAKOUT_BALL_RADIUS,
  BREAKOUT_BRICK_POINTS,
  BREAKOUT_LIVES,
  BREAKOUT_PADDLE_Y,
  LAUNCH_MAX_SHOTS,
  LAUNCH_SHOT_BONUS,
  RACER_LAPS,
  RACER_MAX_SPEED,
  RACER_REVERSE_SPEED,
  SNAKE_INPUT_BUFFER,
  SNAKE_MAX_CATCHUP,
  advanceRacer,
  advanceSnake,
  brickBounceAxis,
  clampBallSpeed,
  createBreakoutState,
  createRacerState,
  createSnakeState,
  directionForKey,
  ensureBallDescent,
  findMatch3Cells,
  formatLapTime,
  hasMatch3Move,
  hitsBrick,
  hitsPaddle,
  launchAccuracyBonus,
  movePaddle,
  movePaddleAxis,
  playMatch3Turn,
  queueSnakeDirection,
  racerLapTime,
  resetRacerState,
  resolveBrickBounce,
  scoreMatch3Cascades,
  shotsLeft,
  shuffleMatch3Board,
  snakeStepsDue,
  spawnSnakeFood,
  stepBreakout,
  createMatch3Board,
  adjustLaunchAim,
  createLaunchState,
  launchProjectile,
  stepLaunch
} from '../src/games/gameLogic.js'

test('game restart returns each game to its initial state', () => {
  const snake = createSnakeState()
  snake.score = 50
  snake.snake.unshift({ x: 9, y: 8 })
  assert.deepEqual(createSnakeState(), {
    snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    alive: true,
    stepMs: 140
  })

  const breakout = createBreakoutState(() => 0.5)
  assert.equal(breakout.score, 0)
  assert.equal(breakout.paddleX, 0)
  assert.deepEqual(breakout.ball, { x: 0, y: -3 })
  assert.deepEqual(breakout.ballVelocity, { x: 0, y: 5, z: 0 })
  assert.equal(breakout.alive, true)

  const racer = createRacerState()
  racer.t = 0.75
  racer.lap = 2
  racer.speed = 0.3
  // The shape changed when lap tracking moved from a distance heuristic to
  // crossing the start line: `prevPos` is gone, and lap timing was added.
  assert.deepEqual(resetRacerState(), {
    t: 0,
    speed: 0,
    lap: 0,
    lapStartAt: 0,
    bestLap: null,
    elapsed: 0,
    prevT: 0,
    running: true,
    finished: false
  })
})

test('Snake keyboard controls change direction without allowing an immediate reverse', () => {
  const right = { x: 1, y: 0 }
  assert.deepEqual(directionForKey('ArrowUp', right), { x: 0, y: -1 })
  assert.deepEqual(directionForKey('a', right), right)
  assert.deepEqual(directionForKey('D', right), right)
  assert.deepEqual(directionForKey('unknown', right), right)
})

test('Breakout keyboard controls move and clamp the paddle', () => {
  assert.equal(movePaddle(0, 'ArrowLeft'), -0.5)
  assert.equal(movePaddle(0, 'd'), 0.5)
  assert.equal(movePaddle(BREAKOUT_BOUNDS.left + 0.95, 'a'), -5.05)
  assert.equal(movePaddle(BREAKOUT_BOUNDS.right - 0.95, 'ArrowRight'), 5.05)
  assert.equal(movePaddle(0, 'ArrowUp'), 0)
})

test('Snake collision behavior ends the game at a wall or body segment', () => {
  const wallCollision = advanceSnake({
    snake: [{ x: 0, y: 4 }, { x: 1, y: 4 }],
    direction: { x: -1, y: 0 },
    food: { x: 8, y: 8 }
  })
  assert.equal(wallCollision.alive, false)
  assert.deepEqual(wallCollision.snake, [{ x: 0, y: 4 }, { x: 1, y: 4 }])

  const bodyCollision = advanceSnake({
    snake: [{ x: 4, y: 4 }, { x: 4, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 }],
    direction: { x: 0, y: -1 },
    food: { x: 8, y: 8 }
  })
  assert.equal(bodyCollision.alive, false)
})

test('Snake advances, grows, and scores when it reaches food', () => {
  const result = advanceSnake({
    snake: [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }],
    direction: { x: 1, y: 0 },
    food: { x: 5, y: 4 }
  })
  assert.equal(result.alive, true)
  assert.equal(result.ateFood, true)
  assert.deepEqual(result.snake, [
    { x: 5, y: 4 },
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 }
  ])
})

test('Snake always respawns an orb on an unoccupied cell', () => {
  const snake = []
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!(x === 15 && y === 15)) snake.push({ x, y })
    }
  }
  assert.deepEqual(spawnSnakeFood(snake, 16, () => 0), { x: 15, y: 15 })
  assert.equal(spawnSnakeFood(Array.from({ length: 256 }, (_, index) => ({ x: index % 16, y: Math.floor(index / 16) }))), null)
})

test('match-three board starts clean and a matching swap scores', () => {
  const board = createMatch3Board(8, () => 0.25)
  assert.deepEqual(findMatch3Cells(board), [])

  const turn = playMatch3Turn({
    board: [
      [2, 1, 3],
      [4, 1, 5],
      [1, 0, 2]
    ],
    score: 0,
    moves: 30,
    selected: null,
    alive: true,
    won: false
  }, { row: 2, col: 1 }, { row: 2, col: 0 }, () => 0.5)
  assert.equal(turn.score >= 30, true)
  assert.equal(turn.moves, 29)
  assert.equal(turn.selected, null)
})

test('launch game clamps aim, launches, and detects target collisions', () => {
  const aimed = adjustLaunchAim(createLaunchState(), 10, -10)
  assert.equal(aimed.angle, 1.25)
  assert.equal(aimed.power, 0.35)
  const launched = launchProjectile(createLaunchState())
  assert.equal(launched.shots, 1)
  assert.notEqual(launched.projectile, null)

  const hit = stepLaunch({
    ...createLaunchState(),
    projectile: { x: 8.2, y: 4.55, vx: 0, vy: 0, radius: 0.28 },
    targets: [{ x: 8.2, y: 4.55, radius: 0.42, alive: true }]
  }, 0)
  assert.equal(hit.score, 100)
  assert.equal(hit.won, true)
  assert.equal(hit.targets[0].alive, false)
})

test('Breakout collision behavior detects paddle and live brick hits', () => {
  assert.equal(
    hitsPaddle({ x: 0.4, y: -3 }, { x: 0, y: -3 }, { y: -2 }),
    true
  )
  assert.equal(
    hitsPaddle({ x: 0.4, y: -3 }, { x: 0, y: -3 }, { y: 2 }),
    false
  )
  assert.equal(hitsBrick(
    { x: 1, y: 2 },
    { x: 1, y: 2, alive: true }
  ), true)
  assert.equal(hitsBrick(
    { x: 1, y: 2 },
    { x: 1, y: 2, alive: false }
  ), false)
  assert.equal(hitsBrick(
    { x: 3, y: 2 },
    { x: 1, y: 2, alive: true }
  ), false)
})

// ---------------------------------------------------------------- snake timing
test('the snake step accumulator keeps the remainder and caps catch-up', () => {
  // 140ms cadence: a 200ms frame is one step with 60ms carried over.
  const first = snakeStepsDue(0, 200, 140)
  assert.equal(first.steps, 1)
  assert.equal(first.remainder, 60)

  // The remainder accumulates instead of being discarded (the old loop reset
  // its timestamp to `now`, which made the snake drift off its cadence).
  const second = snakeStepsDue(first.remainder, 100, 140)
  assert.equal(second.steps, 1)
  assert.equal(second.remainder, 20)

  // A long stall must not replay hundreds of steps at once.
  assert.equal(snakeStepsDue(0, 5000, 140).steps, SNAKE_MAX_CATCHUP)
})

test('snake input buffers a quick double turn without allowing a reversal', () => {
  const right = { x: 1, y: 0 }
  // Moving right: up then left. Left alone would be a reversal, but queued
  // after up it is legal — this is the input the old code dropped.
  let queue = queueSnakeDirection([], right, 'ArrowUp')
  queue = queueSnakeDirection(queue, right, 'ArrowLeft')
  assert.deepEqual(queue, [{ x: 0, y: -1 }, { x: -1, y: 0 }])

  // A reversal of the direction actually being travelled is still refused.
  assert.deepEqual(queueSnakeDirection([], right, 'ArrowLeft'), [])
  assert.deepEqual(queueSnakeDirection([], right, 'a'), [])
  // The buffer is bounded so mashing keys can't queue a whole path.
  let full = queueSnakeDirection([], right, 'ArrowUp')
  full = queueSnakeDirection(full, right, 'ArrowLeft')
  full = queueSnakeDirection(full, right, 'ArrowDown')
  assert.equal(full.length, SNAKE_INPUT_BUFFER)
})

// ---------------------------------------------------------------- breakout
test('the breakout field contains every brick row (the game must be winnable)', () => {
  // Bricks sit at y = 3 - row * 0.5 for five rows; the ceiling must clear the
  // top row's upper edge or those bricks can never be struck.
  const topBrickY = 3
  const brickHalfHeight = 0.2
  const ballReach = BREAKOUT_BOUNDS.top - BREAKOUT_BALL_RADIUS
  assert.ok(ballReach > topBrickY + brickHalfHeight - 0.02,
    `ball reaches ${ballReach}, top brick spans to ${topBrickY + brickHalfHeight}`)
})

test('held paddle input is time-based, not key-repeat based', () => {
  const slow = movePaddleAxis(0, 1, 1 / 30)
  const fast = movePaddleAxis(0, 1, 1 / 120)
  assert.ok(Math.abs(slow - fast * 4) < 1e-9, 'movement scales with elapsed time')
  assert.equal(movePaddleAxis(0, 0, 1), 0)
  assert.equal(movePaddleAxis(BREAKOUT_BOUNDS.right, 1, 1), BREAKOUT_BOUNDS.right - 0.95)
})

test('a brick hit reflects the axis the ball actually hit', () => {
  const brick = { x: 0, y: 0, alive: true }
  // Just inside the brick's right edge, vertically centred -> entered sideways.
  assert.equal(brickBounceAxis({ x: 0.58, y: 0 }, brick, { x: 5, y: 0.4 }), 'x')
  // Just inside its top edge, horizontally centred -> entered from above.
  assert.equal(brickBounceAxis({ x: 0, y: 0.2 }, brick, { x: 0.2, y: 5 }), 'y')
  // Dead-centre corner falls back to the dominant travel axis.
  assert.equal(brickBounceAxis({ x: 0.6, y: 0.22 }, brick, { x: 6, y: 1 }), 'x')
  assert.equal(brickBounceAxis({ x: 0.6, y: 0.22 }, brick, { x: 1, y: 6 }), 'y')
  assert.deepEqual(resolveBrickBounce({ x: 3, y: 4 }, 'x'), { x: -3, y: 4 })
  assert.deepEqual(resolveBrickBounce({ x: 3, y: 4 }, 'y'), { x: 3, y: -4 })
})

test('the ball is kept from stalling in a flat horizontal path', () => {
  const flat = ensureBallDescent({ x: 6, y: 0.2 })
  assert.ok(Math.abs(flat.y) >= 1.6, 'vertical speed is restored')
  assert.equal(flat.x, 6, 'horizontal speed is untouched')
  assert.deepEqual(ensureBallDescent({ x: 1, y: 5 }), { x: 1, y: 5 })
})

test('breakout ball physics: walls, paddle, bricks, lives, and the win', () => {
  const bricks = [
    { x: 0, y: 3, alive: true },
    { x: 0, y: 2, alive: true },
  ]
  const bounds = BREAKOUT_BOUNDS

  // A fast ball aimed at the top brick must register the hit (sub-stepping is
  // what stops it tunnelling through a 0.4-tall target at speed).
  const hit = stepBreakout({
    ...createBreakoutState(() => 0.5),
    ball: { x: 0, y: 2.6 },
    ballVelocity: { x: 0, y: 9, z: 0 },
  }, 1 / 30, { paddleX: 0, bricks })
  assert.equal(bricks[0].alive, false, 'the top brick was destroyed')
  assert.ok(hit.score >= BREAKOUT_BRICK_POINTS)
  assert.equal(hit.destroyed.length, 1)

  // Clearing the last brick wins the game.
  const won = stepBreakout({
    ...createBreakoutState(() => 0.5),
    ball: { x: 0, y: 2.6 },
    ballVelocity: { x: 0, y: 9, z: 0 },
  }, 1 / 30, { paddleX: 0, bricks: [{ x: 0, y: 3, alive: true }] })
  assert.equal(won.won, true)
  assert.equal(won.alive, false)

  // Missing the paddle costs a life and re-serves instead of ending the run.
  const missed = stepBreakout({
    ...createBreakoutState(() => 0.5),
    ball: { x: 5, y: -4.3 },
    ballVelocity: { x: 0, y: -6, z: 0 },
  }, 1 / 60, { paddleX: 0, bricks })
  assert.equal(missed.lives, 2)
  assert.equal(missed.alive, true, 'still playing with lives left')
  assert.equal(missed.ball.y, -3, 'ball is re-served')
  assert.ok(missed.events.includes('serve'))

  // The last life ends the run.
  const over = stepBreakout({
    ...createBreakoutState(() => 0.5),
    lives: 1,
    ball: { x: 5, y: -4.3 },
    ballVelocity: { x: 0, y: -6, z: 0 },
  }, 1 / 60, { paddleX: 0, bricks })
  assert.equal(over.alive, false)
  assert.ok(over.events.includes('gameover'))

  // The paddle returns the ball upward.
  const bounced = stepBreakout({
    ...createBreakoutState(() => 0.5),
    ball: { x: 0, y: BREAKOUT_PADDLE_Y + 0.25 },
    ballVelocity: { x: 0, y: -4, z: 0 },
  }, 1 / 60, { paddleX: 0, bricks: [] })
  assert.ok(bounced.ballVelocity.y > 0, 'the ball is sent back up')
})

// ---------------------------------------------------------------- racer
test('racer laps count on crossing the start line, not on distance moved', () => {
  // A single huge frame must not fabricate laps (the old check was
  // `distanceTo(prev) > 3`), and a full lap must count exactly once.
  let state = createRacerState()
  state = advanceRacer(state, { accelerate: true }, 1 / 60)
  state = { ...state, speed: RACER_MAX_SPEED, t: 0.998 }
  state = advanceRacer(state, { accelerate: true }, 1 / 60)
  assert.equal(state.lap, 1, 'crossing the line counts one lap')

  const fast = advanceRacer({ ...createRacerState(), t: 0.5, speed: RACER_MAX_SPEED }, { accelerate: true }, 0.5)
  assert.equal(fast.lap, 0, 'a long frame does not invent laps')
})

test('racer records a best lap and finishes after the lap count', () => {
  let state = { ...createRacerState(), speed: RACER_MAX_SPEED }
  for (let i = 0; i < 3; i++) {
    state = { ...state, t: 0.999 }
    state = advanceRacer(state, { accelerate: true }, 1 / 60)
  }
  assert.equal(state.lap, RACER_LAPS)
  assert.equal(state.finished, true)
  assert.ok(state.bestLap > 0, 'a best lap is recorded')
  assert.equal(state.running, false)

  // Finished races stop integrating.
  const after = advanceRacer(state, { accelerate: true }, 1)
  assert.equal(after.t, state.t)
})

test('reversing back over the start line un-counts the lap', () => {
  let state = { ...createRacerState(), lap: 1, t: 0.001, speed: -RACER_REVERSE_SPEED }
  state = advanceRacer(state, { reverse: true }, 1 / 60)
  assert.equal(state.lap, 0)
  assert.ok(state.events.includes('lap-lost'))
})

test('racer lap time formatting is stable', () => {
  assert.equal(formatLapTime(null), '--:--')
  assert.equal(formatLapTime(0), '00:00.00')
  assert.equal(formatLapTime(12.345), '00:12.35')
  assert.equal(formatLapTime(75.5), '01:15.50')
})

// ---------------------------------------------------------------- match three
test('cascade scoring rewards chains', () => {
  assert.equal(scoreMatch3Cascades([3]), 30)
  // 3 cleared, then 4 cleared in the second cascade: 30 + 4*10*2
  assert.equal(scoreMatch3Cascades([3, 4]), 110)
  assert.equal(scoreMatch3Cascades([]), 0)
})

test('a board with no legal swap is detected and can be reshuffled', () => {
  // Verified deadlocked by brute force over every adjacent swap (independent of
  // hasMatch3Move): no line of three exists and no swap can create one.
  const dead = [
    [2, 2, 1, 1],
    [2, 0, 0, 1],
    [1, 1, 0, 2],
    [1, 1, 2, 2],
  ]
  assert.equal(hasMatch3Move(dead), false)
  // Exactly one legal swap, confirmed by the same brute-force checker:
  // (0,2)<->(1,2) drops a third 0 into row 0.
  assert.equal(hasMatch3Move([
    [0, 0, 1, 2],
    [3, 4, 0, 5],
    [1, 2, 3, 4],
    [5, 0, 1, 2],
  ]), true, 'a swap that lines up three is found')

  const shuffled = shuffleMatch3Board(() => 0.42, 8)
  assert.equal(findMatch3Cells(shuffled.board).length, 0, 'no pre-made matches')
  assert.equal(hasMatch3Move(shuffled.board), true, 'always offers a move')
})

test('an invalid swap is reported explicitly instead of by score comparison', () => {
  const state = {
    board: [[0, 1], [2, 3]],
    score: 0,
    moves: 30,
    selected: null,
    alive: true,
    won: false,
  }
  const turn = playMatch3Turn(state, { row: 0, col: 0 }, { row: 0, col: 1 }, () => 0.5)
  assert.equal(turn.lastTurnValid, false)
  assert.equal(turn.moves, 30, 'an invalid swap does not cost a move')
  assert.equal(turn.score, 0)
})

// ---------------------------------------------------------------- launch
test('launch limits shots and pays a bonus for the ones you save', () => {
  let state = createLaunchState()
  for (let i = 0; i < LAUNCH_MAX_SHOTS; i++) {
    state = launchProjectile({ ...state, projectile: null })
  }
  assert.equal(state.shots, LAUNCH_MAX_SHOTS)
  assert.equal(shotsLeft(state), 0)
  // Out of shots: the launcher refuses.
  assert.equal(launchProjectile({ ...state, projectile: null }).shots, LAUNCH_MAX_SHOTS)

  assert.equal(launchAccuracyBonus({ ...createLaunchState(), shots: 3 }), (LAUNCH_MAX_SHOTS - 3) * LAUNCH_SHOT_BONUS)
  assert.equal(launchAccuracyBonus({ ...createLaunchState(), shots: LAUNCH_MAX_SHOTS }), 0)
})

// ---------------------------------------------------------------- full games
// End-to-end simulations. These are the checks that prove each game can actually
// be finished — Breakout shipped unwinnable because its top two brick rows sat
// above the ceiling bounce, which no unit test of a single function would catch.
test('breakout can be won by a competent player (full simulated game)', () => {
  const bricks = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      bricks.push({ x: -6 + 0.7 + col * 1.15, y: 4 - 1 - row * 0.5, alive: true })
    }
  }
  let state = createBreakoutState(() => 0.5)
  const dt = 1 / 60
  let frames = 0
  while (state.alive && frames < 60 * 60 * 5) {
    // A paddle that tracks the ball — the minimum a player can do.
    const paddleX = Math.max(
      BREAKOUT_BOUNDS.left + 0.95,
      Math.min(BREAKOUT_BOUNDS.right - 0.95, state.ball.x)
    )
    state = stepBreakout(state, dt, { paddleX, bricks })
    frames++
  }
  assert.equal(state.won, true, `expected a win, got ${state.won ? 'win' : 'stall/loss'} with ${bricks.filter(b => b.alive).length} bricks left`)
  assert.equal(bricks.filter((brick) => brick.alive).length, 0, 'every brick is clearable')
  assert.equal(state.score, 50 * BREAKOUT_BRICK_POINTS)
})

test('breakout still ends when the player keeps missing (lives matter)', () => {
  const bricks = [{ x: 0, y: 3, alive: true }, { x: 1.15, y: 3, alive: true }]
  let state = createBreakoutState(() => 0.5)
  const dt = 1 / 60
  let frames = 0
  while (state.alive && frames < 60 * 60) {
    // Paddle lags well behind the ball, so it keeps missing.
    state = stepBreakout(state, dt, { paddleX: state.ball.x - 2.4, bricks })
    frames++
  }
  assert.equal(state.alive, false)
  assert.equal(state.lives, 0)
})

test('launch can be completed inside the shot budget', () => {
  let state = createLaunchState()
  const dt = 1 / 240
  let shots = 0
  while (!state.won && shots < LAUNCH_MAX_SHOTS) {
    // Scan the aim space for a shot that hits something (a competent player).
    let best = null
    for (let angle = 0.25; angle <= 1.25; angle += 0.02) {
      for (let power = 0.35; power <= 1.0; power += 0.02) {
        let trial = launchProjectile({ ...state, projectile: null, angle, power })
        const before = trial.targets.filter((target) => target.alive).length
        for (let i = 0; i < 2000 && trial.projectile; i++) trial = stepLaunch(trial, dt)
        const hit = before - trial.targets.filter((target) => target.alive).length
        if (hit > 0 && (!best || hit > best.hit)) best = { angle, power, hit }
      }
    }
    if (!best) break
    state = launchProjectile({ ...state, projectile: null, angle: best.angle, power: best.power })
    shots++
    for (let i = 0; i < 2000 && state.projectile; i++) state = stepLaunch(state, dt)
  }
  assert.equal(state.won, true, `expected the targets to be clearable in ${LAUNCH_MAX_SHOTS} shots`)
  assert.ok(shots <= LAUNCH_MAX_SHOTS)
  assert.ok(shotsLeft(state) >= 0)
})
