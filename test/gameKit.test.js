import assert from 'node:assert/strict'
import test from 'node:test'

import {
  bestKey,
  createClock,
  createKeyState,
  createPauseState,
  formatScore,
  formatStat,
  isConfirmKey,
  isPauseKey,
  isRestartKey,
  readBest,
  substeps,
  withHints,
  writeBest,
} from '../src/games/gameKit.js'
import { CANDY_SHAPES } from '../src/games/gameArt.js'
import { MATCH3_COLORS } from '../src/games/gameLogic.js'

// The kit is shared by all six engines, so its behaviour is a contract. These
// tests are the reason a game can't quietly diverge again.

test('the clock reports real elapsed time and clamps long frames', () => {
  const clock = createClock({ maxStep: 0.05 })
  assert.equal(clock.tick(1000), 1 / 60, 'the first frame has no previous timestamp')
  assert.equal(clock.tick(1016), 0.016, 'a normal frame is reported as elapsed seconds')
  assert.equal(clock.tick(5016), 0.05, 'a stalled frame is clamped, not replayed')
  clock.reset()
  assert.equal(clock.tick(9000), 1 / 60, 'reset restarts the first-frame behaviour')
  // A clock that goes backwards must not produce a negative step.
  const back = createClock()
  back.tick(1000)
  assert.equal(back.tick(900), 0)
})

test('substeps split a frame without losing or duplicating time', () => {
  assert.deepEqual(substeps(1 / 240), [1 / 240], 'a small frame is left alone')
  const parts = substeps(1 / 30, 1 / 240)
  assert.equal(parts.length, 8)
  assert.ok(Math.abs(parts.reduce((sum, dt) => sum + dt, 0) - 1 / 30) < 1e-12, 'sub-steps sum to the frame')
  // A pathological frame must not explode into hundreds of steps.
  assert.ok(substeps(5, 1 / 240).length <= 16)
})

test('score and stat formatting is stable and padded', () => {
  assert.equal(formatScore(0, 0), 'SCORE 000000 · BEST 000000')
  assert.equal(formatScore(1234, 99), 'SCORE 001234 · BEST 001234', 'the best never reads below the score')
  assert.equal(formatScore(1234, 5000), 'SCORE 001234 · BEST 005000')
  assert.equal(formatScore(12.6, 0), 'SCORE 000013 · BEST 000013', 'values are rounded')
  assert.equal(formatStat('LAP', 2, 3), 'LAP 2/3')
  assert.equal(formatStat('TIME', '01:20'), 'TIME 01:20')
})

test('best scores persist and degrade gracefully without storage', () => {
  assert.equal(bestKey('snake'), 'game-best-snake')
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  }
  try {
    assert.equal(readBest('snake'), 0, 'no stored value reads as zero')
    assert.equal(writeBest('snake', 120), 120)
    assert.equal(readBest('snake'), 120)
    assert.equal(writeBest('snake', 40), 120, 'a worse score does not overwrite the best')
    assert.equal(writeBest('snake', 300), 300)
    assert.equal(readBest('snake'), 300)
  } finally {
    delete globalThis.localStorage
  }
  // Storage disabled (private mode, SSR): still functional, just not persisted.
  assert.equal(readBest('snake'), 0)
  assert.equal(writeBest('snake', 55), 55)
})

test('the shared key predicates are case-insensitive where they should be', () => {
  for (const key of ['r', 'R']) assert.equal(isRestartKey(key), true, key)
  for (const key of ['p', 'P']) assert.equal(isPauseKey(key), true, key)
  assert.equal(isConfirmKey(' '), true)
  assert.equal(isConfirmKey('Enter'), true)
  assert.equal(isRestartKey('x'), false)
  assert.equal(isPauseKey('Escape'), false)
})

test('held-key tracking reports a signed axis and clears', () => {
  const keys = createKeyState({ ArrowLeft: true, ArrowRight: true, a: true, d: true })
  const axis = () => keys.axis(['ArrowRight', 'd'], ['ArrowLeft', 'a'])
  assert.equal(axis(), 0)
  keys.down('ArrowRight')
  assert.equal(axis(), 1)
  keys.down('ArrowLeft')
  assert.equal(axis(), 0, 'opposite keys cancel')
  keys.up('ArrowRight')
  assert.equal(axis(), -1)
  keys.clear()
  assert.equal(axis(), 0)
  assert.equal(keys.down('Escape'), false, 'keys outside the map are ignored')
})

test('pause toggles and reports its state', () => {
  const pause = createPauseState()
  assert.equal(pause.paused, false)
  assert.equal(pause.toggle(), true)
  assert.equal(pause.paused, true)
  pause.set(false)
  assert.equal(pause.paused, false)
})

test('status hints are appended in one consistent voice', () => {
  assert.equal(withHints('Ready'), 'Ready · R restart · P pause')
  assert.equal(withHints('Game over', { pause: false }), 'Game over · R restart')
  assert.equal(withHints('Racing', { restart: false, pause: false }), 'Racing')
  assert.equal(withHints('Shot away', { extra: '4 left' }), 'Shot away · 4 left · R restart · P pause')
})

test('every match-three colour has its own shape (colour-blind readable)', () => {
  // The board is played by colour; giving each colour a distinct silhouette is
  // what keeps it playable for colour-blind players.
  assert.ok(CANDY_SHAPES.length >= MATCH3_COLORS,
    `need at least ${MATCH3_COLORS} shapes, have ${CANDY_SHAPES.length}`)
  assert.equal(new Set(CANDY_SHAPES).size, CANDY_SHAPES.length, 'shapes must be unique')
})
