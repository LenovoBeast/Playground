import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const projects = JSON.parse(readFileSync(path.join(root, 'projects.json'), 'utf8'))

// projects.json is the single source of truth for the portfolio's project data.
// It must be a non-empty array of well-formed entries so the site never ships
// an empty or broken project grid.

test('projects.json is a non-empty array', () => {
  assert.ok(Array.isArray(projects), 'projects.json must parse to an array')
  assert.ok(projects.length > 0, 'projects.json must not be empty')
})

test('every project has a title, description, url, and language', () => {
  for (const project of projects) {
    assert.ok(typeof project.title === 'string' && project.title.length > 0,
      `project is missing a title: ${JSON.stringify(project)}`)
    assert.ok(typeof project.description === 'string' && project.description.length > 0,
      `project "${project.title}" is missing a description`)
    assert.ok(typeof project.url === 'string' && project.url.startsWith('https://'),
      `project "${project.title}" has an invalid url: ${project.url}`)
    assert.ok(typeof project.language === 'string' && project.language.length > 0,
      `project "${project.title}" is missing a language`)
  }
})

test('project urls are unique (no duplicate entries)', () => {
  const urls = projects.map(p => p.url)
  const unique = new Set(urls)
  assert.equal(unique.size, urls.length, 'project urls must be unique')
})

test('project titles are unique', () => {
  const titles = projects.map(p => p.title)
  const unique = new Set(titles)
  assert.equal(unique.size, titles.length, 'project titles must be unique')
})

// The rendered ProjectGrid must derive its data from the same source of truth
// as projects.json, so the UI can never drift from the canonical list.
test('ProjectGrid imports projects from the shared data module', async () => {
  const data = await import('../src/data/projects.js')
  assert.ok(Array.isArray(data.projects), 'src/data/projects.js must export an array `projects` binding')
  assert.deepEqual(data.projects, projects, 'data module must re-export projects.json verbatim')
})