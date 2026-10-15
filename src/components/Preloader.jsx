import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'booting renderer',
  'compiling shaders',
  'building constellation',
  'linking sections',
];

// The veil used to be a fixed 1500 ms + 700 ms timer — a hard tax on every
// visit regardless of whether the app was ready in 300 ms. Now it tracks real
// readiness, holds a short brand beat, and skips itself entirely for repeat
// visits within the same session.
const MIN_DISPLAY_MS = 400;
const FONT_PATIENCE_MS = 600;
const MAX_WAIT_MS = 2000;
const SESSION_KEY = 'boot-veil-shown';

export default function Preloader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // Keep the callback out of the effect's deps: App passes a fresh arrow each
  // render, which would otherwise restart the boot sequence.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;

    let repeatVisit = false;
    try {
      repeatVisit = sessionStorage.getItem(SESSION_KEY) === '1';
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Private mode / storage disabled: treat as a first visit.
    }

    // Readiness = page load + a painted frame. Fonts are waited for only
    // briefly: `font-display: swap` means text paints immediately in the
    // fallback face and swaps when the woff2 lands, and on a cold cache the
    // full font wait held the veil for ~3 s. Everything runs on frames, not
    // timers — the 3D engine booting behind the veil starved setTimeout badly
    // enough to strand visitors behind the inert shell.
    let fontsReady = false;
    document.fonts?.ready.then(() => {
      fontsReady = true;
    });

    let readyAt = 0; // frame at which readiness was established
    let finished = false;

    const beat = repeatVisit ? 0 : MIN_DISPLAY_MS;
    const tick = (now) => {
      const elapsed = now - start;
      if (!fontsReady && elapsed < FONT_PATIENCE_MS) {
        // Ease toward 90% while waiting; the last 10% lands on completion.
        setProgress(Math.min(0.9, (elapsed / MAX_WAIT_MS) * 0.9));
      } else {
        if (!readyAt) readyAt = now;
        const t = Math.min(1, (now - readyAt) / beat);
        setProgress(0.9 + t * 0.1);
        if (t >= 1 && !finished) {
          finished = true;
          setDone(true);
          // Called straight from the frame callback: no trailing timer that
          // main-thread contention could delay while the shell is inert.
          onDoneRef.current?.();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  const step = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  return (
    <>
      {/* Decorative boot sequence. The veil re-renders every frame, so it is
          hidden from assistive tech; a single sr-only announcement fires once
          when loading completes (see below). */}
      <div className={`boot-veil ${done ? 'is-done' : ''}`} aria-hidden="true">
        <div className="w-[min(420px,80vw)]">
          <div className="mb-6 flex items-end justify-between">
            <span className="text-3xl font-black tracking-tighter">
              LB<span className="text-white">.</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-zinc-400">
              {String(Math.round(progress * 100)).padStart(3, '0')}%
            </span>
          </div>

          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-white via-zinc-300 to-zinc-500"
              style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(255, 255, 255, 0.35)' }}
            />
          </div>

          <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
            {STEPS[step]}
            <span className="ml-1 inline-block animate-pulse">_</span>
          </div>
        </div>
      </div>

      {/* One announcement for the whole boot, not one per frame */}
      <span role="status" className="sr-only">
        {done ? 'Experience ready' : 'Loading experience'}
      </span>
    </>
  );
}
