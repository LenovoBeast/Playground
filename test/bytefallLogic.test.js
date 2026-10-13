import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createBytefallState,
  stepBytefall,
  autopilotInput,
  LEVELS,
  ROWS,
  COLS,
  PLAYER_H,
  JUMP_V,
  GRAVITY,
  JUMP_HOLD_GRAVITY,
} from '../src/games/bytefallLogic.js'

const DT = 1 / 60

function run(state, seconds, driver) {
  const steps = Math.round(seconds / DT)
  for (let i = 0; i < steps; i++) {
    state.input = driver(state)
    stepBytefall(state, DT)
    state.events.length = 0
    if (state.phase === 'gameover' || state.phase === 'won') break
  }
  return state
}

const idle = () => ({ left: false, right: false, jump: false })
const hold = (keys) => () => keys

test('every level map is well formed', () => {
  assert.equal(LEVELS.length, 3)
  for (const [i, map] of LEVELS.entries()) {
    assert.equal(map.length, ROWS, `level ${i + 1} row count`)
    for (const [r, row] of map.entries()) {
      assert.equal(row.length, COLS, `level ${i + 1} row ${r} width`)
    }
    const flat = map.join('')
    assert.match(flat, /P/, `level ${i + 1} needs a player start`)
    assert.match(flat, /F/, `level ${i + 1} needs a terminal flag`)
  }
})

test('the player falls under gravity and lands on the ground', () => {
  const state = createBytefallState()
  state.player.y = 2
  run(state, 1.5, idle)
  assert.ok(state.player.onGround, 'should be standing on the ground')
  assert.ok(state.player.vy === 0, 'vertical velocity settles at zero')
  const feet = state.player.y + PLAYER_H / 2
  assert.ok(Math.abs(feet - (ROWS - 3)) < 0.05, `feet rest on the path row (got ${feet})`)
})

test('a held jump clears two tiles and a tapped jump does not', () => {
  const apex = (holdJump) => {
    const state = createBytefallState()
    run(state, 0.5, idle) // settle onto the ground
    let min = state.player.y
    state.input = { right: false, left: false, jump: true }
    for (let i = 0; i < 90; i++) {
      state.input.jump = holdJump ? true : i < 6
      stepBytefall(state, DT)
      min = Math.min(min, state.player.y)
      state.events.length = 0
    }
    return min
  }
  const held = apex(true)
  const tapped = apex(false)
  const startY = createBytefallState().player.y
  assert.ok(startY - held > 1.9, `held jump should clear ~2 tiles (rose ${startY - held})`)
  assert.ok(startY - tapped < startY - held, 'tapping the jump must cut the arc short')
})

test('coyote time expires: no jumping in mid-air just after a ledge', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  // walk off the right edge of the starting platform
  state.player.x = 9.2
  state.player.y = ROWS - 3.5
  run(state, 0.4, hold({ right: true }))
  assert.ok(!state.player.onGround, 'player has left the ledge')
  const before = state.player.vy
  state.player.jumpBuffer = 0.12
  state.input = { right: true, left: false, jump: true }
  stepBytefall(state, DT)
  assert.ok(state.player.vy > before - 1, 'a late jump press must NOT fire in mid-air')
})

test('stomping a mite kills it, bounces the player, and scores', () => {
  const state = createBytefallState()
  run(state, 0.4, idle) // settle onto the ground
  const mite = state.parsed.mites[0]
  assert.equal(state.phase, 'playing', 'idling at the spawn must not be lethal')
  // drop onto the mite from above
  state.player.x = mite.x
  state.player.y = mite.y - 1.4
  state.player.vy = 3
  state.player.invuln = 0
  const scoreBefore = state.score

  // step frame by frame until the stomp registers so the bounce is observed
  // at the moment it happens, not after the arc has already come back down
  let bounceVy = null
  for (let i = 0; i < 60 && bounceVy === null; i++) {
    state.input = idle()
    stepBytefall(state, DT)
    if (state.events.includes('stomp')) bounceVy = state.player.vy
    state.events.length = 0
  }

  assert.equal(state.phase, 'playing', 'the player survives the stomp')
  assert.equal(mite.alive, false, 'mite is stomped')
  assert.ok(state.score >= scoreBefore + 150, 'stomp awards 150')
  assert.ok(bounceVy !== null && bounceVy < 0, `the player bounces upward (vy=${bounceVy})`)
})

test('walking into a mite costs a life and respawns at the start', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  const mite = state.parsed.mites[0]
  state.player.x = mite.x
  state.player.y = mite.y
  state.player.vy = 0
  state.player.invuln = 0
  stepBytefall(state, DT)
  assert.equal(state.phase, 'dead')
  assert.equal(state.player.lives, 2)
  assert.equal(state.events[0], 'death')
  run(state, 1.2, idle)
  assert.equal(state.phase, 'playing', 'respawns after the pause')
  assert.ok(state.player.x < 3, 'respawn is back at the level start')
})

test('jumping into a cache block breaks it and drops a packet', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  // isolate the block: mites patrol this stretch of ground
  state.parsed.mites = []
  // stand under the B?B trio (row 5, cols 13-15) on solid ground
  state.player.x = 13.5
  state.player.y = ROWS - 3.5
  run(state, 0.2, idle)
  assert.ok(state.player.onGround, 'player is on solid ground under the blocks')
  const packetsBefore = state.parsed.packets.length
  run(state, 0.8, hold({ jump: true }))
  const broke = state.parsed.tiles[5].slice(13, 16).some((code) => code === 0)
  assert.ok(broke, 'at least one block in the row was broken')
  assert.ok(state.parsed.packets.length > packetsBefore, 'a packet dropped from the block')
})

test('a power block grants the turbo double jump', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  state.parsed.mites = []
  // stand under the '?' at row 5, col 14
  state.player.x = 14.5
  state.player.y = ROWS - 3.5
  run(state, 0.1, idle)
  run(state, 0.8, hold({ jump: true }))
  assert.equal(state.player.turbo, true, 'power block grants turbo')
  // in mid-air with turbo, one more jump is available
  state.player.turboUsed = false
  state.player.vy = 2
  state.player.onGround = false
  state.player.jumpBuffer = 0.12
  state.input = { jump: true, left: false, right: false }
  stepBytefall(state, DT)
  assert.ok(state.player.vy < 0, 'the turbo jump fires in mid-air')
})

test('falling into a pit costs a life', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  state.player.y = state.parsed.rows + 2
  stepBytefall(state, DT)
  assert.equal(state.phase, 'dead')
  assert.equal(state.player.lives, 2)
})

test('the terminal flag clears the level with a time bonus, then advances', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  state.score = 100
  state.time = 50
  state.player.x = state.parsed.flag.x
  state.player.y = state.parsed.flag.y
  stepBytefall(state, DT)
  assert.equal(state.phase, 'clear')
  assert.ok(state.score >= 100 + 500 + 500, 'time bonus applied')
  assert.equal(state.events[0], 'clear')
  run(state, 1.4, idle)
  assert.equal(state.levelIndex, 1, 'advances to level 2')
  assert.equal(state.phase, 'playing')
})

test('the timer running out kills the player', () => {
  const state = createBytefallState()
  run(state, 0.5, idle)
  state.time = 0.01
  stepBytefall(state, DT)
  assert.equal(state.phase, 'dead')
})

test('three deaths end the game', () => {
  const state = createBytefallState()
  for (let i = 0; i < 3; i++) {
    run(state, 0.3, idle)
    state.player.y = state.parsed.rows + 2
    stepBytefall(state, DT)
    run(state, 1.3, idle)
  }
  assert.equal(state.phase, 'gameover')
  assert.equal(state.player.lives, 0)
})

test('every mite is settled onto a floor (no floating enemies)', () => {
  for (let level = 0; level < LEVELS.length; level++) {
    const state = createBytefallState(level)
    for (const mite of state.parsed.mites) {
      const col = Math.floor(mite.x)
      const rowBelow = Math.floor(mite.y + 0.5)
      const code = state.parsed.tiles[rowBelow]?.[col]
      assert.ok(
        code === 1 || code === 4,
        `level ${level + 1}: mite at ${mite.x.toFixed(1)},${mite.y.toFixed(1)} must stand on ground (tile=${code})`
      )
    }
  }
})

test('the autopilot can complete every level (solvability)', () => {
  for (let level = 0; level < LEVELS.length; level++) {
    const state = createBytefallState(level)
    // Give the autopilot generous time: it may die and respawn a few times.
    const deadline = 90
    run(state, deadline, autopilotInput)
    assert.notEqual(state.phase, 'gameover', `level ${level + 1} must be completable with 3 lives`)
    assert.ok(
      state.phase === 'won' || state.levelIndex > level,
      `autopilot must reach the flag on level ${level + 1} (phase=${state.phase}, x=${state.player.x.toFixed(1)})`
    )
  }
})
