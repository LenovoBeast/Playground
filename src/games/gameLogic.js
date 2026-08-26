export const SNAKE_GRID = 16
export const BREAKOUT_BOUNDS = Object.freeze({ left: -6, right: 6, top: 2, bottom: -3 })

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

export function advanceSnake({ snake, direction, food, grid = SNAKE_GRID }) {
  const head = snake[0]
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y }
  const ateFood = nextHead.x === food.x && nextHead.y === food.y
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
