import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, GithubLogo, Code, Globe, Stack, ArrowSquareOut, Funnel } from '@phosphor-icons/react';
import { projects } from '../data/projects.js';
import { useTilt } from '../hooks/useTilt.js';

const UI = {
  TypeScript: { color: 'from-blue-500 to-indigo-500', icon: <Code size={26} weight="bold" />, tint: 'rgba(59,130,246,0.16)' },
  JavaScript: { color: 'from-cyan-500 to-blue-500', icon: <Globe size={26} weight="bold" />, tint: 'rgba(34,211,238,0.16)' },
  HTML: { color: 'from-emerald-500 to-teal-500', icon: <Stack size={26} weight="bold" />, tint: 'rgba(52,211,153,0.16)' },
};

const ProjectCard = ({ project, index }) => {
  const ui = UI[project.language] ?? UI.JavaScript;
  const tilt = useTilt({ max: 7, scale: 1.02, lift: 18 });

  return (
    <div
      className="tilt-scene group h-full"
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
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

          {/* Thumbnail image - unique per card */}
          <div className="relative -mx-8 -mt-8 mb-6 h-40 md:h-48 rounded-[1rem] overflow-hidden">
            <img
              src={project.thumbnail}
              alt={project.thumbnailAlt}
              width="800"
              height="600"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          <div className="relative flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-blue-300 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
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
              <span className="font-mono text-[10px] tracking-[0.24em] text-zinc-600">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-label">{project.language}</span>
            </div>

            <h3 className="mb-4 text-display-1 italic leading-[1.02]">{project.title}</h3>
            <p className="mb-6 line-clamp-3 text-body-sm">{project.description}</p>

            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 transition-colors group-hover:border-white/15 group-hover:text-zinc-300">
                {project.language}
              </span>
            </div>

            <div className="flex items-center gap-5 border-t border-white/8 pt-5">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-2 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Live Demo
                <ArrowUpRight size={16} weight="bold" className="transition-transform group-hover/link:translate-x-1 group-hover/link:-translate-y-1" />
              </a>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-white"
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

  const languages = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.language)))],
    []
  );

  const visible = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.language === filter)),
    [filter]
  );

  return (
    <section id="projects" className="section-gap relative px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="aurora aurora-b right-[-6%] top-[16%] h-[400px] w-[400px] bg-blue-500/12" />
      </div>
      <div className="hairline absolute inset-x-0 top-0" />

      <div className="section-container relative z-10">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-display-2 italic">
              Selected <span className="gradient-text">Work</span>
            </h2>
          </div>

          {/* Faceted filter */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by language">
            <span className="mr-1 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 sm:flex">
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
                    ? 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25'
                    : 'border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/15 hover:text-white'
                }`}
              >
                {lang}
                {lang === 'All' && (
                  <span className="ml-2 text-zinc-500">{projects.length}</span>
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