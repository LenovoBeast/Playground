import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BREAKOUT_BOUNDS,
  advanceSnake,
  createBreakoutState,
  createRacerState,
  createSnakeState,
  directionForKey,
  hitsBrick,
  hitsPaddle,
  movePaddle,
  resetRacerState
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
  assert.deepEqual(resetRacerState(), {
    t: 0,
    speed: 0,
    lap: 0,
    prevPos: null,
    running: true
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
