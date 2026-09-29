import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'booting renderer',
  'compiling shaders',
  'building constellation',
  'linking sections',
];

export default function Preloader({ onDone, duration = 1500 }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setDone(true);
        setTimeout(() => onDone?.(), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, onDone]);

  const step = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  return (
    <div className={`boot-veil ${done ? 'is-done' : ''}`} role="status" aria-live="polite">
      <div className="w-[min(420px,80vw)]">
        <div className="mb-6 flex items-end justify-between">
          <span className="text-3xl font-black tracking-tighter">
            LB<span className="text-blue-500">.</span>
          </span>
          <span className="font-mono text-xs tabular-nums text-zinc-500">
            {String(Math.round(progress * 100)).padStart(3, '0')}%
          </span>
        </div>

        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"
            style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(59, 130, 246, 0.8)' }}
          />
        </div>

        <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          {STEPS[step]}
          <span className="ml-1 inline-block animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}