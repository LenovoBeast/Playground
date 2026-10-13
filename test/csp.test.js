import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const html = readFileSync(path.join(root, 'index.html'), 'utf8')
const netlify = readFileSync(path.join(root, 'netlify.toml'), 'utf8')

// The CSP lives in two copies (netlify.toml header + <meta> mirror) and both
// whitelist the inline JSON-LD blocks by sha256. Editing index.html can change
// the blocks' whitespace — which changes the hashes — without any visible
// diff. These tests make that drift a hard failure instead of a silent
// "structured data blocked by CSP" bug.
const blockRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
const hashes = []
let m
while ((m = blockRe.exec(html)) !== null) {
  hashes.push('sha256-' + createHash('sha256').update(m[1], 'utf8').digest('base64'))
}

test('index.html contains inline JSON-LD blocks', () => {
  assert.ok(hashes.length >= 1, 'expected at least one JSON-LD script block')
})

test('every JSON-LD hash is declared in both CSP copies', () => {
  for (const hash of hashes) {
    assert.ok(html.includes(hash), `index.html meta CSP is missing ${hash}`)
    assert.ok(netlify.includes(hash), `netlify.toml CSP is missing ${hash}`)
  }
})

test('no stale hashes are declared anywhere', () => {
  const declared = [
    ...(html.match(/sha256-[A-Za-z0-9+/=]+/g) || []),
    ...(netlify.match(/sha256-[A-Za-z0-9+/=]+/g) || []),
  ]
  for (const hash of declared) {
    assert.ok(hashes.includes(hash), `stale hash declared (${hash}) — JSON-LD changed; run node scripts/csp-hashes.mjs`)
  }
})
