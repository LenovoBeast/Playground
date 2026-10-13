import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const content = readFileSync(path.join(root, 'src/components/Contact.jsx'), 'utf8')

// Contact.jsx contract tests. Same seam as the Hero/Games contracts: we cannot
// import JSX under node, so we assert on the observable structure of the
// source. These guard the mailto handoff — the form has no backend, so the
// composition of the mailto URL and the ordering of state vs. navigation ARE
// the product.

test('the form submits via mailto, with no backend dependency', () => {
  assert.equal((content.match(/fetch\(/g) || []).length, 0,
    'Contact.jsx must not fetch — the form is a mailto handoff')
  assert.equal((content.match(/netlify/gi) || []).length, 0,
    'Contact.jsx must not reference Netlify Forms')
  assert.equal((content.match(/bot-field/g) || []).length, 0,
    'a honeypot is pointless without a server to POST to')
  // The address itself lives in src/data/contact.js; the component only
  // consumes the constant.
  assert.ok(content.includes("data/contact.js"),
    'Contact.jsx must import the shared contact constants')
  assert.ok(content.includes('CONTACT_MAILTO'),
    'Contact.jsx must use CONTACT_MAILTO for the handoff')
})

test('subject and body are URL-encoded in the mailto URL', () => {
  assert.match(content, /encodeURIComponent\(formData\.subject\.trim\(\)\)/)
  assert.match(content, /encodeURIComponent\(body\)/)
})

test('state updates land before the handoff navigation', () => {
  // Handing off to an external protocol can unload the document; anything
  // queued after `window.location.href = ...` may never run.
  const successIdx = content.indexOf("setStatusMessage(\"Your mail app is open")
  const navIdx = content.indexOf('window.location.href = mailto')
  assert.ok(successIdx !== -1, 'success status must be set in the handler')
  assert.ok(navIdx !== -1, 'the handler must navigate to the mailto URL')
  assert.ok(successIdx < navIdx,
    'state updates must be queued BEFORE window.location.href — the handoff can unload the page')
})

test('the message lives region announces both outcomes', () => {
  assert.ok(content.includes('id="form-status"'), 'form-status live region must exist')
  assert.ok(content.includes('aria-describedby="form-status"'),
    'the form must reference the live region')
  assert.match(content, /role="status"/)
  assert.match(content, /aria-live="polite"/)
})

test('inputs are length-capped and labelled', () => {
  for (const [field, cap] of [['name', 100], ['email', 254], ['subject', 150]]) {
    assert.ok(content.includes(`maxLength={${cap}}`), `${field} must be capped at ${cap}`)
  }
  assert.ok(content.includes('maxLength={2000}'), 'message must be capped at 2000')
  assert.match(content, /<label htmlFor="message" className="sr-only">/,
    'the textarea needs a real label, not a decorative span')
  assert.match(content, /autoComplete="name"/)
  assert.match(content, /autoComplete="email"/)
})
