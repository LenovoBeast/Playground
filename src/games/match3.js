// Candy Cascade — an original match-3 puzzle game
import { createMatch3State, playMatch3Turn, MATCH3_SIZE } from './gameLogic.js'

const candyColors = ['#ff6bcf', '#c47fff', '#4fdfff', '#ffb347', '#7dff8a', '#fff06b']

export function createMatch3(canvas, scoreEl, statusEl) {
  const context = canvas.getContext('2d')
  let state = createMatch3State()
  let cursor = { row: 3, col: 3 }
  let frame, resizeObserver

  function reset() {
    state = createMatch3State()
    cursor = { row: 3, col: 3 }
    scoreEl.textContent = `SCORE: ${state.score} · MOVES: ${state.moves}`
    statusEl.textContent = 'Click two neighboring candies to match three · Space restarts'
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

  function choose(cell) {
    if (!state.alive || state.won) return
    if (!state.selected) {
      state = { ...state, selected: cell }
      statusEl.textContent = 'Choose a neighboring candy to swap'
      return
    }
    if (!areNeighbors(state.selected, cell)) {
      state = { ...state, selected: cell }
      statusEl.textContent = 'Choose a neighboring candy to swap'
      return
    }
    const previous = state
    state = playMatch3Turn(state, state.selected, cell)
    if (state.score === previous.score) {
      statusEl.textContent = 'That swap does not make a match'
    } else if (state.won) {
      statusEl.textContent = 'YOU WIN · press Space to play again'
    } else if (!state.alive) {
      statusEl.textContent = 'OUT OF MOVES · press Space to try again'
    } else {
      statusEl.textContent = `Combo cleared ${state.score - previous.score} points · keep matching!`
    }
    scoreEl.textContent = `SCORE: ${state.score} · MOVES: ${state.moves}`
  }

  function moveCursor(rowDelta, colDelta) {
    cursor = {
      row: (cursor.row + rowDelta + MATCH3_SIZE) % MATCH3_SIZE,
      col: (cursor.col + colDelta + MATCH3_SIZE) % MATCH3_SIZE
    }
  }

  function onKey(event) {
    if (event.key === ' ' && (!state.alive || state.won)) {
      event.preventDefault()
      reset()
      return
    }
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (moves[event.key]) {
      event.preventDefault()
      moveCursor(...moves[event.key])
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(cursor)
    }
  }

  function drawCandy(row, col, value, cell, left, top) {
    const x = left + col * cell + cell / 2
    const y = top + row * cell + cell / 2
    const radius = cell * 0.31
    context.save()
    context.shadowColor = candyColors[value]
    context.shadowBlur = 14
    context.fillStyle = candyColors[value]
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
    context.shadowBlur = 0
    context.fillStyle = 'rgba(255,255,255,0.6)'
    context.beginPath()
    context.arc(x - radius * 0.3, y - radius * 0.35, radius * 0.2, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  function draw() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const { cell, left, top } = layout()
    context.clearRect(0, 0, width, height)
    context.fillStyle = 'rgba(12, 9, 20, 0.96)'
    context.fillRect(0, 0, width, height)
    context.strokeStyle = 'rgba(196, 127, 255, 0.2)'
    context.lineWidth = 1
    context.strokeRect(left - 4, top - 4, cell * MATCH3_SIZE + 8, cell * MATCH3_SIZE + 8)

    for (let row = 0; row < MATCH3_SIZE; row++) {
      for (let col = 0; col < MATCH3_SIZE; col++) {
        context.fillStyle = (row + col) % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)'
        context.fillRect(left + col * cell, top + row * cell, cell, cell)
        drawCandy(row, col, state.board[row][col], cell, left, top)
      }
    }

    const focus = state.selected || cursor
    if (focus) {
      context.strokeStyle = state.selected ? '#fff06b' : '#ffffff'
      context.lineWidth = 3
      context.strokeRect(left + focus.col * cell + 4, top + focus.row * cell + 4, cell - 8, cell - 8)
    }
    frame = requestAnimationFrame(draw)
  }

  function start() {
    reset()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', onPointerDown)
    draw()
  }

  function stop() {
    cancelAnimationFrame(frame)
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
