// Shared game infrastructure. Every game in this folder uses these so the six
// engines behave identically: real elapsed-time integration, a consistent score
// line, best scores that persist, the same pause/restart keys, and a small state
// mirror so tests can prove a game is actually running.
//
// Nothing here touches the DOM at import time — the Node test suite imports it.

// ---------------------------------------------------------------- timing
// A clock that reports real elapsed seconds, clamped so a background tab or a
// long frame can't teleport the simulation. The old engines hard-coded 1/60 per
// frame, which made ball/car speed depend on the display refresh rate.
export function createClock({ maxStep = 0.05 } = {}) {
  let last = 0
  return {
    // Returns seconds since the previous tick (1/60 on the first call).
    tick(now) {
      if (!last) {
        last = now
        return 1 / 60
      }
      const dt = Math.min((now - last) / 1000, maxStep)
      last = now
      return dt < 0 ? 0 : dt
    },
    reset() {
      last = 0
    }
  }
}

// Split a frame into fixed sub-steps small enough that a fast object can't pass
// through a thin collider. Returns an array of dt values summing to dt.
export function substeps(dt, maxStep = 1 / 240) {
  if (dt <= maxStep) return [dt]
  const count = Math.min(16, Math.ceil(dt / maxStep))
  return Array.from({ length: count }, () => dt / count)
}

// ---------------------------------------------------------------- scoring
const pad = (value) => String(Math.max(0, Math.round(value))).padStart(6, '0')

// One score-line format for every game: `SCORE 000120 · BEST 000450`.
export function formatScore(score, best = 0) {
  return `SCORE ${pad(score)} · BEST ${pad(Math.max(best, score))}`
}

// A labelled readout in the same voice, e.g. formatStat('LAP', 2, 3) -> 'LAP 2/3'.
export function formatStat(label, value, total) {
  return total === undefined ? `${label} ${value}` : `${label} ${value}/${total}`
}

export function bestKey(name) {
  return `game-best-${name}`
}

// Best scores are a nicety, never a failure mode: storage can be disabled.
export function readBest(name) {
  try {
    return Number(localStorage.getItem(bestKey(name))) || 0
  } catch {
    return 0
  }
}

export function writeBest(name, value) {
  try {
    const current = readBest(name)
    if (value > current) {
      localStorage.setItem(bestKey(name), String(Math.round(value)))
      return Math.round(value)
    }
    return current
  } catch {
    return value
  }
}

// ---------------------------------------------------------------- input
// Keys that mean the same thing in every game.
export const isRestartKey = (key) => key === 'r' || key === 'R'
export const isPauseKey = (key) => key === 'p' || key === 'P'
export const isConfirmKey = (key) => key === ' ' || key === 'Enter'

// Held-key tracking, so movement is integrated over time instead of firing once
// per OS key-repeat (which made the Breakout paddle faster on some machines).
export function createKeyState(map) {
  const held = Object.create(null)
  for (const key of Object.keys(map)) held[key] = false
  return {
    held,
    // Returns true when the key belongs to this game (caller preventDefaults).
    down(key) {
      if (!(key in map)) return false
      held[key] = true
      return true
    },
    up(key) {
      if (!(key in map)) return false
      held[key] = false
      return true
    },
    clear() {
      for (const key of Object.keys(held)) held[key] = false
    },
    // Signed axis for the mapped keys, e.g. {left:'ArrowLeft', right:'ArrowRight'}.
    axis(positive, negative) {
      const up = positive.reduce((sum, key) => sum + (held[key] ? 1 : 0), 0)
      const down = negative.reduce((sum, key) => sum + (held[key] ? 1 : 0), 0)
      return Math.max(-1, Math.min(1, up - down))
    }
  }
}

// ---------------------------------------------------------------- test surface
// A compact, machine-readable mirror of the game state. The smoke check reads
// this to prove the engine is running and responding to input; canvas pixels
// change for unrelated reasons (resize, CSS animation) so they can't be trusted.
export function mirrorState(canvas, values) {
  if (!canvas || !canvas.dataset) return
  canvas.dataset.gameState = values.map((value) =>
    typeof value === 'number' ? value.toFixed(2) : String(value)
  ).join('|')
}

// ---------------------------------------------------------------- status text
export const HINTS = {
  restart: 'R restart',
  pause: 'P pause',
  space: 'Space',
}

// Appends the standard key hints so every game advertises the same controls.
export function withHints(message, { restart = true, pause = true, extra } = {}) {
  const hints = []
  if (extra) hints.push(extra)
  if (restart) hints.push(HINTS.restart)
  if (pause) hints.push(HINTS.pause)
  return hints.length ? `${message} · ${hints.join(' · ')}` : message
}

// ---------------------------------------------------------------- pause
// A shared pause flag with the same key everywhere, plus an explicit pause so a
// hidden tab or an open cabinet doesn't advance the simulation.
export function createPauseState() {
  let paused = false
  return {
    get paused() {
      return paused
    },
    toggle() {
      paused = !paused
      return paused
    },
    set(value) {
      paused = Boolean(value)
    }
  }
}
