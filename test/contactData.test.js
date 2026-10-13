import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// The contact address must live in exactly one place. It previously was
// hardcoded in three components and drifted; the single constant makes the
// contact path a one-line change.
const contact = readFileSync(path.join(root, 'src/data/contact.js'), 'utf8')

test('src/data/contact.js exports the email and mailto helpers', () => {
  assert.match(contact, /export const CONTACT_EMAIL = '/)
  assert.match(contact, /export const CONTACT_MAILTO = `mailto:\$\{CONTACT_EMAIL\}`/)
})

test('no component hardcodes an email address', () => {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return /\.jsx?$/.test(entry.name) ? [full] : []
    })
  const offenders = walk(path.join(root, 'src'))
    .map((file) => ({ file, rel: path.relative(root, file) }))
    .filter(({ rel }) => rel !== path.join('src', 'data', 'contact.js'))
    .filter(({ file }) => {
      // Strip placeholder attributes first: `your@email.com` in an input
      // placeholder is example copy, not an address the site uses.
      const src = readFileSync(file, 'utf8').replace(/placeholder="[^"]*"/g, '')
      return /[\w.+-]+@[\w-]+\.[\w.]+/.test(src)
    })
    .map(({ rel }) => rel)
  assert.deepEqual(offenders, [], 'these files contain a hardcoded email address')
})

test('the contact email is a syntactically valid address', () => {
  const email = /export const CONTACT_EMAIL = '([^']+)'/.exec(contact)?.[1]
  assert.match(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
})
