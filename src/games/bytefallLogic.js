// Bytefall — pure game logic. No DOM, no canvas: plain state + math so the
// engine (bytefall.js) only draws and the test suite can simulate whole
// playthroughs. "Bit" runs a circuit-board landscape, stomps glitch-mites,
// breaks cache blocks for packets, and reaches the terminal flag before the
// timer ends. Original design — no third-party assets or characters.
//
// Coordinate space: tiles, y grows downward. Every level map is exactly
// ROWS x COLS; rows ROWS-3..ROWS-1 are ground, row ROWS-4 is the walk path.

// Tunables (tiles, seconds)
export const GRAVITY = 26
export const JUMP_V = 10.5            // apex ≈ 2.3 tiles — clears two-tile steps
export const JUMP_HOLD_GRAVITY = 12   // low gravity while rising with jump held
export const STOMP_V = 8.5
export const RUN_ACCEL = 42
export const RUN_MAX = 6.4
export const FRICTION = 34
export const AIR_CONTROL = 0.72
export const MITE_SPEED = 1.1
export const PLAYER_W = 0.7
export const PLAYER_H = 0.9
export const LEVEL_TIME = 100
export const MAX_LIVES = 3

export const ROWS = 11
export const COLS = 40
export const VIEW_W = 20

// Tile codes
export const T = { EMPTY: 0, GROUND: 1, BLOCK: 2, POWER: 3, ONEWAY: 4 }
export const TILE_CHARS = { '#': T.GROUND, B: T.BLOCK, '?': T.POWER, '-': T.ONEWAY }

const AIR = ' '.repeat(COLS)

// 11 rows x 40 cols. ' '=air '#'=ground 'B'=breakable cache block '?'=power
// block (grants turbo double-jump) '-'=one-way platform '~'=moving platform
// (a horizontal run is ONE platform) 'm'=mite 'c'=packet 'P'=start 'F'=flag
export const LEVELS = [
  // 1-1: traversal basics — two pits, two mites, blocks with a packet.
  [
    AIR, AIR, AIR,
    '                    BB                  ',
    AIR,
    '             B?B                        ',
    AIR,
    '  P  m           m           c        F ',
    '##########  ##########  ############### ',
    '##########  ##########  ############### ',
    '##########  ##########  ############### ',
  ],
  // 1-2: a ten-tile chasm crossed by the moving platform, one-way ladder.
  [
    AIR, AIR,
    '          c                             ',
    '         ---                            ',
    AIR,
    '        B?B          m           m      ',
    '   ---       ~~~~~                      ',
    '  P     m                         c    F',
    '#####  ######    #######################',
    '#####  ######    #######################',
    '#####  ######    #######################',
  ],
  // 1-3: stair climb — one-ways lead to the power blocks; flag stays on the
  // ground path so the level is always completable without the turbo route.
  [
    AIR, AIR, AIR,
    '                         B?B            ',
    AIR,
    '                    ---                 ',
    '              ---                       ',
    '  P     m        c              m      F',
    '########  #######  #####################',
    '########  #######  #####################',
    '########  #######  #####################',
  ],
]

function parseLevel(map) {
  const tiles = []
  const mites = []
  const packets = []
  const platforms = []
  let start = { x: 1.5, y: ROWS - 3.5 }
  let flag = { x: COLS - 1.5, y: ROWS - 3.5 }

  for (let r = 0; r < ROWS; r++) {
    const row = []
    const line = map[r]
    let c = 0
    while (c < COLS) {
      const ch = line[c] ?? ' '
      if (ch === '~') {
        // A horizontal run of '~' is one moving platform spanning the run.
        let end = c
        while (end + 1 < COLS && line[end + 1] === '~') end += 1
        const w = end - c + 1
        platforms.push({
          x: c + w / 2,
          y: r + 0.9,
          w,
          min: Math.max(0, c - 3),
          max: Math.min(COLS - w, end + 3),
          vx: 1.6,
        })
        for (let i = c; i <= end; i++) row.push(T.EMPTY)
        c = end + 1
        continue
      }
      row.push(TILE_CHARS[ch] ?? T.EMPTY)
      if (ch === 'm') mites.push({ x: c + 0.5, y: r + 0.5, alive: true, dir: -1 })
      if (ch === 'c') packets.push({ x: c + 0.5, y: r + 0.5, taken: false })
      if (ch === 'P') start = { x: c + 0.5, y: r + 0.5 }
      if (ch === 'F') flag = { x: c + 0.5, y: r + 0.5 }
      c += 1
    }
    tiles.push(row)
  }
  // Mites are ground-walkers with no gravity of their own, so settle each one
  // onto the first floor beneath its map position (nudging sideways if that
  // column is a pit). Level maps can then place an 'm' anywhere sensible
  // without producing a floating enemy.
  for (const mite of mites) settleMite(tiles, mite)

  // Start every mite walking AWAY from the spawn point: a first-time player
  // should get a moment to read the controls instead of being walked into.
  for (const mite of mites) {
    mite.dir = mite.x > start.x ? 1 : -1
  }

  return { tiles, mites, packets, platforms, start, flag, rows: ROWS, cols: COLS }
}

function floorCodeAt(tiles, col, row) {
  if (col < 0 || col >= COLS) return T.EMPTY
  if (row < 0 || row >= ROWS) return T.EMPTY
  return tiles[row][col]
}

function settleMite(tiles, mite) {
  const col = Math.floor(mite.x)
  const fromRow = Math.floor(mite.y)
  for (let r = fromRow; r < ROWS; r++) {
    const code = floorCodeAt(tiles, col, r)
    if (isSolid(code) || code === T.ONEWAY) {
      mite.y = r - 0.5
      return
    }
  }
  for (let d = 1; d < COLS; d++) {
    for (const c of [col - d, col + d]) {
      for (let r = fromRow; r < ROWS; r++) {
        const code = floorCodeAt(tiles, c, r)
        if (isSolid(code) || code === T.ONEWAY) {
          mite.x = c + 0.5
          mite.y = r - 0.5
          return
        }
      }
    }
  }
}

function playerAt(start) {
  return {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    lives: MAX_LIVES,
    invuln: 0,
    turbo: false,      // power-up granted: one extra mid-air jump per airtime
    turboUsed: false,
    coyote: 0,
    jumpBuffer: 0,
    walkCycle: 0,      // animation phase, driven by horizontal speed
  }
}

export function createBytefallState(startLevel = 0) {
  const parsed = parseLevel(LEVELS[Math.max(0, Math.min(startLevel, LEVELS.length - 1))])
  return {
    levelIndex: Math.max(0, Math.min(startLevel, LEVELS.length - 1)),
    parsed,
    player: playerAt(parsed.start),
    score: 0,
    packets: 0,
    time: LEVEL_TIME,
    phase: 'playing', // playing | dead | clear | gameover | won
    respawnTimer: 0,
    camera: { x: 0 },
    input: { left: false, right: false, jump: false },
    // One-frame event channel for the engine to turn into sound/HUD pushes:
    // 'jump' | 'stomp' | 'packet' | 'power' | 'death' | 'clear' | 'gameover' | 'won'
    events: [],
  }
}

function tileAt(parsed, col, row) {
  if (col < 0 || col >= parsed.cols) return T.GROUND // walls at the level edges
  if (row < 0 || row >= parsed.rows) return T.EMPTY   // open sky / open pit
  return parsed.tiles[row][col]
}

const isSolid = (code) => code === T.GROUND || code === T.BLOCK || code === T.POWER

// Advance the world by dt seconds. Mutates and returns state (cheaper than
// immutable copies at 60fps, and the engine re-reads it every frame anyway).
export function stepBytefall(state, dt) {
  if (state.phase === 'gameover' || state.phase === 'won') return state

  if (state.phase === 'clear' || state.phase === 'dead') {
    state.respawnTimer -= dt
    if (state.respawnTimer > 0) return state
    if (state.phase === 'clear') {
      const next = state.levelIndex + 1
      if (next >= LEVELS.length) {
        state.phase = 'won'
        state.events.push('won')
        return state
      }
      state.levelIndex = next
      state.parsed = parseLevel(LEVELS[next])
      respawnPlayer(state)
      state.time = LEVEL_TIME
      state.phase = 'playing'
      state.camera.x = 0
      return state
    }
    if (state.player.lives <= 0) {
      state.phase = 'gameover'
      return state
    }
    respawnPlayer(state)
    state.time = LEVEL_TIME
    state.phase = 'playing'
    state.camera.x = 0
    return state
  }

  const p = state.player
  const parsed = state.parsed
  const input = state.input

  // ---- horizontal: momentum run with friction
  const control = p.onGround ? 1 : AIR_CONTROL
  if (input.left && !input.right) {
    p.vx -= RUN_ACCEL * control * dt
    p.facing = -1
  } else if (input.right && !input.left) {
    p.vx += RUN_ACCEL * control * dt
    p.facing = 1
  } else {
    const drop = FRICTION * dt * (p.onGround ? 1 : 0.25)
    if (p.vx > 0) p.vx = Math.max(0, p.vx - drop)
    else if (p.vx < 0) p.vx = Math.min(0, p.vx + drop)
  }
  p.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, p.vx))

  // ---- jump: buffered press + coyote time, variable height by hold
  p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt)
  p.jumpBuffer = input.jump ? 0.12 : Math.max(0, p.jumpBuffer - dt)
  if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
    p.vy = -JUMP_V
    p.onGround = false
    p.coyote = 0
    p.jumpBuffer = 0
    state.events.push('jump')
  } else if (p.jumpBuffer > 0 && p.turbo && !p.turboUsed) {
    p.vy = -JUMP_V * 0.92
    p.turboUsed = true
    p.jumpBuffer = 0
    state.events.push('jump')
  }

  const g = p.vy < 0 && input.jump ? JUMP_HOLD_GRAVITY : GRAVITY
  p.vy = Math.min(14, p.vy + g * dt)

  // ---- horizontal move + tile resolve
  p.x += p.vx * dt
  resolveTiles(state, p, 'x')

  // ---- vertical move + tile resolve (head hits break/power blocks)
  p.y += p.vy * dt
  resolveTiles(state, p, 'y')

  // ---- ground probe: keeps onGround true while resting on solids, one-way
  // platforms (landing only), and moving platforms — and false in the air,
  // so coyote time expires correctly after running off a ledge.
  p.onGround = false
  if (p.vy >= 0) {
    const feet = p.y + PLAYER_H / 2
    const left = Math.floor(p.x - PLAYER_W / 2 + 0.03)
    const right = Math.floor(p.x + PLAYER_W / 2 - 0.03)
    for (let c = left; c <= right; c++) {
      const code = tileAt(parsed, c, Math.floor(feet + 0.02))
      if (isSolid(code) || code === T.ONEWAY) { p.onGround = true; break }
    }
    if (!p.onGround) {
      for (const plat of parsed.platforms) {
        const withinX = p.x > plat.x - plat.w / 2 - PLAYER_W / 2 && p.x < plat.x + plat.w / 2 + PLAYER_W / 2
        if (withinX && feet >= plat.y - 0.05 && feet <= plat.y + 0.3) { p.onGround = true; break }
      }
    }
    if (p.onGround) {
      p.turboUsed = false
      p.walkCycle += Math.abs(p.vx) * dt * 2.2
    }
  }

  // ---- moving platforms move, and carry riders
  for (const plat of parsed.platforms) {
    const prevX = plat.x
    plat.x += plat.vx * dt
    if (plat.x - plat.w / 2 < plat.min) { plat.x = plat.min + plat.w / 2; plat.vx = Math.abs(plat.vx) }
    if (plat.x + plat.w / 2 > plat.max) { plat.x = plat.max - plat.w / 2; plat.vx = -Math.abs(plat.vx) }
    const dx = plat.x - prevX
    if (p.onGround) {
      const withinX = p.x > plat.x - plat.w / 2 - PLAYER_W / 2 && p.x < plat.x + plat.w / 2 + PLAYER_W / 2
      const feet = p.y + PLAYER_H / 2
      if (withinX && Math.abs(feet - plat.y) < 0.25) p.x += dx
    }
  }

  // ---- pit
  if (p.y > parsed.rows + 1) return killPlayer(state)

  // ---- mites: patrol, turn at ledges/walls, stomp or damage
  for (const mite of parsed.mites) {
    if (!mite.alive) continue
    const aheadX = mite.x + mite.dir * 0.55
    const rowBelow = Math.floor(mite.y + 0.75)
    const floorAhead = isSolid(tileAt(parsed, Math.floor(aheadX), rowBelow)) || tileAt(parsed, Math.floor(aheadX), rowBelow) === T.ONEWAY
    const wallAhead = isSolid(tileAt(parsed, Math.floor(mite.x + mite.dir * 0.45), Math.floor(mite.y)))
    if (!floorAhead || wallAhead) mite.dir *= -1
    mite.x += mite.dir * MITE_SPEED * dt

    if (p.invuln > 0) continue
    const overlapX = Math.abs(mite.x - p.x) < (PLAYER_W + 0.7) / 2
    const feet = p.y + PLAYER_H / 2
    const overlapY = Math.abs(mite.y - p.y) < (PLAYER_H + 0.55) / 2
    if (overlapX && overlapY) {
      // Stomp = descending with the feet still at/above the mite's middle.
      // (Comparing centers would let a fast fall skip past the stomp window
      // and take damage instead.)
      if (p.vy > 1.5 && feet < mite.y + 0.25) {
        mite.alive = false
        p.vy = -STOMP_V
        state.score += 150
        state.events.push('stomp')
      } else {
        return killPlayer(state)
      }
    }
  }

  // ---- packets
  for (const packet of parsed.packets) {
    if (packet.taken) continue
    if (Math.abs(packet.x - p.x) < 0.75 && Math.abs(packet.y - p.y) < 0.85) {
      packet.taken = true
      state.packets += 1
      state.score += 50
      state.events.push('packet')
    }
  }

  // ---- terminal flag
  const flag = parsed.flag
  if (Math.abs(flag.x - p.x) < 0.9 && Math.abs(flag.y - p.y) < 1.4) {
    state.score += 500 + Math.round(state.time) * 10
    state.phase = 'clear'
    state.respawnTimer = 1.1
    state.events.push('clear')
  }

  // ---- timer
  state.time -= dt
  if (state.time <= 0) {
    state.time = 0
    return killPlayer(state)
  }

  if (p.invuln > 0) p.invuln -= dt

  // ---- camera follows, clamped to level bounds
  const maxCam = Math.max(0, parsed.cols - VIEW_W)
  const target = Math.max(0, Math.min(maxCam, p.x - VIEW_W * 0.42))
  state.camera.x += (target - state.camera.x) * Math.min(1, dt * 8)

  return state
}

function killPlayer(state) {
  const p = state.player
  p.lives -= 1
  p.invuln = 0
  state.phase = 'dead'
  state.respawnTimer = p.lives <= 0 ? 1.2 : 0.9
  state.events.push(p.lives <= 0 ? 'gameover' : 'death')
  return state
}

// Reset the player to the level start WITHOUT refilling lives — lives carry
// across deaths and levels (playerAt() starts a fresh run at MAX_LIVES).
function respawnPlayer(state) {
  const { lives } = state.player
  state.player = playerAt(state.parsed.start)
  state.player.lives = lives
}

// Axis-separated AABB against solid tiles. Rising into a cache block breaks it
// (and drops a packet); rising into a power block grants the turbo jump.
function resolveTiles(state, p, axis) {
  const parsed = state.parsed
  const halfW = PLAYER_W / 2
  const halfH = PLAYER_H / 2
  const minX = Math.floor(p.x - halfW)
  const maxX = Math.floor(p.x + halfW)
  const minY = Math.floor(p.y - halfH)
  const maxY = Math.floor(p.y + halfH)
  for (let r = minY; r <= maxY; r++) {
    for (let c = minX; c <= maxX; c++) {
      const code = tileAt(parsed, c, r)
      if (!isSolid(code)) continue
      const overlapX = p.x + halfW > c && p.x - halfW < c + 1
      const overlapY = p.y + halfH > r && p.y - halfH < r + 1
      if (!overlapX || !overlapY) continue
      if (axis === 'x') {
        if (p.vx > 0) p.x = c - halfW - 0.001
        else if (p.vx < 0) p.x = c + 1 + halfW + 0.001
        p.vx = 0
      } else if (p.vy > 0) {
        p.y = r - halfH - 0.001
        p.vy = 0
      } else if (p.vy < 0) {
        p.y = r + 1 + halfH + 0.001
        p.vy = 0
        if (code === T.BLOCK) {
          parsed.tiles[r][c] = T.EMPTY
          parsed.packets.push({ x: c + 0.5, y: r + 0.5, taken: false })
        } else if (code === T.POWER) {
          parsed.tiles[r][c] = T.BLOCK
          p.turbo = true
          p.turboUsed = false
          state.events.push('power')
        }
      }
    }
  }
}

// Scripted autopilot used by the solvability test: run right, jump at gaps,
// mites, and walls. Kept here so tests and the engine share the semantics.
export function autopilotInput(state) {
  const p = state.player
  const parsed = state.parsed
  const input = { left: false, right: true, jump: false }
  const feetRow = Math.floor(p.y + PLAYER_H / 2)
  const aheadCol = Math.floor(p.x + 1.1)

  // wall or step directly ahead
  for (let r = feetRow - 1; r >= feetRow - 2; r--) {
    if (isSolid(tileAt(parsed, aheadCol, r))) input.jump = true
  }
  // gap ahead: no floor within the next 1.6 tiles
  let floorAhead = false
  for (let d = 1; d <= 1.6; d += 0.4) {
    const c = Math.floor(p.x + PLAYER_W / 2 + d)
    if (isSolid(tileAt(parsed, c, feetRow)) || tileAt(parsed, c, feetRow) === T.ONEWAY) floorAhead = true
  }
  if (!floorAhead && p.onGround) input.jump = true
  // mite ahead: hop so the arc lands ON it (too early and it walks into you)
  for (const mite of parsed.mites) {
    if (!mite.alive) continue
    const dx = mite.x - p.x
    if (dx > 0.8 && dx < 1.9 && Math.abs(mite.y - p.y) < 1.2 && p.onGround) input.jump = true
  }
  return input
}
