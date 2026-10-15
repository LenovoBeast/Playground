import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, GithubLogo, Code, Globe, Stack, ArrowSquareOut, Funnel } from '@phosphor-icons/react';
import { projects } from '../data/projects.js';
import { useTilt } from '../hooks/useTilt.js';
import { useScrollTriggerRefresh } from '../hooks/useScrollTriggerRefresh.js';

const UI = {
  TypeScript: { color: 'from-white to-zinc-300', icon: <Code size={26} weight="bold" />, tint: 'rgba(255,255,255,0.12)' },
  JavaScript: { color: 'from-zinc-200 to-zinc-400', icon: <Globe size={26} weight="bold" />, tint: 'rgba(228,228,231,0.12)' },
  HTML: { color: 'from-zinc-100 to-zinc-300', icon: <Stack size={26} weight="bold" />, tint: 'rgba(255,255,255,0.10)' },
};

const ProjectCard = ({ project, index }) => {
  const ui = UI[project.language] ?? UI.JavaScript;
  const tilt = useTilt({ max: 7, scale: 1.02, lift: 18 });

  // Thumbnails are vendored locally (public/img/projects). Resolve against the
  // Vite base so paths work when the site is served from a subdirectory.
  const thumbSrc = `${import.meta.env.BASE_URL}${project.thumbnail}`;

  return (
    <div
      className="tilt-scene group h-full"
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      data-tracking="project-card"
      data-project={project.title}
    >
      <div ref={tilt.ref} className="tilt-body h-full">
        <article className="panel corner-frame relative flex h-full flex-col justify-between overflow-hidden p-7 md:p-8">
          {/* Card-wide glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: `radial-gradient(120% 90% at 12% 0%, ${ui.tint} 0%, transparent 62%)` }}
          />
          <div className="tilt-sheen" />

          {/* Thumbnail */}
          <div className="relative -mx-8 -mt-8 mb-6 h-40 md:h-48 rounded-[1rem] overflow-hidden bg-zinc-900">
            <img
              src={thumbSrc}
              alt={project.thumbnailAlt}
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          <div className="relative flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-zinc-200 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
              style={{ transform: 'translateZ(30px)' }}
            >
              {ui.icon}
            </span>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/8 bg-white/[0.04] text-zinc-400 transition-all duration-300 hover:bg-white/[0.1] hover:text-white group-hover:scale-110"
              aria-label={`Open ${project.title} repository`}
              style={{ transform: 'translateZ(40px)' }}
            >
              <ArrowSquareOut size={18} weight="bold" />
            </a>
          </div>

          <div className="relative mt-6" style={{ transform: 'translateZ(22px)' }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.24em] text-zinc-400">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-label">{project.language}</span>
            </div>

            <h3 className="mb-4 text-display-1 italic leading-[1.02]">{project.title}</h3>
            <p className="mb-6 line-clamp-3 text-body-sm">{project.description}</p>

            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors group-hover:border-white/15 group-hover:text-zinc-300">
                {project.language}
              </span>
            </div>

            <div className="flex items-center gap-5 border-t border-white/8 pt-5">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-zinc-300"
              >
                Live Demo
                <ArrowUpRight size={16} weight="bold" className="transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
              </a>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-2 text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
              >
                <GithubLogo size={16} weight="bold" /> Source
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default function ProjectGrid() {
  const [filter, setFilter] = useState('All');

  // Filtering adds/removes cards and changes document height — recompute every
  // ScrollTrigger afterward or About/Stack/Games animations fire at stale
  // scroll offsets.
  useScrollTriggerRefresh(filter);

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.language)))],
    []
  );

  const visible = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.language === filter)),
    [filter]
  );

  return (
    <section id="projects" className="section-gap relative px-6" aria-labelledby="projects-title">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-b right-[-6%] top-[16%] h-[400px] w-[400px] bg-white/[0.06]" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="projects-title" className="text-display-2 italic">
              Selected <span className="gradient-text">Work</span>
            </h2>
          </div>

          {/* Faceted filter */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by language">
            <span className="mr-1 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 sm:flex">
              <Funnel size={13} weight="bold" /> filter
            </span>
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setFilter(lang)}
                aria-pressed={filter === lang}
                className={`rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-all duration-300 active-press ${
                  filter === lang
                    ? 'border-transparent bg-white text-zinc-950'
                    : 'border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-white'
                }`}
              >
                {lang}
                {lang === 'All' && (
                  <span className="ml-2 text-zinc-400">{projects.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid - gapless, dense */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 grid-flow-dense">
          <AnimatePresence mode="popLayout">
            {visible.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 34, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.55, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectCard project={project} index={projects.findIndex(p => p.id === project.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
