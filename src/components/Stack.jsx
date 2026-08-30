import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence } from 'framer-motion';
import { Cpu, Server, Gamepad2, Database, Zap, Layers, Globe, Terminal, Github, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    id: 'frontend',
    label: 'Frontend',
    icon: <Cpu size={24} />,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/20',
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
    icon: <Server size={24} />,
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
    border: 'border-cyan-500/20',
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
    icon: <Gamepad2 size={24} />,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
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
    icon: <Database size={24} />,
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10',
    border: 'border-orange-500/20',
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

const Stack = () => {
  const [activeTab, setActiveTab] = useState('frontend');
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        }
      });

      gsap.from(tabsRef.current?.children || [], {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: tabsRef.current,
          start: 'top 85%',
        }
      });

      gsap.from(contentRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: contentRef.current,
          start: 'top 85%',
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="stack"
      className="py-24 md:py-32 lg:py-40 px-6 bg-obsidian relative"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div ref={headerRef} className="mb-16">
          <span className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block">
            Tech Stack
          </span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
            Engineered with <span className="gradient-text">Precision</span>
          </h2>
        </div>

        <div ref={tabsRef} className="flex flex-wrap gap-3 mb-12" role="tablist" aria-label="Tech categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeTab === cat.id}
              aria-controls={`panel-${cat.id}`}
              id={`tab-${cat.id}`}
              onClick={() => setActiveTab(cat.id)}
              className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === cat.id
                  ? 'bg-gradient-to-r text-white shadow-xl'
                  : 'glass hover:bg-white/10 text-gray-300'
              } ${cat.color.replace('from-', 'from-').replace('to-', ' to-')}`}
              style={{
                boxShadow: activeTab === cat.id ? `0 20px 40px -10px ${cat.color.replace('from-', '').replace(' to-', ', ')}` : 'none'
              }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === cat.id ? 'bg-white/20' : 'bg-white/5'}`}>
                {cat.icon}
              </div>
              {cat.label}
              {activeTab === cat.id && (
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <div
            ref={contentRef}
            key={activeTab}
            className="relative"
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            {categories.map((cat) => (
              cat.id === activeTab && (
                <div className={`relative ${cat.bg} ${cat.border} border rounded-3xl p-8 md:p-12`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {cat.items.map((item, i) => (
                      <div
                        key={item.name}
                        className="group relative p-5 glass-strong rounded-2xl hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          transitionDelay: `${i * 30}ms`
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                            <Zap size={20} className="text-white" />
                          </div>
                          <h4 className="font-black text-lg">{item.name}</h4>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight size={16} className={`text-white/50 ${cat.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </AnimatePresence>

        <div className="mt-16 pt-16 border-t border-white/10">
          <h3 className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-8 text-center">
            Open Source & Tooling
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {['Vite', 'React', 'Tailwind', 'TypeScript', 'GSAP', 'Framer Motion', 'Playwright', 'Vitest', 'ESLint', 'Prettier'].map((tool) => (
              <a
                key={tool}
                href={`https://github.com/search?q=${tool}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 glass hover:bg-white/10 rounded-xl text-sm font-medium transition-colors group hover:scale-105"
              >
                {tool}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stack;