import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { createGameLoaders, createGameSession, wireGames } from '../src/games/wireGames.js'
import { resizeGame, upgradeScene } from '../src/games/graphics.js'

const names = ['snake', 'breakout', 'racer', 'match3', 'launch']

for (const name of names) {
  test(`${name}: shared launcher starts, restarts and closes exactly once`, async () => {
    let starts = 0, stops = 0, loads = 0
    const engine = { start() { starts++ }, stop() { stops++ } }
    const session = createGameSession(createGameLoaders({ [name]: () => { loads++; return engine } }))
    assert.equal(await session.play(name), true)
    assert.equal(await session.play(name), true)
    session.close()
    session.close()
    assert.equal(loads, 1)
    assert.equal(starts, 2)
    assert.equal(stops, 2)
  })
}

test('concurrent loads share an instance and failed downloads can retry', async () => {
  let calls = 0
  const engine = { start() {}, stop() {} }
  const loaders = createGameLoaders({ snake: async () => {
    if (++calls === 1) throw new Error('Network unavailable')
    return engine
  } })
  await assert.rejects(loaders.loadGame('snake'), /Network unavailable/)
  const [first, second] = await Promise.all([loaders.loadGame('snake'), loaders.loadGame('snake')])
  assert.equal(first, engine)
  assert.equal(second, engine)
  assert.equal(calls, 2)
  await assert.rejects(loaders.loadGame('unknown'), /Unknown game/)
})

test('closing during a download prevents a hidden game starting', async () => {
  let resolve, starts = 0
  const session = createGameSession({ loadGame: () => new Promise(done => { resolve = done }) })
  const pending = session.play('snake')
  session.close()
  resolve({ start() { starts++ }, stop() {} })
  assert.equal(await pending, false)
  assert.equal(starts, 0)
})

test('switching games discards an older pending launch', async () => {
  let resolve, oldStarts = 0, newStarts = 0, stops = 0
  const session = createGameSession({ loadGame: name => name === 'snake'
    ? new Promise(done => { resolve = done })
    : Promise.resolve({ start() { newStarts++ }, stop() { stops++ } }) })
  const pending = session.play('snake')
  await session.play('match3')
  resolve({ start() { oldStarts++ }, stop() {} })
  assert.equal(await pending, false)
  session.close()
  assert.deepEqual([oldStarts, newStarts, stops], [0, 1, 1])
})

test('failed engine startup stops partially started work and permits retry', async () => {
  let stops = 0
  const engine = { start() { throw new Error('WebGL unavailable') }, stop() { stops++ } }
  const session = createGameSession({ loadGame: async () => engine })
  await assert.rejects(session.play('snake'), /WebGL unavailable/)
  assert.equal(stops, 1)
  engine.start = () => {}
  assert.equal(await session.play('snake'), true)
  session.close()
  assert.equal(stops, 2)
})

test('artifact clicks resolve a child mesh to its game and dispose the listener', () => {
  const listeners = new Map()
  const canvas = {
    getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 200 }),
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type, listener) => { assert.equal(listeners.get(type), listener); listeners.delete(type) }
  }
  const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const artifact = new THREE.Group()
  artifact.userData.game = 'snake'
  artifact.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()))
  artifact.updateMatrixWorld(true)
  let opened
  const wired = wireGames({ renderer: { domElement: canvas }, camera, clickObjects: [artifact], onOpen: name => { opened = name } })
  listeners.get('pointerdown')({ clientX: 300, clientY: 150 })
  assert.equal(opened, 'snake')
  wired.dispose()
  assert.equal(listeners.size, 0)
  artifact.children[0].geometry.dispose()
  artifact.children[0].material.dispose()
})

test('3D graphics fit narrow canvases and restore the base camera on resize', () => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  let size
  const renderer = { setSize: (w, h) => { size = [w, h] } }
  upgradeScene(renderer, scene)
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping)
  assert.equal(scene.children.length, 2)
  resizeGame(renderer, camera, { clientWidth: 300, clientHeight: 300 }, 1.8)
  assert.ok(camera.fov > 50)
  assert.deepEqual(size, [300, 300])
  resizeGame(renderer, camera, { clientWidth: 900, clientHeight: 450 }, 1.8)
  assert.equal(camera.fov, 50)
})
