import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, DesktopTower, GameController, Database, Check, ArrowRight } from '@phosphor-icons/react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { useScrollTriggerRefresh } from '../hooks/useScrollTriggerRefresh.js';

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

export default function Stack() {
  const [activeTab, setActiveTab] = useState('frontend');
  const [selected, setSelected] = useState(0);
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Swapping tab panels changes panel height; keep triggers honest.
  useScrollTriggerRefresh(activeTab);

  const category = categories.find((c) => c.id === activeTab) ?? categories[0];

  // WAI-ARIA tabs pattern: arrows move between tabs, Home/End jump to the ends.
  const onTabKeyDown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = categories.findIndex((c) => c.id === activeTab);
    const last = categories.length - 1;
    let next = i;
    if (e.key === 'ArrowRight') next = i >= last ? 0 : i + 1;
    if (e.key === 'ArrowLeft') next = i <= 0 ? last : i - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = last;
    const cat = categories[next];
    setActiveTab(cat.id);
    setSelected(0);
    requestAnimationFrame(() => {
      tabsRef.current?.querySelector(`#tab-${cat.id}`)?.focus();
    });
  };

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
    <section ref={sectionRef} id="stack" className="section-gap relative px-6" data-tracking="stack-section" aria-labelledby="stack-title">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-c left-1/2 top-[12%] h-[460px] w-[460px] -translate-x-1/2 bg-blue-600/12" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="mb-14">
          <h2 id="stack-title" className="text-display-2 italic leading-[1.02]">
            Engineered with <span className="gradient-text">Precision</span>
          </h2>
        </div>

        <div
          ref={tabsRef}
          className="mb-12 flex flex-wrap gap-3"
          role="tablist"
          aria-label="Tech categories"
          onKeyDown={onTabKeyDown}
        >
          {categories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${cat.id}`}
                id={`tab-${cat.id}`}
                tabIndex={isActive ? 0 : -1}
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
          {/* Focus spotlight — preview of the active tech. Contained inside
              the panel so nothing can overlap the card grid on the right. */}
          <FocusPanel
            key={category.id}
            items={category.items}
            color={category.color}
            glow={category.glow}
            selected={selected}
            onSelect={setSelected}
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
                  className={`panel spotlight group relative p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                    selected === i ? 'border-white/20' : ''
                  }`}
                  style={{ transitionDelay: `${i * 25}ms` }}
                  aria-pressed={selected === i}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${category.color} transition-transform duration-300 group-hover:scale-110`}>
                      <Check size={16} weight="bold" className="text-white" />
                    </span>
                    <h3 className="text-base font-bold tracking-tight">{item.name}</h3>
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
          <h3 className="mb-8 text-center text-label">Open Source &amp; Tooling</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Vite', 'React', 'Tailwind', 'Three.js', 'GSAP', 'Framer Motion', 'Playwright', 'Node test runner'].map((tool) => (
              <a
                key={tool}
                href={`https://github.com/search?q=${tool}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/8 bg-zinc-950/70 px-4 py-2 text-sm font-medium text-zinc-400 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:text-white active-press"
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

function FocusPanel({ items, color, glow, selected, onSelect }) {
  const panelRef = useRef(null);
  const focus = items[selected] ?? items[0];
  const indexLabel = `${String(selected + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;

  // Pointer-tracked sheen position, written as CSS vars on the panel.
  // Everything stays inside the panel rectangle (overflow-hidden on the
  // panel) so nothing projects into the right-hand card grid.
  const onPointerMove = (e) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    panel.style.setProperty('--fx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    panel.style.setProperty('--fy', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <div className="relative">
      <div
        ref={panelRef}
        onPointerMove={onPointerMove}
        className="focus-panel panel relative flex h-[380px] flex-col items-center overflow-hidden p-7 text-center sm:h-[420px]"
        style={{ boxShadow: `0 30px 70px -30px ${glow}`, '--focus-glow': glow }}
      >
        {/* Ambient rotating glow + pointer sheen, both clipped to the panel. */}
        <div aria-hidden="true" className="focus-ambient" />
        <div aria-hidden="true" className="focus-sheen" />

        <div className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={focus?.name}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[20rem]"
            >
              <p className="text-label">{indexLabel}</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{focus?.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">{focus?.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tech dock: small clickable pills. flex-wrap keeps long names
            (Cloudflare Workers, React Three Fiber) inside the panel so they
            never collide with the cards on the right. */}
        <div
          className="relative z-10 flex w-full flex-wrap justify-center gap-1.5"
          role="tablist"
          aria-label="Tech in focus"
        >
          {items.map((item, i) => {
            const isActive = selected === i;
            return (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={item.name}
                tabIndex={0}
                onClick={() => onSelect(i)}
                className={`focus-pill ${isActive ? `bg-gradient-to-r ${color} is-active` : ''}`}
                style={isActive ? { boxShadow: `0 8px 22px -10px ${glow}` } : undefined}
              >
                <span className="focus-pill-label">{item.name}</span>
              </button>
            );
          })}
        </div>

        <span className="pointer-events-none relative z-10 mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
          focus · click any to preview
        </span>
      </div>
    </div>
  );
}
