// Candy Cascade — an original match-3 puzzle game
import {
  createMatch3State,
  playMatch3Turn,
  shuffleMatch3Board,
  MATCH3_SIZE,
} from './gameLogic.js'
import {
  createPauseState,
  formatScore,
  mirrorState,
  readBest,
  withHints,
  writeBest,
  isPauseKey,
  isRestartKey,
  isConfirmKey,
} from './gameKit.js'
import { CANDY_SHAPES, createHudLayer, drawCandyShape, drawInnerFrame, drawPanel, drawVignette } from './gameArt.js'
import { playBeep } from './sound.js'

const GAME_NAME = 'match3'
const candyColors = ['#ff6bcf', '#c47fff', '#4fdfff', '#ffb347', '#7dff8a', '#fff06b']

export function createMatch3(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot create a 2D game canvas.')
  const pause = createPauseState()

  // Built in start(): start() calls stop() first for cleanup, which would
  // otherwise destroy a layer created here.
  let hudLayer = { set() {}, destroy() {} }

  function buildHud() {
    return createHudLayer(canvas, [
      { key: 'score', label: 'score', align: 'left', initial: '000000' },
      { key: 'moves', label: 'moves', align: 'left', initial: '30' },
      { key: 'target', label: 'target', align: 'right', initial: '300' },
      { key: 'best', label: 'best', align: 'right', initial: '000000' },
    ])
  }

  let state = createMatch3State()
  let best = 0
  let cursor = { row: 3, col: 3 }
  let frame, resizeObserver
  let flash = 0        // 0..1 pulse after a clear
  let swapPulse = null // { first, second, until }

  function syncHud() {
    scoreEl.textContent = `${formatScore(state.score, best)} · MOVES ${Math.max(0, state.moves)}`
  }

  function reset() {
    state = createMatch3State()
    cursor = { row: 3, col: 3 }
    swapPulse = null
    flash = 0
    pause.set(false)
    syncHud()
    statusEl.textContent = withHints('Swap two neighbours to line up three')
  }

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * pixelRatio
    canvas.height = height * pixelRatio
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  function layout() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const cell = Math.min(width * 0.82, height * 0.82) / MATCH3_SIZE
    return { cell, left: (width - cell * MATCH3_SIZE) / 2, top: (height - cell * MATCH3_SIZE) / 2 }
  }

  function cellAt(event) {
    const rect = canvas.getBoundingClientRect()
    const { cell, left, top } = layout()
    const col = Math.floor((event.clientX - rect.left - left) / cell)
    const row = Math.floor((event.clientY - rect.top - top) / cell)
    return row >= 0 && row < MATCH3_SIZE && col >= 0 && col < MATCH3_SIZE ? { row, col } : null
  }

  function areNeighbors(first, second) {
    return Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1
  }

  // A board can run out of legal swaps while moves remain. Previously the game
  // just sat there accepting clicks that could never match anything.
  function reshuffleIfStuck() {
    if (!state.deadlocked) return false
    const shuffled = shuffleMatch3Board()
    state = { ...state, board: shuffled.board, deadlocked: false, selected: null }
    statusEl.textContent = withHints('No moves left on the board — reshuffled')
    playBeep(420, 0.14)
    return true
  }

  function choose(cell) {
    if (!state.alive || state.won || pause.paused) return
    if (state.selected && state.selected.row === cell.row && state.selected.col === cell.col) {
      state = { ...state, selected: null }
      statusEl.textContent = withHints('Selection cleared')
      return
    }
    if (!state.selected) {
      state = { ...state, selected: cell }
      statusEl.textContent = withHints('Pick a neighbouring candy to swap')
      return
    }
    if (!areNeighbors(state.selected, cell)) {
      state = { ...state, selected: cell }
      statusEl.textContent = withHints('Pick a neighbouring candy to swap')
      return
    }

    const previous = state
    const first = state.selected
    state = playMatch3Turn(state, first, cell)
    swapPulse = { first, second: cell, until: performance.now() + 180 }

    if (!state.lastTurnValid) {
      statusEl.textContent = withHints('That swap makes no match')
      playBeep(240, 0.08)
    } else {
      const gained = state.score - previous.score
      flash = 1
      playBeep(state.lastCascade > 1 ? 880 : 660, 0.08)
      if (state.won) {
        best = writeBest(GAME_NAME, state.score)
        statusEl.textContent = withHints(`Target reached with ${state.moves} moves to spare!`, { pause: false })
      } else if (!state.alive) {
        best = writeBest(GAME_NAME, state.score)
        statusEl.textContent = withHints(`Out of moves at ${state.score}`, { pause: false })
      } else if (state.lastCascade > 1) {
        statusEl.textContent = `Cascade ×${state.lastCascade} for ${gained} points!`
      } else {
        statusEl.textContent = `+${gained} points · ${state.moves} moves left`
      }
      best = Math.max(best, state.score)
      reshuffleIfStuck()
    }
    syncHud()
  }

  function moveCursor(rowDelta, colDelta) {
    cursor = {
      row: (cursor.row + rowDelta + MATCH3_SIZE) % MATCH3_SIZE,
      col: (cursor.col + colDelta + MATCH3_SIZE) % MATCH3_SIZE
    }
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
        statusEl.textContent = paused ? withHints('Paused') : withHints('Back to matching')
      }
      return
    }
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (moves[event.key]) {
      event.preventDefault()
      moveCursor(...moves[event.key])
      return
    }
    if (isConfirmKey(event.key)) {
      event.preventDefault()
      choose(cursor)
    }
  }

  function drawCandy(row, col, value, cell, left, top) {
    const x = left + col * cell + cell / 2
    const y = top + row * cell + cell / 2
    const radius = cell * 0.34 * (1 + flash * 0.05)
    const shape = CANDY_SHAPES[value % CANDY_SHAPES.length]

    context.save()
    context.shadowColor = candyColors[value]
    context.shadowBlur = 12 + flash * 12
    const gloss = context.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.08, x, y, radius)
    gloss.addColorStop(0, '#ffffff')
    gloss.addColorStop(0.4, candyColors[value])
    gloss.addColorStop(1, '#1b2440')
    drawCandyShape(context, shape, x, y, radius)
    context.fillStyle = gloss
    context.fill()
    context.shadowBlur = 0

    // rim + specular so each shape reads at a glance
    drawCandyShape(context, shape, x, y, radius)
    context.lineWidth = 1.5
    context.strokeStyle = 'rgba(255,255,255,0.45)'
    context.stroke()
    context.beginPath()
    context.ellipse(x - radius * 0.3, y - radius * 0.36, radius * 0.2, radius * 0.14, -0.5, 0, Math.PI * 2)
    context.fillStyle = 'rgba(255,255,255,0.75)'
    context.fill()
    context.restore()
  }

  function draw() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const { cell, left, top } = layout()
    context.clearRect(0, 0, width, height)
    const background = context.createLinearGradient(0, 0, width, height)
    background.addColorStop(0, '#172340')
    background.addColorStop(1, '#080d1c')
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    // Board panel: a real frame instead of a hairline rectangle.
    drawPanel(context, left - 10, top - 10, cell * MATCH3_SIZE + 20, cell * MATCH3_SIZE + 20, {
      radius: 14,
      fill: 'rgba(8,13,28,0.55)',
      stroke: 'rgba(196,127,255,0.28)',
      accent: 'rgba(196,127,255,0.55)',
    })

    for (let row = 0; row < MATCH3_SIZE; row++) {
      for (let col = 0; col < MATCH3_SIZE; col++) {
        context.fillStyle = (row + col) % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)'
        context.fillRect(left + col * cell, top + row * cell, cell, cell)
        drawCandy(row, col, state.board[row][col], cell, left, top)
      }
    }

    if (swapPulse && performance.now() < swapPulse.until) {
      context.strokeStyle = 'rgba(255,255,255,0.75)'
      context.lineWidth = 2
      for (const cellRef of [swapPulse.first, swapPulse.second]) {
        context.strokeRect(left + cellRef.col * cell + 3, top + cellRef.row * cell + 3, cell - 6, cell - 6)
      }
    }

    const focus = state.selected || cursor
    if (focus && state.alive && !state.won) {
      context.strokeStyle = state.selected ? '#fff06b' : 'rgba(255,255,255,0.55)'
      context.lineWidth = 3
      context.strokeRect(left + focus.col * cell + 4, top + focus.row * cell + 4, cell - 8, cell - 8)
    }

    if (pause.paused) {
      context.fillStyle = 'rgba(3,7,18,0.6)'
      context.fillRect(0, 0, width, height)
      context.fillStyle = '#e8f1ff'
      context.font = `700 ${Math.round(Math.min(width, height) * 0.06)}px ui-monospace, monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('PAUSED', width / 2, height / 2)
    }

    flash = Math.max(0, flash - 0.06)
    hudLayer.set({
      score: String(state.score).padStart(6, '0'),
      moves: String(Math.max(0, state.moves)),
      target: '300',
      best: String(Math.max(best, state.score)).padStart(6, '0'),
    })
    drawVignette(context, width, height, 0.4)
    drawInnerFrame(context, width, height, { radius: 14 })
    mirrorState(canvas, [
      state.score,
      Math.max(0, state.moves),
      pause.paused ? 'paused' : state.won ? 'won' : state.alive ? 'playing' : 'over',
    ])
    frame = requestAnimationFrame(draw)
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
    canvas.addEventListener('pointerdown', onPointerDown)
    draw()
  }

  function stop() {
    cancelAnimationFrame(frame)
    hudLayer.destroy()
    hudLayer = { set() {}, destroy() {} }
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', onKey)
    canvas.removeEventListener('pointerdown', onPointerDown)
  }

  function onPointerDown(event) {
    const cell = cellAt(event)
    if (cell) choose(cell)
  }

  return { start, stop }
}
