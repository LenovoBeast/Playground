import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const src = (p) => readFileSync(path.join(root, 'src', p), 'utf8')

// The Three.js world + games live in `src/main.js`, which is currently dead
// code: index.html only loads `main.jsx`. These tests enforce the contract
// that React wrappers expose the DOM hooks main.js needs, so the world can
// finally render inside the app.

test('World.jsx exists and default-exports a component', () => {
  const content = src('components/World.jsx')
  assert.ok(content.includes('export default'), 'World.jsx must default-export')
})

test('World.jsx renders a canvas with id="canvas"', () => {
  const content = src('components/World.jsx')
  assert.ok(/<canvas[^>]*\bid\s*=\s*["']canvas["'][^>]*>/.test(content),
    'World.jsx must render <canvas id="canvas">')
})

test('Games.jsx exists and default-exports a component', () => {
  const content = src('components/Games.jsx')
  assert.ok(content.includes('export default'), 'Games.jsx must default-export')
})

test('Games.jsx renders one game card per game in the catalogue', () => {
  const content = src('components/Games.jsx')
  // The catalogue is the single array of games the launcher knows about.
  const games = ['snake', 'breakout', 'racer', 'match3', 'launch']
  for (const game of games) {
    assert.ok(content.includes(`'${game}'`), `Games.jsx catalogue must include "${game}"`)
    // data-game uses curly brace expression: data-game={game.name}
    assert.ok(content.includes('data-game={game.name}'),
      `Games.jsx must render a card with data-game={game.name}`)
    // ids use template literals: id=\`${name}Overlay\`, etc.
    assert.ok(content.includes('`${name}Overlay`'),
      `Games.jsx must render an overlay with template id`)
    assert.ok(content.includes('`${name}Canvas`'),
      `Games.jsx must render a canvas with template id`)
    assert.ok(content.includes('`${name}Score`'),
      `Games.jsx must render a score element with template id`)
    assert.ok(content.includes('`${name}Status`'),
      `Games.jsx must render a status element with template id`)
  }
})

test('App.jsx renders World and Games', () => {
  const content = src('App.jsx')
  assert.ok(content.includes('World'), 'App.jsx must render World')
  assert.ok(content.includes('Games'), 'App.jsx must render Games')
})