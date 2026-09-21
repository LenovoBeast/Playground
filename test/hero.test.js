import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const content = readFileSync(path.join(root, 'src/components/Hero.jsx'), 'utf8')

// Hero.jsx contract tests. The seam here is the component source: we cannot
// import JSX under node, so we assert on the observable structure — the values
// it renders and the absence of duplicated/dead component code.
//
// `TerminalWindow` and `TerminalWindow3D` were near-identical copies; only
// `TerminalWindow3D` is actually rendered. The contract is: a single terminal
// component, rendered once, no dead duplicate.

test('Hero.jsx exists and default-exports a component', () => {
  assert.ok(content.includes('export default'), 'Hero.jsx must default-export')
})

test('only one terminal component is defined (no dead duplicate)', () => {
  const tw = content.match(/const TerminalWindow\b/g) || []
  const tw3d = content.match(/const TerminalWindow3D\b/g) || []
  assert.equal(tw.length, 0, 'Hero must not define a duplicate `TerminalWindow` component')
  assert.equal(tw3d.length, 1, 'Hero must define exactly one `TerminalWindow3D` component')
})

test('the terminal component is rendered exactly once', () => {
  const usages = content.match(/<TerminalWindow3D\s*\/>/g) || []
  assert.equal(usages.length, 1, 'TerminalWindow3D must be rendered exactly once')
})

test('Hero renders the expected stat values', () => {
  assert.ok(content.includes('8+'), 'Hero must reference 8+ years experience')
  assert.ok(content.includes('47'), 'Hero must reference 47 projects shipped')
  assert.ok(content.includes('12k+'), 'Hero must reference 12k+ lines of code')
})