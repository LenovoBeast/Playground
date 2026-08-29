import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Github, Zap, Globe, Layers, Code2, MousePointer2, ExternalLink } from 'lucide-react';

const projects = [
  {
    title: "Neon Protocol",
    category: "Game Engine",
    description: "High-performance 3D game engine built with React Three Fiber, featuring real-time lighting, physics simulation, and asset streaming.",
    tags: ["React", "Three.js", "WebGL", "GLSL"],
    size: "large",
    color: "from-purple-500 to-cyan-500",
    icon: <Zap size={28} />,
    link: "#",
    github: "#"
  },
  {
    title: "Cyber Shell",
    category: "UI Kit",
    description: "Premium component library with glassmorphism aesthetics, fluid animations, and accessibility-first design for modern web apps.",
    tags: ["Framer Motion", "Tailwind", "TypeScript"],
    size: "small",
    color: "from-cyan-500 to-blue-500",
    icon: <Layers size={28} />,
    link: "#",
    github: "#"
  },
  {
    title: "Void Runner",
    category: "Web Game",
    description: "Real-time multiplayer arena shooter built with Phaser 3 and Socket.io. Features ranked matchmaking and custom maps.",
    tags: ["Phaser", "Socket.io", "Node.js"],
    size: "small",
    color: "from-pink-500 to-rose-500",
    icon: <MousePointer2 size={28} />,
    link: "#",
    github: "#"
  },
  {
    title: "Neural Nexus",
    category: "SaaS Platform",
    description: "AI-powered development platform with automated code review, intelligent suggestions, and team analytics dashboard.",
    tags: ["Next.js", "AI", "PostgreSQL", "Redis"],
    size: "medium",
    color: "from-emerald-500 to-teal-500",
    icon: <Code2 size={28} />,
    link: "#",
    github: "#"
  },
  {
    title: "Aether OS",
    category: "Dashboard",
    description: "System monitoring dashboard built with Rust and WebAssembly. Real-time metrics visualization with sub-millisecond latency.",
    tags: ["Rust", "Wasm", "Leptos", "Tauri"],
    size: "small",
    color: "from-orange-500 to-yellow-500",
    icon: <Globe size={28} />,
    link: "#",
    github: "#"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.32, 0.72, 0, 1],
    },
  },
};

const cardHoverVariants = {
  y: -8,
  scale: 1.01,
  boxShadow: '0 30px 60px -15px rgba(168, 85, 247, 0.2)',
  transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
};

const glowVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.1, transition: { duration: 0.4 } },
};

const iconVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.15, rotate: 6, transition: { duration: 0.3 } },
};

const tagVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, borderColor: 'rgba(255,255,255,0.3)', transition: { duration: 0.2 } },
};

const linkVariants = {
  hover: { x: 4, transition: { duration: 0.2 } },
};

const ProjectCard = ({ project, index }) => (
  <motion.div
    className={`relative overflow-hidden double-bezel p-8 ${
      project.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''
    } ${project.size === 'medium' ? 'md:col-span-1' : ''}`}
    style={{
      gridRow: project.size === 'large' ? 'span 2' : 'span 1',
      gridColumn: project.size === 'large' ? 'span 2' : 'span 1'
    }}
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-100px' }}
    whileHover={cardHoverVariants}
    transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
  >
    {/* Background Glow */}
    <motion.div
      className={`absolute inset-0 bg-gradient-to-br ${project.color}`}
      variants={glowVariants}
      initial="hidden"
      whileHover="visible"
    />

    <div className="relative h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center"
          variants={iconVariants}
          whileHover="hover"
        >
          <div className="text-purple-400">{project.icon}</div>
        </motion.div>
        <motion.div
          className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.1 }}
        >
          <ExternalLink size={20} className="text-gray-400 hover:text-white transition-colors" />
        </motion.div>
      </div>

      <div className="mt-12">
        <motion.p
          className="text-gray-500 font-mono text-xs mb-2 uppercase tracking-widest"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.05 }}
        >
          {project.category}
        </motion.p>
        <motion.h3
          className="text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + index * 0.05 }}
        >
          {project.title}
        </motion.h3>
        <motion.p
          className="text-gray-400 mb-6 line-clamp-3 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.05 }}
        >
          {project.description}
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 + index * 0.05 }}
        >
          {project.tags.map((tag) => (
            <motion.span
              key={tag}
              className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200 transition-colors"
              variants={tagVariants}
              whileHover="hover"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
        <motion.div
          className="flex items-center gap-4 pt-4 border-t border-white/5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.05 }}
        >
          <motion.a
            href={project.link}
            className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            variants={linkVariants}
            whileHover="hover"
          >
            Live Demo <ArrowUpRight size={16} />
          </motion.a>
          <motion.a
            href={project.github}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            variants={linkVariants}
            whileHover="hover"
          >
            <Github size={16} /> Source
          </motion.a>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] },
  },
};

const ProjectGrid = () => {
  return (
    <section className="py-24 px-6 bg-obsidian relative">
      {/* Top accent line */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        style={{ transformOrigin: 'center' }}
      />

      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div
          className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6"
          variants={headerVariants}
        >
          <div>
            <motion.span
              className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Selected Works
            </motion.span>
            <motion.p
              className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            >
              Digital <span className="gradient-text">Frontiers</span>
            </motion.p>
          </div>
          <motion.a
            href="#"
            className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ x: 4 }}
          >
            View All Archive <ArrowUpRight size={20} className="ml-2" />
          </motion.a>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ gridAutoFlow: 'dense' }}>
          {projects.map((project, idx) => (
            <ProjectCard key={idx} project={project} index={idx} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default ProjectGrid;