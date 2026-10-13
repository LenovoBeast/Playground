import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = (p) => readFileSync(path.join(root, 'src', p), 'utf8')

const gamesSrc = src('components/Games.jsx')
const sessionSrc = src('games/gameSession.js')

// The catalogue names are parsed from the source rather than hard-coded, so
// adding a game can't silently drift out of the test's expectations.
const catalogueNames = [...gamesSrc.matchAll(/\{\s*name:\s*'([a-z0-9]+)'/g)].map((m) => m[1])

test('the games catalogue is populated and unique', () => {
  assert.ok(catalogueNames.length >= 6, `expected at least 6 games, found ${catalogueNames.length}`)
  assert.equal(new Set(catalogueNames).size, catalogueNames.length, 'game names must be unique')
  assert.ok(catalogueNames.includes('bytefall'), 'the platformer must be in the catalogue')
})

test('every catalogued game has a loader in gameSession.js', () => {
  for (const name of catalogueNames) {
    assert.ok(
      new RegExp(`\\b${name}:\\s*\\(\\)\\s*=>\\s*import\\('\\./${name}\\.js'\\)`).test(sessionSrc),
      `gameSession.js must lazy-load ./${name}.js for "${name}"`
    )
  }
})

test('every loader points at the element ids the overlay renders', () => {
  for (const name of catalogueNames) {
    for (const suffix of ['Canvas', 'Score', 'Status']) {
      assert.ok(
        sessionSrc.includes(`getElementById('${name}${suffix}')`),
        `gameSession.js must resolve '${name}${suffix}'`
      )
      assert.ok(
        gamesSrc.includes('`${name}' + suffix + '`'),
        `Games.jsx must render an element with template id \`\${name}${suffix}\``
      )
    }
  }
})

test('Games.jsx renders one card per catalogue entry via a single component', () => {
  assert.ok(gamesSrc.includes('data-game={game.name}'), 'cards must expose data-game')
  // One card component, mapped over the catalogue — not duplicated markup.
  assert.equal((gamesSrc.match(/function GameCard\(/g) || []).length, 1, 'one GameCard component')
  assert.match(gamesSrc, /\{GAMES\.map\(\(game, index\) =>/, 'cards are rendered from the catalogue')
  assert.doesNotMatch(gamesSrc, /\bopen\(game\)/, 'cards must call the launcher callback, not window.open')
  assert.match(gamesSrc, /onClick=\{\(\) => onOpen\(game\)\}/, 'cards call onOpen with the game')
})

test('the overlay status is a live region', () => {
  assert.match(gamesSrc, /role="status"/, 'the status line must be announced')
  assert.match(gamesSrc, /aria-live="polite"/, 'the live region must be polite')
})

test('opening a game starts the engine without a second click', () => {
  assert.match(gamesSrc, /session\.current\.play\(openGame\.name\)/, 'opening must start the engine')
  assert.match(gamesSrc, /setStatus\('playing'\)/, 'the overlay must reflect the playing state')
})

test('World.jsx exists and default-exports a component', () => {
  const content = src('components/World.jsx')
  assert.ok(content.includes('export default'), 'World.jsx must default-export')
})

test('World.jsx renders a canvas with id="canvas"', () => {
  const content = src('components/World.jsx')
  assert.ok(/<canvas[^>]*\bid\s*=\s*["']canvas["'][^>]*>/.test(content),
    'World.jsx must render <canvas id="canvas">')
})

test('App.jsx renders World and Games', () => {
  const content = src('App.jsx')
  assert.ok(content.includes('World'), 'App.jsx must render World')
  assert.ok(content.includes('Games'), 'App.jsx must render Games')
})

// ---------------------------------------------------------------- cohesion
// The six engines must behave the same way. These checks encode that contract so
// a future game can't quietly reintroduce frame-rate-dependent timing, a missing
// pause key, or a bespoke state readout.
const ENGINE_FILES = ['bytefall.js', 'snake.js', 'breakout.js', 'racer.js', 'match3.js', 'launch.js']

test('every engine uses the shared game kit', () => {
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    assert.ok(
      /from '\.\/gameKit\.js'/.test(content),
      `${file} must import from gameKit.js`
    )
    for (const helper of ['mirrorState', 'withHints']) {
      assert.ok(content.includes(helper), `${file} must use ${helper}()`)
    }
    assert.ok(
      /isRestartKey|createPauseState/.test(content),
      `${file} must use the shared restart/pause handling`
    )
  }
})

test('no engine hard-codes a frame timestep', () => {
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    // The old engines integrated a fixed 1/60 (or 0.016) per frame, so game
    // speed tracked the display refresh rate instead of real time.
    assert.doesNotMatch(content, /1\s*\/\s*60/, `${file} must use the shared clock, not a fixed 1/60 step`)
    assert.doesNotMatch(content, /update\(0\.016\)/, `${file} must not assume a 60Hz display`)
  }
})

test('every engine exposes the same state mirror shape', () => {
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    const call = content.match(/mirrorState\(canvas,\s*\[([\s\S]*?)\]\)/)
    assert.ok(call, `${file} must publish a state mirror`)
    const fields = call[1]
    // score | progress | phase — three fields, consistently ordered.
    assert.ok((fields.match(/,/g) || []).length >= 2, `${file} mirror must carry score, progress and phase`)
  }
})

test('every engine persists a best score (or best lap) and pauses on the same key', () => {
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    assert.ok(/readBest\(/.test(content), `${file} must read a stored best`)
    assert.ok(/writeBest\(/.test(content), `${file} must write a stored best`)
    assert.ok(/isPauseKey/.test(content), `${file} must use the shared pause key`)
  }
})

test('games that can end show the standard restart hint', () => {
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    assert.ok(
      /withHints\(/.test(content),
      `${file} must build status lines through withHints()`
    )
  }
})

test('every game-kit helper an engine uses is actually imported', () => {
  // A missing import is not a build error (the identifier is simply undefined at
  // runtime), so it has to be checked explicitly — this is how a broken Bytefall
  // build reached the smoke check once.
  const KIT_HELPERS = [
    'createClock', 'substeps', 'formatScore', 'formatStat', 'bestKey', 'readBest',
    'writeBest', 'isRestartKey', 'isPauseKey', 'isConfirmKey', 'createKeyState',
    'mirrorState', 'withHints', 'createPauseState',
  ]
  for (const file of ENGINE_FILES) {
    const content = src(`games/${file}`)
    // `[^{}]*` keeps the match inside one import block — a lazy `[\s\S]*?` spans
    // from the previous import's brace to this one and corrupts the name list.
    const importBlock = content.match(/import\s*\{([^{}]*)\}\s*from\s*'\.\/gameKit\.js'/)
    assert.ok(importBlock, `${file} must import from gameKit.js`)
    const imported = new Set(importBlock[1].split(',').map((name) => name.trim()).filter(Boolean))
    for (const helper of KIT_HELPERS) {
      if (!new RegExp(`\\b${helper}\\s*\\(`).test(content)) continue
      assert.ok(imported.has(helper), `${file} uses ${helper}() but does not import it`)
    }
  }
})
