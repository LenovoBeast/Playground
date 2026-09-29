import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, SquareLogo, CompassTool, X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { setupScene, buildWorld, clickObjects } from '../world.js';
import { wireGames } from '../games/wireGames.js';
import { useTilt } from '../hooks/useTilt.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

gsap.registerPlugin(ScrollTrigger);

const GAMES = [
  { name: 'snake', title: 'Snake', desc: 'A 3D snake on a holographic grid. Arrow keys or WASD.', accent: 'from-emerald-500 to-teal-500', tint: 'rgba(52,211,153,0.18)' },
  { name: 'breakout', title: 'Breakout', desc: 'Bounce the ball against the brick wall. Move the paddle with arrows.', accent: 'from-rose-500 to-pink-500', tint: 'rgba(244,114,182,0.18)' },
  { name: 'racer', title: 'Racer', desc: 'Coast the impossible loop. Arrow keys to steer, hold to drift.', accent: 'from-cyan-500 to-blue-500', tint: 'rgba(34,211,238,0.18)' },
  { name: 'match3', title: 'Match 3', desc: 'Swap adjacent orbs to line up three. Click to select, click again to swap.', accent: 'from-fuchsia-500 to-purple-500', tint: 'rgba(217,70,239,0.18)' },
  { name: 'launch', title: 'Launch', desc: 'Aim and fire at the target. Click-drag to set angle and power.', accent: 'from-amber-500 to-orange-500', tint: 'rgba(251,146,60,0.18)' },
];

function GameOverlay({ name, title, desc, accent, onClose }) {
  return (
    <div
      id={`${name}Overlay`}
      className="game-overlay fixed inset-0 z-50 hidden items-center justify-center bg-black/75 backdrop-blur-md"
      aria-hidden="true"
    >
      <div className="panel relative mx-4 w-full max-w-2xl p-6 md:p-8">
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
        <div className="game-loading mb-3 font-mono text-sm text-cyan-400" />
        <canvas
          id={`${name}Canvas`}
          className="aspect-video w-full rounded-2xl border border-white/8 bg-black/60"
        />
        <div className="mt-4 flex items-center justify-between font-mono text-sm">
          <span className="text-zinc-500">Score</span>
          <span id={`${name}Score`} className="tabular-nums text-white" />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-sm">
          <span className="text-zinc-500">Status</span>
          <span id={`${name}Status`} className="text-zinc-400" />
        </div>
        <p className="mt-6 text-xs text-zinc-600">
          Press <kbd className="rounded bg-white/5 px-1.5 py-0.5">Esc</kbd> to exit.
        </p>
      </div>
    </div>
  );
}

function GameCard({ game, index, isHero }) {
  const tilt = useTilt({ max: 8, scale: isHero ? 1.02 : 1.03, lift: isHero ? 20 : 16 });

  if (isHero) {
    return (
      <div
        className="tilt-scene h-full lg:col-span-2 lg:row-span-1"
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        <div ref={tilt.ref} className="tilt-body h-full">
          <article
            className="panel corner-frame group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden p-7 md:p-8"
            data-game={game.name}
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
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                {String(index + 1).padStart(2, '0')} · {game.name}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 group-hover:text-white">
                <Play size={14} weight="bold" />
              </span>
            </div>

            <div className="relative mt-10 flex-1" style={{ transform: 'translateZ(18px)' }}>
              <h3 className="mb-3 text-display-1 italic leading-[1.02]">{game.title}</h3>
              <p className="line-clamp-3 text-body-sm text-zinc-400">{game.desc}</p>
              <div className={`mt-5 h-[3px] w-full rounded-full bg-gradient-to-r ${game.accent} opacity-40 transition-opacity duration-500 group-hover:opacity-100`} />
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tilt-scene h-full"
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <div ref={tilt.ref} className="tilt-body h-full">
        <article
          className="panel corner-frame group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden p-7"
          data-game={game.name}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              {String(index + 1).padStart(2, '0')} · {game.name}
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 group-hover:text-white">
              <Play size={14} weight="bold" />
            </span>
          </div>

          <div className="relative mt-10" style={{ transform: 'translateZ(18px)' }}>
            <h3 className="mb-3 text-display-1 italic leading-[1.02]">{game.title}</h3>
            <p className="line-clamp-3 text-body-sm text-zinc-400">{game.desc}</p>
            <div className={`mt-5 h-[3px] w-full rounded-full bg-gradient-to-r ${game.accent} opacity-40 transition-opacity duration-500 group-hover:opacity-100`} />
          </div>
        </article>
      </div>
    </div>
  );
}

// Playroom with Horizontal Pan (GSAP)
function Playroom() {
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

    const boot = () => {
      const size = () => {
        const rect = host.getBoundingClientRect();
        return { width: Math.max(rect.width, 1), height: Math.max(rect.height, 1) };
      };

      let scene, camera, renderer, controls, world, disposeScene, disposeGames;
      try {
        const built = setupScene(canvas, size);
        scene = built.scene;
        camera = built.camera;
        renderer = built.renderer;
        controls = built.controls;
        disposeScene = built.dispose;
        world = buildWorld(scene);
      } catch (err) {
        console.warn('[playroom] 3D scene unavailable', err);
        return () => {};
      }

      const running = { value: true };
      let raf = 0;
      const pause = () => { running.value = false; };
      const resume = () => { running.value = true; raf = requestAnimationFrame(tick); };

      const tick = (t) => {
        if (!running.value) return;
        world.tick(t * 0.001);
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };

      const wired = wireGames({ renderer, camera, pause, resume, clickObjects });
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
        disposeScene?.();
        setLive(false);
      };
    };

    if (typeof IntersectionObserver === 'undefined') {
      teardown = boot();
      return () => teardown();
    }

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !started) {
        started = true;
        teardown = boot();
        io.disconnect();
      }
    }, { rootMargin: '250px' });

    io.observe(host);
    return () => {
      io.disconnect();
      teardown();
    };
  }, []);

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
          <Orbit size={13} weight="bold" className="text-blue-400" />
          playroom · drag to orbit
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          {live ? 'engine live' : 'engine idle'}
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500 md:flex">
          <SquareLogo size={12} weight="bold" /> click an artifact to play
        </div>
      </div>
    </div>
  );
}

export default function Games() {
  const [openGame, setOpenGame] = useState(null);

  return (
    <section id="games" className="section-gap relative px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-b right-[-6%] top-[16%] h-[400px] w-[400px] bg-rose-500/12" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-display-2 italic">
              Playable <span className="gradient-text">Experiments</span>
            </h2>
          </div>
          <p className="max-w-sm text-body-sm">
            Five hand-built engines running on raw canvas. Launch one from a card, or click its
            artifact floating in the scene.
          </p>
        </div>

        <div className="mb-12">
          <Playroom />
        </div>

        {/* Bento Grid - 5 games, no empty cells */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense">
          <GameCard key={`${GAMES[0].name}-hero`} game={GAMES[0]} index={0} isHero />
          {GAMES.slice(1).map((game, i) => (
            <GameCard key={game.name} game={game} index={i + 1} isHero={false} />
          ))}
        </div>
      </div>

      {GAMES.map((game) => (
        <GameOverlay
          key={game.name}
          {...game}
          onClose={() => setOpenGame(null)}
        />
      ))}
    </section>
  );
}