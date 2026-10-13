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
