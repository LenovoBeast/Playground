// Sky Sling — an original aim-and-launch physics game
import { adjustLaunchAim, createLaunchState, launchProjectile, stepLaunch } from './gameLogic.js'
import { playBeep } from './sound.js'

export function createLaunch(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  let state = createLaunchState()
  let frame, resizeObserver, lastTime = 0

  function reset() {
    state = createLaunchState()
    scoreEl.textContent = `SCORE: ${state.score} · SHOTS: ${state.shots}`
    statusEl.textContent = 'Aim with arrows or drag · Space/click to launch · R clears'
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
    state = launchProjectile(state);
        playBeep();
    statusEl.textContent = 'Watch the arc · drag to aim the next shot'
    scoreEl.textContent = `SCORE: ${state.score} · SHOTS: ${state.shots}`
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
    if (event.key.toLowerCase() === 'r' || (event.key === ' ' && (state.won || !state.alive))) {
      event.preventDefault()
      reset()
      return
    }
    if (event.key === ' ') {
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
    context.fillStyle = fill
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
    sky.addColorStop(0, '#161029')
    sky.addColorStop(1, '#09070e')
    context.fillStyle = sky
    context.fillRect(0, 0, 12, 6)

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
      context.fillStyle = 'rgba(255, 240, 107, 0.7)'
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
      context.fillStyle = '#ffb347'
      context.fillRect(target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2)
      circle(target.x, target.y, target.radius * 0.62, '#ff6bcf')
    }
    context.restore()
    frame = requestAnimationFrame(loop)
  }

  function loop(time) {
    const dt = lastTime ? Math.min(0.032, (time - lastTime) / 1000) : 1 / 60
    lastTime = time
    const previousScore = state.score
    state = stepLaunch(state, dt)
    if (state.score !== previousScore) {
      scoreEl.textContent = `SCORE: ${state.score} · SHOTS: ${state.shots}`
      statusEl.textContent = state.won ? 'YOU WIN · press Space to play again' : 'Target hit · line up another shot'
    } else if (!state.projectile && state.shots > 0 && state.alive) {
      statusEl.textContent = 'Missed · adjust your aim and launch again'
    }
    draw()
  }

  function start() {
    reset()
    lastTime = 0
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
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', onKey)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
  }

  return { start, stop }
}
