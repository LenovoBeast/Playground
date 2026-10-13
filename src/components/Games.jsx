import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, SquareLogo, X, Planet, ArrowRight, Spinner, ArrowClockwise } from '@phosphor-icons/react';
import { useTilt } from '../hooks/useTilt.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
// gameSession is three-free: keeping it out of the three import graph lets the
// 514 kB vendor-three chunk load lazily with the 3D scenes that need it.
import { createGameSession } from '../games/gameSession.js';
import ErrorBoundary from './ErrorBoundary.jsx';

gsap.registerPlugin(ScrollTrigger);

// The catalogue is the single source of truth for the launcher: name must match
// a loader in games/gameSession.js, and `span`/`badge` drive the bento layout.
const GAMES = [
  {
    name: 'bytefall',
    title: 'Bytefall',
    desc: 'Original platformer. Run, stomp glitch-mites, break cache blocks for packets, and reach the terminal flag before the timer runs out.',
    accent: 'from-blue-500 to-cyan-500',
    tint: 'rgba(59,130,246,0.18)',
    span: 2,
    badge: 'new',
    controls: 'Arrows or A/D to run · Space or W to jump (hold for height) · R restart · P pause',
  },
  { name: 'snake', title: 'Snake', desc: 'A 3D snake on a holographic grid. Arrow keys or WASD.', accent: 'from-emerald-500 to-teal-500', tint: 'rgba(52,211,153,0.18)', span: 1, controls: 'Arrow keys or WASD to steer' },
  { name: 'breakout', title: 'Breakout', desc: 'Bounce the ball against the brick wall. Move the paddle with arrows.', accent: 'from-rose-500 to-pink-500', tint: 'rgba(244,114,182,0.18)', span: 1, controls: 'Left/Right arrows to move the paddle · Space to serve' },
  { name: 'racer', title: 'Racer', desc: 'Ride the neon loop. Hold Up or W to drive; Down or S to reverse.', accent: 'from-cyan-500 to-blue-500', tint: 'rgba(34,211,238,0.18)', span: 1, controls: 'Hold Up/W to accelerate · Down/S to reverse' },
  { name: 'match3', title: 'Match 3', desc: 'Swap adjacent orbs to line up three. Arrow keys move, Enter selects; or click two neighbors.', accent: 'from-fuchsia-500 to-purple-500', tint: 'rgba(217,70,239,0.18)', span: 1, controls: 'Arrows to move · Enter to select · or click two neighbours' },
  { name: 'launch', title: 'Launch', desc: 'Aim and fire at the target. Arrows set angle and power, Space fires; or click-drag.', accent: 'from-amber-500 to-orange-500', tint: 'rgba(251,146,60,0.18)', span: 1, controls: 'Arrows to aim · Space to fire · or drag and release' },
];

function GameOverlay({ name, title, desc, accent, controls, open, status, error, onRestart, onClose }) {
  const overlayRef = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    overlayRef.current?.querySelector('.play-btn')?.focus();
    return () => prevFocus.current?.focus?.();
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;
    const el = overlayRef.current;
    if (!el) return;
    const focusable = Array.from(el.querySelectorAll(
      'button, [href], [tabindex="0"]'
    )).filter(node => !node.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  const playing = status === 'playing';
  const loading = status === 'loading';

  return (
    <div
      ref={overlayRef}
      id={`${name}Overlay`}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} game overlay`}
      // No backdrop-blur here on purpose: blurring the full viewport behind the
      // cabinet measured 3x slower frames (8fps vs 23fps under software
      // rendering) and the games need that budget. A heavier dim reads the same.
      className={`game-overlay fixed inset-0 z-50 hidden items-center justify-center bg-black/88 ${open ? 'active' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {/* Scrollable on short screens: the cabinet is taller than a phone
          viewport, and without this the Close button is unreachable. */}
      <div className="panel relative mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-6 md:p-8">
        <button
          onClick={onClose}
          className="close-btn absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close game"
        >
          <X size={18} weight="bold" />
        </button>
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
        <h2 className="mb-2 text-display-2 italic">{title}</h2>
        <p className="mb-6 text-body-sm text-zinc-400">{desc}</p>

        <canvas
          id={`${name}Canvas`}
          tabIndex={0}
          aria-label={`${title} playing field`}
          className="aspect-video w-full rounded-2xl border border-white/8 bg-black/60"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-xs sm:text-sm">
          <span className="shrink-0 text-zinc-400">Score</span>
          <span id={`${name}Score`} className="min-w-0 break-words text-right tabular-nums text-white" />
        </div>
        {/* Single live region: the engine pushes state changes here, so score
            and life changes are announced instead of silently repainting. */}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1 font-mono text-xs sm:text-sm">
          <span className="shrink-0 text-zinc-400">Status</span>
          <span
            id={`${name}Status`}
            role="status"
            aria-live="polite"
            className="min-w-0 text-right text-zinc-400"
          />
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-zinc-400">
          {controls}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            disabled={loading}
            className="play-btn magnetic-btn btn-sweep active-press relative flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <>
                <Spinner size={20} weight="bold" className="animate-spin" />
                Loading…
              </>
            )}
            {playing && (
              <>
                <ArrowClockwise size={20} weight="bold" />
                Restart
              </>
            )}
            {!loading && !playing && (
              <>
                Play
                <ArrowRight size={20} weight="bold" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-6 py-4 text-lg font-bold text-zinc-300 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            Close
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Press <kbd className="rounded bg-white/5 px-1.5 py-0.5">Esc</kbd> to exit.
        </p>
      </div>
    </div>
  );
}

function GameCard({ game, index, onOpen }) {
  const isHero = (game.span ?? 1) > 1;
  const tilt = useTilt({ max: 8, scale: isHero ? 1.02 : 1.03, lift: isHero ? 20 : 16 });

  return (
    <div
      className={`tilt-scene h-full ${isHero ? 'lg:col-span-2' : ''}`}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <div ref={tilt.ref} className="tilt-body h-full">
        <div
          className="panel corner-frame group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden p-7 md:p-8"
          data-game={game.name}
          onClick={() => onOpen(game)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(game); } }}
          tabIndex={0}
          role="button"
          aria-label={`Open ${game.title}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: `radial-gradient(110% 90% at 20% 0%, ${game.tint} 0%, transparent 60%)` }}
          />
          <div className="tilt-sheen" />

          <div className="relative flex items-center justify-between" style={{ transform: 'translateZ(26px)' }}>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
              {String(index + 1).padStart(2, '0')} · {game.name}
              {game.badge && (
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-cyan-300">
                  {game.badge}
                </span>
              )}
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-zinc-400 transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 group-hover:text-white">
              <Play size={14} weight="bold" />
            </span>
          </div>

          <div className={`relative mt-10 ${isHero ? 'flex-1' : ''}`} style={{ transform: 'translateZ(18px)' }}>
            <h3 className={`mb-3 italic leading-[1.02] ${isHero ? 'text-display-1' : 'text-display-1'}`}>{game.title}</h3>
            <p className="line-clamp-3 text-body-sm text-zinc-400">{game.desc}</p>
            <div className={`mt-5 h-[3px] w-full rounded-full bg-gradient-to-r ${game.accent} opacity-40 transition-opacity duration-500 group-hover:opacity-100`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Playroom with Horizontal Pan (GSAP)
function Playroom({ onOpen }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [live, setLive] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let started = false;
    let teardown = () => {};

    const boot = async () => {
      const size = () => {
        const rect = host.getBoundingClientRect();
        return { width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) };
      };

      let scene, camera, renderer, controls, world, disposeScene, disposeGames, clickObjects, wireGames;
      try {
        // Loaded on demand (with world.js): keeps three.js out of the entry
        // chunk. Module instances are shared, so `clickObjects` stays the same
        // array the raycaster in wireGames reads.
        const [worldModule, wireGamesModule] = await Promise.all([
          import('../world.js'),
          import('../games/wireGames.js'),
        ]);
        wireGames = wireGamesModule.wireGames;
        clickObjects = worldModule.clickObjects;
        const built = worldModule.setupScene(canvas, size);
        scene = built.scene;
        camera = built.camera;
        renderer = built.renderer;
        controls = built.controls;
        disposeScene = built.dispose;
        world = worldModule.buildWorld(scene);
      } catch (err) {
        console.warn('[playroom] 3D scene unavailable', err);
        return () => {};
      }

      const running = { value: true };
      let raf = 0;

      const tick = (t) => {
        if (!running.value) return;
        world.tick(t * 0.001);
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      const wired = wireGames({ renderer, camera, clickObjects, onOpen });
      disposeGames = wired.dispose;

      raf = requestAnimationFrame(tick);
      setLive(true);

      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
        const { width, height } = size();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }) : null;
      ro?.observe(host);

      return () => {
        running.value = false;
        cancelAnimationFrame(raf);
        ro?.disconnect();
        disposeGames?.();
        clickObjects.length = 0;
        disposeScene?.();
        setLive(false);
      };
    };

    // boot() is async (it dynamically imports the 3D modules). Keep the
    // promise-to-cleanup handoff explicit so an unmount during the import
    // window still disposes correctly.
    const startBoot = () => {
      boot().then((fn) => {
        teardown = typeof fn === 'function' ? fn : () => {};
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      startBoot();
      return () => teardown();
    }

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !started) {
        started = true;
        startBoot();
        io.disconnect();
      }
    }, { rootMargin: '250px' });

    io.observe(host);
    return () => {
      io.disconnect();
      teardown();
    };
  }, [onOpen]);

  // Horizontal Pan GSAP
  useEffect(() => {
    if (reducedMotion) return;
    const track = hostRef.current?.querySelector('.playroom-track');
    if (!track) return;

    const ctx = gsap.context(() => {
      const distance = track.scrollWidth - window.innerWidth;
      if (distance <= 0) return;

      gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: hostRef.current,
          start: 'top top',
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, hostRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div ref={hostRef} className="relative">
      <div className="panel relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] md:aspect-[21/9]">
        <div className="playroom-track flex h-full items-center" style={{ width: 'max-content' }}>
          <canvas ref={canvasRef} className="h-full w-[120vw] min-w-[120vw] flex-shrink-0" aria-hidden="true" />
        </div>

        {/* Frame furniture */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/6" />
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
          <Planet size={13} weight="bold" className="text-blue-400" />
          playroom · drag to orbit
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          {live ? 'engine live' : 'engine idle'}
        </div>
        {/* Shown on every pointer type: this hint used to be desktop-only, which
            left touch visitors with a 3D scene and no visible way in. */}
        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
          <SquareLogo size={12} weight="bold" /> tap an artifact to play
        </div>
      </div>
    </div>
  );
}

export default function Games({ onOverlayChange }) {
  const [openGame, setOpenGame] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [error, setError] = useState(null);
  const session = useRef(null);
  if (!session.current) session.current = createGameSession();

  const open = useCallback((game) => {
    const entry = typeof game === 'string' ? GAMES.find(item => item.name === game) : game;
    if (!entry) return;
    session.current.close();
    setError(null);
    setOpenGame(entry);
  }, []);

  // Start the engine as soon as the cabinet opens: the old flow made visitors
  // click a card and then click Play before anything happened.
  useEffect(() => {
    if (!openGame) return;
    let cancelled = false;
    setStatus('loading');
    setError(null);
    session.current.play(openGame.name)
      .then(() => {
        if (cancelled) return;
        setStatus('playing');
        // Move focus to the field so keyboard play works immediately.
        document.getElementById(`${openGame.name}Canvas`)?.focus();
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setError(err?.message || 'Failed to load game');
      });
    return () => {
      cancelled = true;
      session.current.close();
    };
  }, [openGame]);

  const restart = useCallback(() => {
    if (!openGame) return;
    setStatus('loading');
    setError(null);
    session.current.play(openGame.name)
      .then(() => {
        setStatus('playing');
        document.getElementById(`${openGame.name}Canvas`)?.focus();
      })
      .catch((err) => {
        setStatus('error');
        setError(err?.message || 'Failed to load game');
      });
  }, [openGame]);

  const close = useCallback(() => {
    session.current.close();
    setOpenGame(null);
    setStatus('idle');
  }, []);

  useEffect(() => () => session.current.close(), []);
  // Tell the app when a cabinet is open so the 3D backdrop can stand down and
  // give the game the whole frame budget.
  useEffect(() => {
    onOverlayChange?.(Boolean(openGame));
  }, [openGame, onOverlayChange]);
  useEffect(() => {
    if (!openGame) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [openGame]);

  return (
    <section id="games" className="section-gap relative px-6" aria-labelledby="games-title">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-b right-[-6%] top-[16%] h-[400px] w-[400px] bg-rose-500/12" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="games-title" className="text-display-2 italic">
              Playable <span className="gradient-text">Experiments</span>
            </h2>
          </div>
          <p className="max-w-sm text-body-sm">
            Six hand-built engines running on WebGL and 2D canvas. Launch one from a card, or click its
            artifact floating in the scene.
          </p>
        </div>

        <div className="mb-12">
          {/* The floating 3D scene is a nice-to-have entrance to the games; if
              it fails, the cards below are the fully accessible path. */}
          <ErrorBoundary
            label="3D playroom"
            fallback={
              <div className="panel corner-frame relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[1.75rem] md:aspect-[21/9]">
                <div className="grid-veil absolute inset-0" aria-hidden="true" />
                <p className="relative z-10 max-w-sm px-6 text-center text-body-sm">
                  The 3D playroom is unavailable on this device.
                  All six games are playable from the cards below.
                </p>
              </div>
            }
          >
            <Playroom onOpen={open} />
          </ErrorBoundary>
        </div>

        {/* Bento grid: the hero card spans two columns, the rest fill in */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense">
          {GAMES.map((game, index) => (
            <GameCard key={game.name} game={game} index={index} onOpen={open} />
          ))}
        </div>
      </div>

      {GAMES.map((game) => (
        <GameOverlay
          key={game.name}
          {...game}
          open={openGame?.name === game.name}
          status={status}
          error={openGame?.name === game.name ? error : null}
          onRestart={restart}
          onClose={close}
        />
      ))}
    </section>
  );
}
