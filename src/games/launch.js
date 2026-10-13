// Sky Sling — an original aim-and-launch physics game
import {
  adjustLaunchAim,
  createLaunchState,
  launchAccuracyBonus,
  launchProjectile,
  shotsLeft,
  stepLaunch,
  LAUNCH_MAX_SHOTS,
} from './gameLogic.js'
import {
  createClock,
  createPauseState,
  formatScore,
  mirrorState,
  readBest,
  substeps,
  withHints,
  writeBest,
  isPauseKey,
  isRestartKey,
  isConfirmKey,
} from './gameKit.js'
import {
  createHudLayer,
  drawInnerFrame,
  drawPanel,
  drawVignette,
  roundRect,
} from './gameArt.js'
import { playBeep } from './sound.js'

const GAME_NAME = 'launch'

export function createLaunch(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot create a 2D game canvas.')
  const clock = createClock()
  const pause = createPauseState()

  // Built in start(): start() calls stop() first for cleanup.
  let hudLayer = { set() {}, destroy() {} }

  function buildHud() {
    return createHudLayer(canvas, [
      { key: 'score', label: 'score', align: 'left', initial: '000000' },
      { key: 'shots', label: 'shots', align: 'left', initial: '8' },
      { key: 'targets', label: 'targets', align: 'right', initial: '3' },
      { key: 'best', label: 'best', align: 'right', initial: '000000' },
    ])
  }

  let state = createLaunchState()
  let best = 0
  let frame, resizeObserver

  function syncHud() {
    scoreEl.textContent = `${formatScore(state.score, best)} · SHOTS ${shotsLeft(state)}`
  }

  function reset() {
    state = createLaunchState()
    clock.reset()
    pause.set(false)
    syncHud()
    statusEl.textContent = withHints(`Aim with arrows or drag · ${LAUNCH_MAX_SHOTS} shots for three targets`)
  }

  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = canvas.clientWidth * pixelRatio
    canvas.height = canvas.clientHeight * pixelRatio
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  function layout() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const scale = Math.min(width / 12, height / 6)
    return { scale, left: (width - scale * 12) / 2, top: (height - scale * 6) / 2 }
  }

  function toWorld(event) {
    const rect = canvas.getBoundingClientRect()
    const { scale, left, top } = layout()
    return { x: (event.clientX - rect.left - left) / scale, y: (event.clientY - rect.top - top) / scale }
  }

  function setAim(world) {
    if (state.projectile || !state.alive || state.won) return
    const dx = Math.max(0.2, world.x - 1.35)
    const dy = 4.65 - world.y
    const angle = Math.max(0.15, Math.min(1.25, Math.atan2(dy, dx)))
    const power = Math.max(0.35, Math.min(1, Math.hypot(dx, dy) / 8))
    state = { ...state, angle, power }
  }

  function launch() {
    if (state.projectile || !state.alive || state.won) return
    const before = state.shots
    state = launchProjectile(state)
    if (state.shots !== before) {
      playBeep()
      syncHud()
      statusEl.textContent = withHints(`Shot away · ${shotsLeft(state)} left`)
    }
  }

  function onPointerMove(event) {
    setAim(toWorld(event))
  }

  function onPointerDown(event) {
    if (state.projectile) return
    setAim(toWorld(event))
    launch()
  }

  function onKey(event) {
    if (isRestartKey(event.key) || (isConfirmKey(event.key) && (!state.alive || state.won))) {
      event.preventDefault()
      reset()
      return
    }
    if (isPauseKey(event.key)) {
      event.preventDefault()
      if (state.alive && !state.won) {
        const paused = pause.toggle()
        statusEl.textContent = paused ? withHints('Paused') : withHints('Back to aiming')
      }
      return
    }
    if (isConfirmKey(event.key)) {
      event.preventDefault()
      launch()
      return
    }
    const aim = {
      ArrowUp: [0.06, 0], ArrowDown: [-0.06, 0],
      ArrowLeft: [0, -0.05], ArrowRight: [0, 0.05]
    }
    if (aim[event.key]) {
      event.preventDefault()
      state = adjustLaunchAim(state, ...aim[event.key])
    }
  }

  function circle(x, y, radius, fill, stroke = null) {
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    const gloss = context.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 0, x, y, radius)
    gloss.addColorStop(0, '#ffffff')
    gloss.addColorStop(0.3, fill)
    gloss.addColorStop(1, fill)
    context.fillStyle = gloss
    context.fill()
    if (stroke) {
      context.strokeStyle = stroke
      context.lineWidth = 0.05
      context.stroke()
    }
  }

  function draw() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const { scale, left, top } = layout()
    context.clearRect(0, 0, width, height)
    context.save()
    context.translate(left, top)
    context.scale(scale, scale)

    const sky = context.createLinearGradient(0, 0, 0, 6)
    sky.addColorStop(0, '#1b3057')
    sky.addColorStop(1, '#09070e')
    context.fillStyle = sky
    context.fillRect(0, 0, 12, 6)

    // Layered distant skyline gives depth without changing collision geometry.
    for (let layer = 0; layer < 2; layer++) {
      context.fillStyle = layer ? '#17213a' : '#253455'
      for (let i = 0; i < 24; i++) {
        const buildingHeight = 0.4 + (Math.sin(i * 7 + layer * 3) + 1) * 0.65
        context.fillRect(i * 0.55, 5.1 - buildingHeight, 0.45, buildingHeight)
      }
    }
    context.strokeStyle = 'rgba(79, 223, 255, 0.16)'
    context.lineWidth = 0.015
    for (let x = 0; x <= 12; x++) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 5.2); context.stroke() }
    for (let y = 0; y <= 5; y++) { context.beginPath(); context.moveTo(0, y); context.lineTo(12, y); context.stroke() }

    context.fillStyle = '#2a1f3a'
    context.fillRect(0, 5.1, 12, 0.9)
    context.fillStyle = '#4fdfff'
    context.fillRect(0, 5.08, 12, 0.04)

    // Trajectory guide before launch.
    if (!state.projectile && state.alive && !state.won) {
      const speed = 3 + state.power * 7
      context.setLineDash([0.08, 0.12])
      for (let i = 1; i <= 12; i++) {
        const time = i * 0.08
        circle(1.35 + Math.cos(state.angle) * speed * time, 4.65 - Math.sin(state.angle) * speed * time + 3.75 * time * time, 0.035, 'rgba(255,240,107,0.7)')
      }
      context.setLineDash([])
    }

    // Slingshot and bird.
    context.strokeStyle = '#c47fff'
    context.lineWidth = 0.12
    context.beginPath(); context.moveTo(1.05, 5.1); context.lineTo(1.2, 4.25); context.lineTo(1.35, 4.65); context.stroke()
    context.beginPath(); context.moveTo(1.55, 5.1); context.lineTo(1.45, 4.25); context.lineTo(1.35, 4.65); context.stroke()
    const bird = state.projectile || { x: 1.35, y: 4.65 }
    circle(bird.x, bird.y, bird.radius || 0.28, '#ff6bcf', '#fff06b')
    circle(bird.x + 0.09, bird.y - 0.06, 0.035, '#ffffff')

    for (const target of state.targets) {
      if (!target.alive) continue
      const block = context.createLinearGradient(target.x - target.radius, target.y - target.radius, target.x + target.radius, target.y + target.radius)
      block.addColorStop(0, '#ffe9b0')
      block.addColorStop(1, '#cc741f')
      context.fillStyle = block
      roundRect(context, target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2, target.radius * 0.35)
      context.fill()
      context.lineWidth = 0.03
      context.strokeStyle = 'rgba(255,255,255,0.45)'
      context.stroke()
      circle(target.x, target.y, target.radius * 0.62, '#ff6bcf')
      circle(target.x - target.radius * 0.2, target.y - target.radius * 0.24, target.radius * 0.16, '#ffffff')
    }

    // Aim gauge: angle arc at the slingshot plus a power bar in the corner, so
    // the shot can be read without looking away from the trajectory guide.
    if (!state.projectile && state.alive && !state.won) {
      const originX = 1.35
      const originY = 4.65
      const radius = 1.15
      context.strokeStyle = 'rgba(255,240,107,0.85)'
      context.lineWidth = 0.05
      context.beginPath()
      context.moveTo(originX, originY)
      context.lineTo(originX + Math.cos(state.angle) * radius, originY - Math.sin(state.angle) * radius)
      context.stroke()
      context.beginPath()
      context.arc(originX, originY, radius * 0.42, -state.angle, 0)
      context.strokeStyle = 'rgba(255,240,107,0.35)'
      context.lineWidth = 0.03
      context.stroke()

      drawPanel(context, 0.3, 0.35, 2.5, 1.05, { radius: 0.16, accent: 'rgba(79,223,255,0.7)' })
      context.fillStyle = 'rgba(161,161,170,1)'
      context.font = '600 0.17px ui-monospace, monospace'
      context.textAlign = 'left'
      context.textBaseline = 'middle'
      context.fillText('ANGLE', 0.5, 0.68)
      context.fillText('POWER', 0.5, 1.06)
      context.fillStyle = '#ffffff'
      context.textAlign = 'right'
      context.fillText(`${Math.round((state.angle * 180) / Math.PI)}°`, 2.6, 0.68)
      roundRect(context, 0.5, 1.18, 1.9, 0.14, 0.07)
      context.fillStyle = 'rgba(255,255,255,0.14)'
      context.fill()
      const bar = context.createLinearGradient(0.5, 0, 2.4, 0)
      bar.addColorStop(0, '#4fdfff')
      bar.addColorStop(1, '#ff6bcf')
      roundRect(context, 0.5, 1.18, 1.9 * Math.max(0.05, state.power), 0.14, 0.07)
      context.fillStyle = bar
      context.fill()
    }
    context.restore()

    if (pause.paused) {
      context.fillStyle = 'rgba(3,7,18,0.6)'
      context.fillRect(0, 0, width, height)
      context.fillStyle = '#e8f1ff'
      context.font = `700 ${Math.round(Math.min(width, height) * 0.06)}px ui-monospace, monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('PAUSED', width / 2, height / 2)
    }

    hudLayer.set({
      score: String(state.score).padStart(6, '0'),
      shots: String(shotsLeft(state)),
      targets: String(state.targets.filter((target) => target.alive).length),
      best: String(Math.max(best, state.score)).padStart(6, '0'),
    })
    drawVignette(context, width, height, 0.45)
    drawInnerFrame(context, width, height, { radius: 14 })
    mirrorState(canvas, [
      state.score,
      shotsLeft(state),
      pause.paused ? 'paused' : state.won ? 'won' : state.alive ? 'playing' : 'over',
    ])
    frame = requestAnimationFrame(loop)
  }

  function loop() {
    const dt = clock.tick(performance.now())
    if (!pause.paused && state.alive && !state.won && state.projectile) {
      const previousScore = state.score
      // Sub-stepped so a fast shot can't pass through a target between frames.
      for (const step of substeps(dt, 1 / 240)) {
        state = stepLaunch(state, step)
        if (!state.projectile) break
      }
      if (state.score !== previousScore) {
        syncHud()
        playBeep(880, 0.08)
      }
      if (state.won) {
        // Reward the shots you didn't need — precision now pays.
        const bonus = launchAccuracyBonus(state)
        state = { ...state, score: state.score + bonus }
        best = writeBest(GAME_NAME, state.score)
        syncHud()
        playBeep(980, 0.3)
        statusEl.textContent = withHints(`All targets down · +${bonus} accuracy bonus`, { pause: false })
      } else if (!state.projectile && state.alive) {
        if (shotsLeft(state) <= 0) {
          state = { ...state, alive: false }
          best = writeBest(GAME_NAME, state.score)
          syncHud()
          statusEl.textContent = withHints(`Out of shots at ${state.score}`, { pause: false })
        } else {
          statusEl.textContent = withHints(`Missed · ${shotsLeft(state)} shots left · adjust your aim`)
        }
      }
    }
    draw()
  }

  function start() {
    stop()
    best = readBest(GAME_NAME)
    reset()
    hudLayer = buildHud()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)
    frame = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(frame)
    hudLayer.destroy()
    hudLayer = { set() {}, destroy() {} }
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', onKey)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
  }

  return { start, stop }
}
