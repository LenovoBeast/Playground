import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Github, Code2, Globe, Layers, ExternalLink, ChevronRight } from 'lucide-react';
import { projects } from '../data/projects.js';

gsap.registerPlugin(ScrollTrigger);

// The JSON catalogue stays minimal (title/description/url/language). The
// component owns the presentation metadata, so the catalogue never needs to
// know about DOM, icons, or colour palettes.
const UI = {
  'TypeScript': { color: 'from-purple-500 to-cyan-500', icon: <Code2 size={28} /> },
  'JavaScript': { color: 'from-cyan-500 to-blue-500', icon: <Globe size={28} /> },
  'HTML': { color: 'from-pink-500 to-rose-500', icon: <Layers size={28} /> },
};

const ProjectCard = ({ project, index }) => {
  const cardRef = useRef(null);
  const ui = UI[project.language] ?? UI['JavaScript'];

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden double-bezel p-8 hover-lift card-glow spotlight"
      data-index={index}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${ui.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`} />

      <div className="relative h-full flex flex-col justify-between group">
        <div className="flex justify-between items-start">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <div className="text-purple-400">{ui.icon}</div>
          </div>
          <a
            href={project.url}
            className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors group-hover:scale-110"
            aria-label={`View ${project.title} live demo`}
          >
            <ExternalLink size={20} className="text-zinc-400 hover:text-white transition-colors" />
          </a>
        </div>

        <div className="mt-12">
          <p className="text-label mb-2">{project.language}</p>
          <h3 className="text-display-1 italic mb-4">
            {project.title}
          </h3>
          <p className="text-body-sm mb-6 line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {[project.language].map((tag) => (
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
              href={project.url}
              className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group hover:translate-x-1"
            >
              Live Demo <ArrowUpRight size={16} />
            </a>
            <a
              href={project.url}
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
        duration: 0.8,
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
        ease: 'back.out(1.4)',
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
          <a ref={linkRef} href="#contact" className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-medium active-press">
            View All Archive <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Gapless Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <ProjectCard key={project.url} project={project} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;