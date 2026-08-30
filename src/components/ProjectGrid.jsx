import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Github, Zap, Globe, Layers, Code2, MousePointer2, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

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
    size: "medium",
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
    size: "small",
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

const ProjectCard = ({ project, index }) => (
  <div
    className={`relative overflow-hidden double-bezel p-8 ${
      project.size === 'large' ? 'col-span-2 row-span-2' : ''
    } ${project.size === 'medium' ? 'col-span-1' : ''}`}
    style={{
      gridRow: project.size === 'large' ? 'span 2' : 'span 1',
      gridColumn: project.size === 'large' ? 'span 2' : 'span 1'
    }}
    data-index={index}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

    <div className="relative h-full flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <div className="text-purple-400">{project.icon}</div>
        </div>
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors group-hover:scale-110">
          <ExternalLink size={20} className="text-gray-400 hover:text-white transition-colors" />
        </div>
      </div>

      <div className="mt-12">
        <p className="text-gray-500 font-mono text-xs mb-2 uppercase tracking-widest">
          {project.category}
        </p>
        <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-4">
          {project.title}
        </h3>
        <p className="text-gray-400 mb-6 line-clamp-3 leading-relaxed">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200 transition-colors group-hover:scale-105"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <a
            href={project.link}
            className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group hover:translate-x-1"
          >
            Live Demo <ArrowUpRight size={16} />
          </a>
          <a
            href={project.github}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors group hover:translate-x-1"
          >
            <Github size={16} /> Source
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ProjectGrid = () => {
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const linkRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current?.children?.[0]?.children || [], {
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

      gsap.from(linkRef.current, {
        x: 40,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
        }
      });

      const cards = gridRef.current?.querySelectorAll('[data-index]') || [];
      gsap.from(cards, {
        y: 80,
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
        }
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 md:py-32 lg:py-40 px-6 bg-obsidian relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div ref={gridRef} className="max-w-7xl mx-auto relative z-10">
        <div ref={headerRef} className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6">
          <div>
            <span className="text-purple-500 font-mono tracking-[0.2em] uppercase text-sm mb-4 block">
              Selected Works
            </span>
            <p className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase italic">
              Digital <span className="gradient-text">Frontiers</span>
            </p>
          </div>
          <a ref={linkRef} href="#" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium">
            View All Archive <ArrowUpRight size={20} className="ml-2" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridAutoFlow: 'dense' }}>
          {projects.map((project, idx) => (
            <ProjectCard key={idx} project={project} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;