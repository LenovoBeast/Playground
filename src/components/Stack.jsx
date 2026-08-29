import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Server, Database, Layers, GitBranch,
  Cloud, Cpu, Globe, Code2, Settings, Zap, Shield
} from 'lucide-react';

const categories = [
  {
    id: 'frontend',
    label: 'Frontend',
    icon: Code2,
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    tech: [
      { name: 'React 18', desc: 'Concurrent features, Server Components' },
      { name: 'TypeScript', desc: 'Strict mode, advanced types' },
      { name: 'Tailwind CSS', desc: 'Utility-first, custom design system' },
      { name: 'Framer Motion', desc: 'Production animations, layout engine' },
      { name: 'Vite', desc: 'Lightning-fast HMR, optimized builds' },
      { name: 'React Three Fiber', desc: 'React renderer for Three.js' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    icon: Server,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    tech: [
      { name: 'Node.js', desc: 'Fastify, Express, native modules' },
      { name: 'Bun', desc: 'All-in-one runtime, bundler, test runner' },
      { name: 'PostgreSQL', desc: 'Advanced indexing, JSONB, full-text' },
      { name: 'Redis', desc: 'Caching, pub/sub, streams, Lua scripting' },
      { name: 'GraphQL', desc: 'Apollo, Yoga, federation, subscriptions' },
      { name: 'tRPC', desc: 'End-to-end type safety, zero runtime' },
    ],
  },
  {
    id: 'gamedev',
    label: 'Game Dev',
    icon: Cpu,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    tech: [
      { name: 'WebGL / WebGPU', desc: 'Custom shaders, compute pipelines' },
      { name: 'Three.js / R3F', desc: 'Scene graphs, post-processing, physics' },
      { name: 'Phaser 3', desc: '2D game framework, multiplayer ready' },
      { name: 'WebAssembly', desc: 'Rust/C++ compilation, near-native speed' },
      { name: 'ECS Architecture', desc: 'Bevy-inspired, data-oriented design' },
      { name: 'Socket.io / WebRTC', desc: 'Real-time networking, deterministic sync' },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    icon: Cloud,
    color: 'from-orange-500 to-yellow-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    tech: [
      { name: 'Docker / Kubernetes', desc: 'Container orchestration, Helm charts' },
      { name: 'Cloudflare Workers', desc: 'Edge compute, Durable Objects, R2' },
      { name: 'Vercel / Netlify', desc: 'Edge functions, ISR, preview deploys' },
      { name: 'GitHub Actions', desc: 'CI/CD, matrix builds, release automation' },
      { name: 'Terraform', desc: 'Infrastructure as code, multi-cloud' },
      { name: 'Observability', desc: 'OpenTelemetry, Grafana, Loki, Tempo' },
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
};

const techItemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  }),
  exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const tabVariants = {
  initial: { backgroundColor: 'rgba(255,255,255,0.03)' },
  hover: { backgroundColor: 'rgba(255,255,255,0.08)', x: 4 },
  active: { backgroundColor: 'rgba(168, 85, 247, 0.15)', x: 4 },
};

const Stack = () => {
  const [activeCategory, setActiveCategory] = useState('frontend');

  const activeCat = categories.find(c => c.id === activeCategory);

  return (
    <section className="py-24 px-6 bg-obsidian relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-emerald-600/5" />
      <div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none"
        style={{ animation: 'float 18s ease-in-out infinite' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div>
            <motion.span className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block">
              Tech Stack
            </motion.span>
            <motion.h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
              Powered by <span className="gradient-text">Modern Tooling</span>
            </motion.h2>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="flex flex-wrap gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-medium text-sm transition-all ${
                activeCategory === cat.id
                  ? 'text-white border border-white/10'
                  : 'text-gray-400 hover:text-white'
              }`}
              variants={tabVariants}
              initial="initial"
              animate={activeCategory === cat.id ? 'active' : 'initial'}
              whileHover="hover"
              transition={{ duration: 0.2 }}
            >
              <cat.icon size={20} className={`text-${cat.color.replace('from-', '').replace(' to-', '-')} `} />
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Tech Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
          >
            {activeCat.tech.map((item, i) => (
              <motion.div
                key={item.name}
                className={`double-bezel p-5 ${activeCat.bg} ${activeCat.border} group relative overflow-hidden`}
                variants={techItemVariants(i)}
                whileHover={{ y: -4, borderColor: activeCat.color.replace('from-', '').replace(' to-', '-500/50') }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${activeCat.color}`}>
                    <activeCat.icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">{item.name}</h4>
                    <p className="text-gray-500 text-sm mt-1 truncate">{item.desc}</p>
                  </div>
                </div>
                {/* Glow on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br opacity-0"
                  style={{ background: activeCat.color }}
                  whileHover={{ opacity: 0.08 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Additional Tools Row */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h3 className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-6">
            Also Comfortable With
          </motion.h3>
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'Rust', icon: Cpu, color: 'from-orange-500 to-red-500' },
              { name: 'Go', icon: Terminal, color: 'from-cyan-500 to-blue-500' },
              { name: 'Python', icon: Code2, color: 'from-yellow-500 to-blue-500' },
              { name: 'Unity', icon: Globe, color: 'from-purple-500 to-pink-500' },
              { name: 'Unreal', icon: Cpu, color: 'from-blue-500 to-indigo-500' },
              { name: 'Blender', icon: Layers, color: 'from-orange-500 to-yellow-500' },
              { name: 'Figma', icon: Settings, color: 'from-purple-500 to-pink-500' },
              { name: 'Git', icon: GitBranch, color: 'from-orange-500 to-red-500' },
              { name: 'Linux', icon: Terminal, color: 'from-yellow-500 to-green-500' },
              { name: 'CI/CD', icon: Zap, color: 'from-emerald-500 to-teal-500' },
              { name: 'Security', icon: Shield, color: 'from-red-500 to-pink-500' },
              { name: 'AI/ML', icon: Globe, color: 'from-purple-500 to-cyan-500' },
            ].map((tool) => (
              <motion.button
                key={tool.name}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-sm font-medium transition-all active:scale-95"
                whileHover={{ y: -2, scale: 1.02 }}
                style={{ borderColor: tool.color.replace('from-', '').replace(' to-', '-500/30') }}
              >
                <tool.icon size={16} className="text-purple-400" />
                {tool.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateX(0) scale(1); }
            50% { transform: translateX(-30px) scale(1.03) translateY(-15px); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default Stack;