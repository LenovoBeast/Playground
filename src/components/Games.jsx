import { useEffect } from 'react'

// Games.jsx — the mini-game launcher. Renders one card per game plus the
// overlay/overlay-canvas/score/status DOM hooks that wireGames.js (and the
// lazy game modules) read via getElementById.
//
// The catalogue is a single array here; if a new game is added to
// `src/games/<name>.js`, add one entry here and it appears automatically.

const GAMES = [
  { name: 'snake', title: 'Snake', desc: 'A 3D snake on a holographic grid. Arrow keys or WASD.', accent: 'from-purple-500 to-cyan-500' },
  { name: 'breakout', title: 'Breakout', desc: 'Bounce the ball against the brick wall. Move the paddle with arrows.', accent: 'from-pink-500 to-rose-500' },
  { name: 'racer', title: 'Racer', desc: 'Coast the impossible loop. Arrow keys to steer, hold to drift.', accent: 'from-cyan-500 to-blue-500' },
  { name: 'match3', title: 'Match 3', desc: 'Swap adjacent orbs to line up three. Click to select, click again to swap.', accent: 'from-fuchsia-500 to-purple-500' },
  { name: 'launch', title: 'Launch', desc: 'Aim and fire at the target. Click-drag to set angle and power.', accent: 'from-amber-500 to-orange-500' },
]

function GameOverlay({ name, title, desc, accent }) {
  return (
    <div
      id={`${name}Overlay`}
      className="game-overlay fixed inset-0 z-50 hidden items-center justify-center bg-black/70 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="relative w-full max-w-2xl mx-4">
        <button
          className="close-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Close game"
        >
          ✕
        </button>
        <div className={`rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8`}>
          <h2 className="text-display-2 italic mb-2">{title}</h2>
          <p className="text-body-sm mb-6 text-zinc-400">{desc}</p>
          <div className="game-loading text-cyan-400 text-sm font-mono" />
          <canvas
            id={`${name}Canvas`}
            className="w-full aspect-video rounded-2xl bg-black/60 border border-white/5"
          />
          <div className="mt-4 flex items-center justify-between text-sm font-mono">
            <span className="text-zinc-500">Score</span>
            <span id={`${name}Score`} className="text-white" />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm font-mono">
            <span className="text-zinc-500">Status</span>
            <span id={`${name}Status`} className="text-zinc-400" />
          </div>
          <p className="mt-6 text-xs text-zinc-600">Press <kbd className="px-1.5 py-0.5 rounded bg-white/5">Esc</kbd> to exit.</p>
        </div>
      </div>
    </div>
  )
}

export default function Games() {
  // wireGames attaches listeners on first mount; nothing to do here.
  useEffect(() => {}, [])

  return (
    <section id="games" className="section-gap px-6 bg-zinc-950/30 relative">
      <div className="section-container">
        <div className="mb-12">
          <span className="text-label mb-4 block">Mini Games</span>
          <p className="text-display-2 italic">
            Playable <span className="animated-gradient-text">Experiments</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <article
              key={game.name}
              className="game-card group relative overflow-hidden double-bezel p-8 hover-lift card-glow spotlight cursor-pointer"
              data-game={game.name}
              tabIndex={0}
              role="button"
              aria-label={`Open ${game.title}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-700`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-label">{game.name}</span>
                  <span className="text-zinc-600 group-hover:text-white transition-colors">▶</span>
                </div>
                <h3 className="text-display-1 italic mb-3">{game.title}</h3>
                <p className="text-body-sm text-zinc-400 line-clamp-3">{game.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {GAMES.map((game) => (
        <GameOverlay key={game.name} {...game} />
      ))}
    </section>
  )
}