import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, DesktopTower, GameController, Database, Check, ArrowRight } from '@phosphor-icons/react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const categories = [
  {
    id: 'frontend',
    label: 'Frontend',
    icon: <Cpu size={22} weight="bold" />,
    color: 'from-blue-500 to-indigo-500',
    glow: 'rgba(59,130,246,0.35)',
    items: [
      { name: 'React 18', desc: 'Concurrent features, Suspense, Server Components' },
      { name: 'TypeScript', desc: 'Strict mode, advanced types, type-safe APIs' },
      { name: 'Framer Motion', desc: 'Production animations, layout transitions' },
      { name: 'Tailwind CSS', desc: 'Utility-first, JIT, design tokens' },
      { name: 'Vite', desc: 'Lightning-fast HMR, optimized builds' },
      { name: 'React Router 7', desc: 'File-based routing, loaders, actions' },
    ]
  },
  {
    id: 'backend',
    label: 'Backend',
    icon: <DesktopTower size={22} weight="bold" />,
    color: 'from-cyan-500 to-blue-500',
    glow: 'rgba(34,211,238,0.35)',
    items: [
      { name: 'Node.js', desc: 'Native ES modules, worker threads, perf hooks' },
      { name: 'PostgreSQL', desc: 'Advanced queries, JSONB, partitioning' },
      { name: 'Redis', desc: 'Caching, pub/sub, streams, Lua scripting' },
      { name: 'Docker', desc: 'Multi-stage builds, compose, k8s ready' },
      { name: 'Cloudflare Workers', desc: 'Edge compute, KV, Durable Objects' },
      { name: 'GraphQL', desc: 'Federation, subscriptions, codegen' },
    ]
  },
  {
    id: 'gamedev',
    label: 'Game Dev',
    icon: <GameController size={22} weight="bold" />,
    color: 'from-emerald-500 to-teal-500',
    glow: 'rgba(52,211,153,0.35)',
    items: [
      { name: 'React Three Fiber', desc: 'Declarative Three.js, React ecosystem' },
      { name: 'Phaser 3', desc: '2D games, WebGL/Canvas, multiplayer' },
      { name: 'GSAP', desc: 'High-performance animation, ScrollTrigger' },
      { name: 'WebGPU', desc: 'Compute shaders, next-gen graphics' },
      { name: 'Wasm/Rust', desc: 'Near-native performance, game logic' },
      { name: 'Socket.io', desc: 'Real-time multiplayer, WebSocket abstraction' },
    ]
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    icon: <Database size={22} weight="bold" />,
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(251,146,60,0.35)',
    items: [
      { name: 'GitHub Actions', desc: 'CI/CD, matrix builds, custom runners' },
      { name: 'Playwright', desc: 'E2E testing, visual regression, tracing' },
      { name: 'Netlify', desc: 'Edge functions, forms, analytics, previews' },
      { name: 'Vercel', desc: 'Serverless, ISR, edge middleware' },
      { name: 'Terraform', desc: 'IaC, modules, state management' },
      { name: 'Observability', desc: 'Logs, metrics, traces, alerting' },
    ]
  },
];

const RADIUS = 175;

export default function Stack() {
  const [activeTab, setActiveTab] = useState('frontend');
  const [selected, setSelected] = useState(0);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const category = categories.find((c) => c.id === activeTab) ?? categories[0];

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.children || [], {
        y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: headerRef.current, start: 'top 85%' },
      });
      gsap.from(tabsRef.current?.children || [], {
        y: 28, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: tabsRef.current, start: 'top 88%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} id="stack" className="section-gap relative px-6" data-tracking="stack-section">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-c left-1/2 top-[12%] h-[460px] w-[460px] -translate-x-1/2 bg-blue-600/12" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="mb-14">
          <h2 className="text-display-2 italic leading-[1.02]">
            Engineered with <span className="gradient-text">Precision</span>
          </h2>
        </div>

        <div ref={tabsRef} className="mb-12 flex flex-wrap gap-3" role="tablist" aria-label="Tech categories">
          {categories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${cat.id}`}
                id={`tab-${cat.id}`}
                onClick={() => { setActiveTab(cat.id); setSelected(0); }}
                className={`relative flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold transition-all duration-300 active-press ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
                style={isActive ? { boxShadow: `0 22px 48px -18px ${cat.glow}` } : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="stack-tab-bg"
                    className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r ${cat.color}`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {!isActive && (
                  <span className="absolute inset-0 -z-10 rounded-2xl border border-white/8 bg-white/[0.03]" />
                )}
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12"
        >
          {/* Interactive 3D orbit */}
          <OrbitRing
            key={category.id}
            items={category.items}
            glow={category.glow}
            selected={selected}
            onSelect={setSelected}
            reducedMotion={reducedMotion}
          />

          {/* Detail grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {category.items.map((item, i) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setSelected(i)}
                  className={`panel group relative p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                    selected === i ? 'border-white/20' : ''
                  }`}
                  style={{ transitionDelay: `${i * 25}ms` }}
                  aria-pressed={selected === i}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${category.color} transition-transform duration-300 group-hover:scale-110`}>
                      <Check size={16} weight="bold" className="text-white" />
                    </span>
                    <h4 className="text-base font-bold tracking-tight">{item.name}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
                  <span className={`absolute bottom-4 right-4 transition-opacity duration-300 ${selected === i ? 'opacity-100' : 'opacity-0'}`}>
                    <ArrowRight size={15} weight="bold" className="text-white/60" />
                  </span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-20 border-t border-white/8 pt-14">
          <h3 className="mb-8 text-center text-label">Open Source & Tooling</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Vite', 'React', 'Tailwind', 'TypeScript', 'GSAP', 'Framer Motion', 'Playwright', 'Vitest', 'ESLint', 'Prettier'].map((tool) => (
              <a
                key={tool}
                href={`https://github.com/search?q=${tool}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-400 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:text-white active-press"
              >
                {tool}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrbitRing({ items, glow, selected, onSelect, reducedMotion }) {
  const ringRef = useRef(null);
  const tokenRefs = useRef([]);
  const spin = useRef(0);
  const velocity = useRef(0.18);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    tokenRefs.current = tokenRefs.current.slice(0, items.length);
    let raf = 0;
    let last = performance.now();

    const render = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!dragging.current) {
        velocity.current += (0.18 - velocity.current) * Math.min(1, dt * 1.6);
      }
      spin.current += velocity.current * (reducedMotion ? 0 : dt * 60);
      if (ringRef.current) {
        ringRef.current.style.transform = `rotateX(-12deg) rotateY(${spin.current.toFixed(2)}deg)`;
      }
      tokenRefs.current.forEach((el, i) => {
        if (!el) return;
        const angle = (i / items.length) * 360;
        el.style.transform = `rotateY(${angle}deg) translateZ(${RADIUS}px) rotateY(${(-angle - spin.current).toFixed(2)}deg)`;
      });
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [items.length, reducedMotion]);

  const onPointerDown = (e) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    velocity.current = dx * 0.35;
    spin.current += dx * 0.35;
  };
  const stop = (e) => {
    dragging.current = false;
    e?.currentTarget?.releasePointerCapture?.(e.pointerId);
  };

  const focusIndex = hovered ?? selected;
  const focus = items[focusIndex] ?? items[0];

  return (
    <div className="relative">
      <div
        className="panel relative flex h-[380px] cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing sm:h-[440px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={(e) => { stop(e); setHovered(null); }}
        style={{ perspective: '1000px', touchAction: 'none' }}
      >
        {/* Core readout */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div
            className="absolute h-40 w-40 rounded-full blur-3xl"
            style={{ background: glow, opacity: 0.35 }}
          />
          <div className="relative z-10 max-w-[16rem] px-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={focus?.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {String(focusIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </p>
                <h4 className="mt-2 text-2xl font-black tracking-tight">{focus?.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{focus?.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Orbiting tokens */}
        <div
          ref={ringRef}
          className="pointer-events-none relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, i) => (
            <button
              type="button"
              key={item.name}
              ref={(el) => { tokenRefs.current[i] = el; }}
              onClick={() => onSelect(i)}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              className="pointer-events-auto absolute left-1/2 top-1/2 -ml-[86px] -mt-[21px] w-[172px] rounded-full border px-4 py-2.5 text-center text-xs font-semibold backdrop-blur-md transition-colors duration-300"
              style={{
                transformStyle: 'preserve-3d',
                borderColor: focusIndex === i ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
                background: focusIndex === i ? 'rgba(255,255,255,0.14)' : 'rgba(9,9,14,0.55)',
                color: focusIndex === i ? '#fff' : 'rgba(228,228,231,0.75)',
                boxShadow: focusIndex === i ? `0 0 26px -4px ${glow}` : 'none',
              }}
            >
              {item.name}
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
          drag to rotate
        </span>
      </div>
    </div>
  );
}
