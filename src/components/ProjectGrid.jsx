import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Github, Zap, Globe, Layers, Code2, MousePointer2, ExternalLink, ChevronRight } from 'lucide-react';

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
    github: "#",
    featured: true
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
    github: "#",
    featured: false
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
    github: "#",
    featured: false
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
    github: "#",
    featured: false
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
    github: "#",
    featured: false
  }
];

const ProjectCard = ({ project, index, isFeatured }) => {
  const cardRef = useRef(null);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden double-bezel p-8 hover-lift card-glow spotlight ${
        project.size === 'large' ? 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2' : ''
      } ${project.size === 'medium' ? 'col-span-1 lg:col-span-1' : ''}`}
      style={{
        gridRow: project.size === 'large' ? 'span 2' : 'span 1',
        gridColumn: project.size === 'large' ? 'span 2' : 'span 1'
      }}
      data-index={index}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`} />

      <div className="relative h-full flex flex-col justify-between group">
        <div className="flex justify-between items-start">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <div className="text-purple-400">{project.icon}</div>
          </div>
          <a
            href={project.link}
            className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors group-hover:scale-110"
            aria-label={`View ${project.title} live demo`}
          >
            <ExternalLink size={20} className="text-zinc-400 hover:text-white transition-colors" />
          </a>
        </div>

        <div className="mt-12">
          <p className="text-label mb-2">{project.category}</p>
          <h3 className="text-display-1 italic mb-4">
            {project.title}
          </h3>
          <p className="text-body-sm mb-6 line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300 transition-colors group-hover:scale-105"
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
              className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors group hover:translate-x-1"
            >
              <Github size={16} /> Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectGrid = () => {
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const linkRef = useRef(null);
  const [visibleCards, setVisibleCards] = useState(new Set());

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
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

      // Card stagger reveal with ScrollTrigger
      const cards = gridRef.current?.querySelectorAll('[data-index]') || [];
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        scale: 0.97,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
        }
      });

    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={gridRef} id="projects" className="section-gap px-6 bg-zinc-950/50 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="section-container relative z-10">
        <div ref={headerRef} className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6">
          <div>
            <span className="text-label mb-4 block">Selected Works</span>
            <p className="text-display-2 italic">
              Digital <span className="animated-gradient-text">Frontiers</span>
            </p>
          </div>
          <a ref={linkRef} href="#" className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-medium active-press">
            View All Archive <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Gapless Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ gridAutoFlow: 'dense' }}>
          {projects.map((project, idx) => (
            <ProjectCard key={idx} project={project} index={idx} isFeatured={project.featured} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;